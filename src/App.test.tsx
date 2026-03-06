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
      screen.getByRole('button', { name: /WearTAK MIL-STD-2525D Point Drop Template/i }),
    )

    expect(
      screen.getByRole('button', { name: /WearTAK MIL-STD-2525D Point Drop Template/i }),
    ).toHaveClass('border-emerald-500/60')

    await user.selectOptions(screen.getByLabelText(/Platform/i), 'ATAK')

    expect(screen.getByRole('button', { name: /^SA Template$/i })).toHaveClass('border-emerald-500/60')
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

    expect(screen.getByRole('heading', { name: /Validation Matrix/i })).toBeInTheDocument()
    expect(screen.getAllByText(/Present:/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/expected tags/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Platform Rule Matrix/i)).not.toBeInTheDocument()
  })
})
