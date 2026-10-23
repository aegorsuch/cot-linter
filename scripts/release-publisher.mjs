import { createHash } from 'node:crypto'
import { appendFile, cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export function buildIdentity(env) {
  const { GITHUB_SHA: sha, GITHUB_RUN_ID: runId, GITHUB_RUN_ATTEMPT: attempt,
    GITHUB_REPOSITORY: repository, GITHUB_SERVER_URL: server } = env
  if (!/^[a-f0-9]{40}$/.test(sha ?? '') ||
      !/^[1-9]\d*$/.test(runId ?? '') || !/^[1-9]\d*$/.test(attempt ?? '') ||
      !/^[\w.-]+\/[\w.-]+$/.test(repository ?? '') || server !== 'https://github.com') {
    throw new Error('Invalid GitHub build identity')
  }
  const id = `${sha}-run-${runId}-attempt-${attempt}`
  return {
    sha, runId, attempt, repository,
    tag: `web-build-${id}`,
    bundle: `cot-linter-static-web-${id}.zip`,
    runUrl: `${server}/${repository}/actions/runs/${runId}/attempts/${attempt}`,
    sourceUrl: `${server}/${repository}/commit/${sha}`,
  }
}

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')

export async function assertCurrent(api, identity) {
  const ref = await api('GET', '/git/ref/heads/main')
  if (ref.object.sha !== identity.sha) throw new Error('Stale build: main has moved')
  const { workflow_runs: runs } = await api(
    'GET', '/actions/workflows/deploy-pages.yml/runs?branch=main&per_page=100',
  )
  if (!runs.some((run) => String(run.id) === identity.runId) ||
      runs.some((run) => BigInt(run.id) > BigInt(identity.runId))) {
    throw new Error('Stale build: a newer workflow run exists or this run is not in the current window')
  }
}

export async function publish(api, identity, bundle, checksum) {
  const digest = sha256(bundle)
  const expected = `${digest}  ${identity.bundle}\n`
  if (checksum.toString('utf8') !== expected) throw new Error('Local SHA256 mismatch')
  await assertCurrent(api, identity)
  // A unique tag per attempt avoids touching existing releases, notes, or assets.
  const release = await api('POST', '/releases', {
    tag_name: identity.tag,
    target_commitish: identity.sha,
    name: `CoT-Linter static web bundle - ${identity.sha.slice(0, 12)} (run ${identity.runId}.${identity.attempt})`,
    draft: true,
    prerelease: true,
    make_latest: 'false',
    body: [
      'Automated static web bundle (ZIP). Not an APK or npm package.',
      'Source-based build ID; package.json version 0.0.0 is not a release version.',
      `Source: [${identity.sha}](${identity.sourceUrl})`,
      `Workflow run: [${identity.runId}, attempt ${identity.attempt}](${identity.runUrl})`,
      'Workflow: `.github/workflows/deploy-pages.yml`',
      'Built for the existing GitHub Pages base path `/cot-linter/`.',
      'Serve with a static HTTP server at that path; do not open index.html via file://.',
      `SHA256 (${identity.bundle}): \`${digest}\``,
      'The adjacent .sha256 file is a standalone checksum, not a signature.',
    ].join('\n\n'),
  })
  const files = [
    [identity.bundle, 'Static web bundle (ZIP)', 'application/zip', bundle],
    [`${identity.bundle}.sha256`, 'SHA256 checksum (text)', 'text/plain', checksum],
  ]
  for (const [name, label, contentType, bytes] of files) {
    const asset = await api('UPLOAD', `/releases/${release.id}/assets?${new URLSearchParams({ name, label })}`,
      bytes, contentType)
    if (asset.name !== name || asset.state !== 'uploaded' || asset.size !== bytes.length) {
      throw new Error(`Upload verification failed: ${name}`)
    }
    const downloaded = await api('DOWNLOAD', `/releases/assets/${asset.id}`)
    if (sha256(downloaded) !== sha256(bytes)) throw new Error(`Remote SHA256 mismatch: ${name}`)
  }
  await assertCurrent(api, identity)
  const published = await api('PATCH', `/releases/${release.id}`, { draft: false, make_latest: 'false' })
  if (published.draft !== false || published.tag_name !== identity.tag) {
    throw new Error('Release publication was not confirmed')
  }
}

function githubApi(env, repository) {
  if (!env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required for publishing')
  return async (method, path, data, contentType) => {
    const upload = method === 'UPLOAD'
    const download = method === 'DOWNLOAD'
    const host = upload ? 'https://uploads.github.com' : 'https://api.github.com'
    const response = await fetch(`${host}/repos/${repository}${path}`, {
      method: upload ? 'POST' : download ? 'GET' : method,
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: download ? 'application/octet-stream' : 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(data ? { 'Content-Type': contentType ?? 'application/json' } : {}),
      },
      body: data ? (upload ? data : JSON.stringify(data)) : undefined,
      signal: AbortSignal.timeout(120_000),
    })
    if (!response.ok) throw new Error(`GitHub ${method} ${path}: ${response.status} ${await response.text()}`)
    return download ? Buffer.from(await response.arrayBuffer()) : response.json()
  }
}

async function main(command) {
  const identity = buildIdentity(process.env)
  const bundlePath = resolve('release', identity.bundle)
  if (command === 'prepare') {
    await mkdir('release', { recursive: true })
    await cp('dist', 'release/site', { recursive: true, errorOnExist: true, force: false })
    await writeFile('release/site/build-info.json', `${JSON.stringify({
      ...identity, artifactType: 'static-web-bundle', basePath: '/cot-linter/',
      workflow: '.github/workflows/deploy-pages.yml',
    }, null, 2)}\n`)
    if (!process.env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT is required')
    await appendFile(process.env.GITHUB_OUTPUT, `bundle=${identity.bundle}\n`)
  } else if (command === 'checksum') {
    const bytes = await readFile(bundlePath)
    await writeFile(`${bundlePath}.sha256`, `${sha256(bytes)}  ${identity.bundle}\n`)
  } else if (command === 'publish') {
    await publish(githubApi(process.env, identity.repository), identity,
      await readFile(bundlePath), await readFile(`${bundlePath}.sha256`))
  } else {
    throw new Error('Expected prepare, checksum, or publish')
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main(process.argv[2])
}
