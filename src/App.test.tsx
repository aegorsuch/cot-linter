import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
})

describe('App platform and profile behavior', () => {
  it('resets selected profile to platform default when switching platforms from dropdown', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.selectOptions(screen.getByLabelText(/Platform/i), 'WearTAK')
    await user.click(
      screen.getByRole('button', { name: /^MIL-STD-2525D Drop$/i }),
    )

    expect(
      screen.getByRole('button', { name: /^MIL-STD-2525D Drop$/i }),
    ).toHaveClass('border-emerald-500/60')

    await user.selectOptions(screen.getByLabelText(/Platform/i), 'ATAK')

    expect(screen.getByRole('button', { name: /^SA$/i })).toHaveClass('border-emerald-500/60')
    expect(screen.getByRole('button', { name: /MIL-STD-2525D Drop \*/i })).toBeInTheDocument()
  })

  it('uses ordered submit profile options with Chat Send default and simplified actions', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: /Submit Template/i }))

    const profileSelect = screen.getByLabelText(/^Profile \/ Category$/i) as HTMLSelectElement
    const optionOrder = Array.from(profileSelect.options).map((option) => option.text)

    expect(optionOrder).toEqual([
      'Chat Send',
      'Manual Alert',
      'Manual Alert Clear',
      'MIL-STD-2525D Clear',
      'MIL-STD-2525D Drop',
      'SA',
    ])

    expect(profileSelect).toHaveValue('Chat Send')

    const submissionXml = screen.getByLabelText(/^CoT XML$/i) as HTMLTextAreaElement
    expect(submissionXml.value).toBe('')

    expect(screen.getByRole('button', { name: /Submit GitHub Issue/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Copy Submission Payload/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Done$/i })).not.toBeInTheDocument()
  })

  it('renders merged cross-platform compatibility details after XML is loaded', async () => {
    const user = userEvent.setup()

    render(<App />)

    const platformSelect = screen.getByLabelText(/Platform/i)
    await user.selectOptions(platformSelect, 'WearTAK')
    expect(platformSelect).toHaveValue('WearTAK')

    fireEvent.change(screen.getByPlaceholderText(/Paste <event>...<\/event> here/i), {
      target: {
        value:
          '<event uid="demo" type="a-f-G-U-C" time="2026-01-01T00:00:00Z" start="2026-01-01T00:00:00Z" stale="2026-01-01T01:00:00Z" how="m-g"><point lat="34.0" lon="-117.0" hae="0" ce="9999999.0" le="9999999.0"/><detail><contact callsign="ODIN"/><track speed="0.0" course="0.0"/><__group name="Dark Green" role="K9"/></detail></event>',
      },
    })

    expect(screen.getByRole('heading', { name: /Platform Compatibility Matrix/i })).toBeInTheDocument()
    expect(screen.getAllByText(/Present:/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/expected tags/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Copy missing tags for Maven/i })).toBeInTheDocument()
    expect(screen.queryByText(/Platform Rule Matrix/i)).not.toBeInTheDocument()

    const insertTakvButtons = screen.getAllByRole('button', { name: /Insert <takv>/i })
    await user.click(insertTakvButtons[0])

    const inputTextarea = screen.getByPlaceholderText(/Paste <event>...<\/event> here/i) as HTMLTextAreaElement
    expect(inputTextarea.value).toContain('<takv')
  })

  it('supports bulk insert and undo last insert', async () => {
    const user = userEvent.setup()

    render(<App />)

    fireEvent.change(screen.getByPlaceholderText(/Paste <event>...<\/event> here/i), {
      target: {
        value:
          '<event uid="demo" type="a-f-G-U-C" time="2026-01-01T00:00:00Z" start="2026-01-01T00:00:00Z" stale="2026-01-01T01:00:00Z" how="m-g"><point lat="34.0" lon="-117.0" hae="0" ce="9999999.0" le="9999999.0"/><detail><contact callsign="ODIN"/><track speed="0.0" course="0.0"/></detail></event>',
      },
    })

    await user.click(screen.getByRole('button', { name: /Bulk insert missing tags for Maven/i }))

    const inputTextarea = screen.getByPlaceholderText(/Paste <event>...<\/event> here/i) as HTMLTextAreaElement
    expect(inputTextarea.value).toContain('Maven Gateway')

    await user.click(screen.getByRole('button', { name: /Undo Last Insert/i }))
    expect(inputTextarea.value).not.toContain('Maven Gateway')

    await user.click(screen.getByRole('button', { name: /Bulk insert missing tags for Maven/i }))
    await user.click(screen.getByRole('button', { name: /Bulk insert missing tags for Lattice/i }))
    expect(inputTextarea.value).toContain('Maven Gateway')
    expect(inputTextarea.value).toContain('Lattice correlation')

    await user.click(screen.getByRole('button', { name: /Undo All Inserts/i }))
    expect(inputTextarea.value).not.toContain('Maven Gateway')
    expect(inputTextarea.value).not.toContain('Lattice correlation')
  })

  it('shows template diff preview and supports one-click XML normalizers', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: /Copy into Input/i }))
    expect(screen.getByText(/No differences between input and selected template/i)).toBeInTheDocument()

    const inputTextarea = screen.getByPlaceholderText(/Paste <event>...<\/event> here/i) as HTMLTextAreaElement

    fireEvent.change(inputTextarea, {
      target: {
        value:
          '<event uid="demo" type="a-f-G-U-C" time="2099-01-01T00:00:00Z" start="2099-01-01T00:00:00Z" stale="2099-01-01T00:05:00Z" how="m-g">\r\n<point lat="41.88" lon="-87.64" hae="180.1" ce="13.0" le="1.0" />\r\n<detail>\r\n<track speed="0.0" course="0.0" />\r\n<contact endpoint="*:-1:stcp" callsign="ODIN-WEARTAK" />\r\n<__group name="Dark Green" role="K9" />\r\n</detail>\r\n</event>\r\n\r\n\r\n',
      },
    })

    await user.click(screen.getByRole('button', { name: /Sort Detail Tags/i }))
    expect(inputTextarea.value.indexOf('<__group')).toBeLessThan(inputTextarea.value.indexOf('<contact'))
    expect(inputTextarea.value.indexOf('<contact')).toBeLessThan(inputTextarea.value.indexOf('<track'))

    await user.click(screen.getByRole('button', { name: /Format XML/i }))
    expect(inputTextarea.value).toContain('\n  <point ')

    await user.click(screen.getByRole('button', { name: /Normalize Whitespace/i }))
    expect(inputTextarea.value).not.toContain('\r')
    expect(inputTextarea.value).not.toMatch(/\n{3,}/)

    expect(screen.getByText(/Template Diff Preview/i)).toBeInTheDocument()
  })
})
