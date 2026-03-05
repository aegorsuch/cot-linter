import { cleanup, render, screen, within } from '@testing-library/react'
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
      screen.getByRole('button', { name: /Load WearTAK MIL-STD-2525D Point Drop Template/i }),
    ).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/Platform/i), 'ATAK')

    expect(screen.getByRole('button', { name: /Load ATAK SA Template/i })).toBeInTheDocument()
  })

  it('keeps active platform unchanged when clicking rule matrix cards', async () => {
    const user = userEvent.setup()

    render(<App />)

    const platformSelect = screen.getByLabelText(/Platform/i)
    await user.selectOptions(platformSelect, 'WearTAK')
    expect(platformSelect).toHaveValue('WearTAK')

    const matrix = screen.getByTestId('platform-rule-matrix')
    await user.click(within(matrix).getByText('ATAK'))

    expect(platformSelect).toHaveValue('WearTAK')
    expect(screen.getByRole('button', { name: /Load WearTAK SA Template/i })).toBeInTheDocument()
  })
})
