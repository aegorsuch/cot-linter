import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App profile selection behavior', () => {
  it('resets selected profile to platform default when switching platforms', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: /WearTAK/i }))
    await user.click(
      screen.getByRole('button', { name: /WearTAK MIL-STD-2525D Point Drop Template/i }),
    )

    expect(
      screen.getByRole('button', { name: /Load WearTAK MIL-STD-2525D Point Drop Template/i }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /ATAK/i }))

    expect(screen.getByRole('button', { name: /Load ATAK SA Template/i })).toBeInTheDocument()
  })
})
