import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildIdentity, publish, sha256 } from './release-publisher.mjs'

const env = {
  GITHUB_SHA: 'a'.repeat(40), GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '2',
  GITHUB_REPOSITORY: 'aegorsuch/cot-linter', GITHUB_SERVER_URL: 'https://github.com',
}
const identity = buildIdentity(env)
const bundle = Buffer.from('test ZIP bytes')
const checksum = Buffer.from(`${sha256(bundle)}  ${identity.bundle}\n`)

function fakeApi({ corrupt = false, staleAt = 0, newer = false, uploadFailure = false,
  badSize = false, missingRun = false, publishFailure = false } = {}) {
  const calls = []
  const assets = new Map()
  let refs = 0
  const api = async (method, path, data) => {
    calls.push({ method, path, data })
    if (path === '/git/ref/heads/main') {
      refs++
      return { object: { sha: staleAt === refs ? 'b'.repeat(40) : identity.sha } }
    }
    if (path.startsWith('/actions/')) {
      return { workflow_runs: [...(missingRun ? [] : [{ id: 123 }]), ...(newer ? [{ id: 124 }] : [])] }
    }
    if (method === 'POST') return { id: 10 }
    if (method === 'UPLOAD') {
      if (uploadFailure) throw new Error('Upload failed')
      const id = assets.size + 1
      assets.set(id, data)
      return { id, name: new URLSearchParams(path.split('?')[1]).get('name'),
        state: 'uploaded', size: badSize ? 0 : data.length }
    }
    if (method === 'DOWNLOAD') {
      return corrupt ? Buffer.from('corrupt') : assets.get(Number(path.split('/').at(-1)))
    }
    if (method === 'PATCH') return { draft: publishFailure, tag_name: identity.tag }
    throw new Error(`Unexpected API call: ${method} ${path}`)
  }
  return { api, calls }
}

test('build identity uses full SHA, run and attempt, never a semantic version', () => {
  assert.ok(identity.tag.includes(`${env.GITHUB_SHA}-run-123-attempt-2`))
  assert.ok(identity.bundle.endsWith('.zip'))
  assert.throws(() => buildIdentity({ ...env, GITHUB_SHA: 'bad' }))
  assert.throws(() => buildIdentity({ ...env, GITHUB_RUN_ID: '../123' }))
  assert.notEqual(identity.tag, buildIdentity({ ...env, GITHUB_RUN_ATTEMPT: '3' }).tag)
})

test('creates a separate draft, verifies both remote digests, then publishes without Latest', async () => {
  const { api, calls } = fakeApi()
  await publish(api, identity, bundle, checksum)
  const create = calls.find((call) => call.method === 'POST')
  assert.equal(create.data.draft, true)
  assert.equal(create.data.prerelease, true)
  assert.equal(create.data.make_latest, 'false')
  assert.equal(create.data.target_commitish, identity.sha)
  assert.ok(create.data.body.includes(identity.runUrl))
  assert.ok(create.data.body.includes(sha256(bundle)))
  assert.equal(calls.filter((call) => call.method === 'DOWNLOAD').length, 2)
  assert.equal(calls.at(-1).method, 'PATCH')
  assert.deepEqual(calls.at(-1).data, { draft: false, make_latest: 'false' })
  assert.ok(!calls.some((call) => call.method === 'DELETE'))
})

for (const [name, options, error] of [
  ['stale before creating a draft', { staleAt: 1 }, /main has moved/],
  ['stale after verifying uploads', { staleAt: 2 }, /main has moved/],
  ['newer workflow run', { newer: true }, /newer workflow run/],
  ['corrupt download', { corrupt: true }, /Remote SHA256 mismatch/],
  ['failed upload', { uploadFailure: true }, /Upload failed/],
  ['wrong upload size', { badSize: true }, /Upload verification failed/],
  ['run outside current window', { missingRun: true }, /current window/],
]) {
  test(`refuses publication: ${name}`, async () => {
    const { api, calls } = fakeApi(options)
    await assert.rejects(publish(api, identity, bundle, checksum), error)
    assert.ok(!calls.some((call) => call.method === 'PATCH' || call.method === 'DELETE'))
  })
}

test('rejects a local checksum mismatch before any remote operation', async () => {
  const { api, calls } = fakeApi()
  await assert.rejects(publish(api, identity, bundle, Buffer.from('wrong')), /Local SHA256 mismatch/)
  assert.equal(calls.length, 0)
})

test('does not claim success if GitHub does not confirm publication', async () => {
  const { api } = fakeApi({ publishFailure: true })
  await assert.rejects(publish(api, identity, bundle, checksum), /publication was not confirmed/)
})

test('prepare preserves dist and adds provenance; checksum matches exact file bytes', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'cot-linter-publisher-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  await mkdir(join(directory, 'dist'))
  await writeFile(join(directory, 'dist', 'index.html'), '<html>Built site</html>')
  const output = join(directory, 'outputs')
  const script = fileURLToPath(new URL('./release-publisher.mjs', import.meta.url))
  const options = { cwd: directory, env: { ...process.env, ...env, GITHUB_OUTPUT: output } }
  execFileSync(process.execPath, [script, 'prepare'], options)
  assert.equal(await readFile(join(directory, 'release', 'site', 'index.html'), 'utf8'),
    await readFile(join(directory, 'dist', 'index.html'), 'utf8'))
  await assert.rejects(readFile(join(directory, 'dist', 'build-info.json')), { code: 'ENOENT' })
  const info = JSON.parse(await readFile(join(directory, 'release', 'site', 'build-info.json'), 'utf8'))
  assert.equal(info.sha, identity.sha)
  assert.equal(info.runUrl, identity.runUrl)
  assert.equal(info.basePath, '/cot-linter/')
  assert.equal(info.artifactType, 'static-web-bundle')
  assert.equal(await readFile(output, 'utf8'), `bundle=${identity.bundle}\n`)
  await writeFile(join(directory, 'release', identity.bundle), bundle)
  execFileSync(process.execPath, [script, 'checksum'], options)
  assert.deepEqual(await readFile(join(directory, 'release', `${identity.bundle}.sha256`)), checksum)
})
