import { cleanup, render, screen } from '@testing-library/react'
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

    expect(screen.getByText(/Sample loaded from/i)).toHaveTextContent(
      'WearTAK MIL-STD-2525D Point Drop Template',
    )

    await user.selectOptions(screen.getByLabelText(/Platform/i), 'ATAK')

    expect(screen.getByText(/Sample loaded from/i)).toHaveTextContent('ATAK Starter Sample')
  })

  it('renders merged cross-platform compatibility details after XML is loaded', async () => {
    const user = userEvent.setup()

    render(<App />)

    const platformSelect = screen.getByLabelText(/Platform/i)
    await user.selectOptions(platformSelect, 'WearTAK')
    expect(platformSelect).toHaveValue('WearTAK')

    await user.click(screen.getByRole('button', { name: /Load Sample Into Input/i }))

    expect(screen.getByRole('heading', { name: /Validation Matrix/i })).toBeInTheDocument()
    expect(screen.getAllByText(/Present:/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/expected tags/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Platform Rule Matrix/i)).not.toBeInTheDocument()
  })
})
