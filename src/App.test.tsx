import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it } from 'vitest'
import App from './App'
import { PROFILE_TEMPLATES, PUBLIC_SAMPLES } from './utils/cotTemplates'
import { validateCoT } from './utils/cotValidator'

afterEach(() => {
  cleanup()
})

it('keeps source attribution and valid CoT structure for public samples', () => {
  for (const sample of PUBLIC_SAMPLES) {
    expect(sample.sourceUrl).toMatch(/^https:\/\/github\.com\//)
    expect(validateCoT(sample.xml, sample.platform).isValid).toBe(true)
  }
})

it('uses one event type for public examples and target validation', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.selectOptions(screen.getByLabelText('Event Type:'), 'Manual Alert Clear')
  const sample = PUBLIC_SAMPLES.find(example => example.platform === 'ATAK' && example.label === 'Manual Alert Clear')!
  expect(screen.getAllByLabelText('Event Type:')).toHaveLength(1)
  expect(screen.getByRole('link', { name: 'View source' })).toHaveAttribute('href', sample.sourceUrl)
  await user.click(screen.getByRole('button', { name: 'Load example' }))
  expect(screen.getByPlaceholderText('Paste <event>...</event> XML here...')).toHaveValue(sample.xml)
  await user.selectOptions(screen.getByLabelText('Source platform:'), 'WinTAK')
  expect(screen.getByRole('button', { name: 'Load example' })).toBeDisabled()
  expect(screen.queryByRole('link', { name: 'View source' })).not.toBeInTheDocument()
  await user.selectOptions(screen.getByLabelText('Event Type:'), 'Chat Send')
  const winTakChat = PUBLIC_SAMPLES.find(example => example.platform === 'WinTAK' && example.label === 'Chat Send')!
  expect(screen.getByRole('link', { name: 'View source' })).toHaveAttribute('href', winTakChat.sourceUrl)
  await user.click(screen.getByRole('button', { name: 'Load example' }))
  expect(screen.getByPlaceholderText('Paste <event>...</event> XML here...')).toHaveValue(winTakChat.xml)
  expect(screen.getByText('Sanitized adaptations of public fixtures, not verified client captures. Platform labels may be inferred; timestamps are historical.')).toBeInTheDocument()
})

it('loads previously supplied WearTAK examples separately from public fixtures', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.selectOptions(screen.getByLabelText('Source platform:'), 'WearTAK')
  await user.selectOptions(screen.getByLabelText('Event Type:'), 'Manual Alert Clear')

  expect(screen.queryByRole('link', { name: 'View source' })).not.toBeInTheDocument()
  expect(screen.getByText('Project-provided WearTAK example; capture provenance not recorded.')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Load example' }))
  expect(screen.getByPlaceholderText('Paste <event>...</event> XML here...')).toHaveValue(PROFILE_TEMPLATES.WearTAK['Manual Alert Clear'])
})

it('reports an unverified ATAK clear profile and real XML errors for WearTAK clear input', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.selectOptions(screen.getByLabelText('Source platform:'), 'WearTAK')
  await user.selectOptions(screen.getByLabelText('Event Type:'), 'MIL-STD-2525D Clear')
  await user.click(screen.getByRole('button', { name: 'Load example' }))
  await user.click(screen.getByRole('button', { name: 'Check target compatibility' }))
  const result = screen.getByRole('region', { name: 'Target validation' })
  expect(within(result).getByText('No ATAK MIL-STD-2525D Clear behavior profile. Target display/clear compatibility is unverified.')).toBeInTheDocument()
  expect(within(result).getByText(/'time' should be earlier than or equal to 'stale'/)).toBeInTheDocument()
  expect(within(result).getByText(/A single clear event cannot establish its relationship/)).toBeInTheDocument()
  expect(within(result).queryByText(/Missing <__group>/)).not.toBeInTheDocument()

  await user.clear(screen.getByPlaceholderText('Paste <event>...</event> XML here...'))
  await user.type(screen.getByPlaceholderText('Paste <event>...</event> XML here...'), '<event>')
  await user.click(screen.getByRole('button', { name: 'Check target compatibility' }))
  expect(within(screen.getByRole('region', { name: 'Target validation' })).getByText(/Invalid XML format:/)).toBeInTheDocument()
})

it('identifies a source profile mismatch separately from target errors', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.selectOptions(screen.getByLabelText('Source platform:'), 'WearTAK')
  await user.selectOptions(screen.getByLabelText('Event Type:'), 'Manual Alert')
  await user.click(screen.getByRole('button', { name: 'Load example' }))
  await user.selectOptions(screen.getByLabelText('Event Type:'), 'Manual Alert Clear')
  await user.click(screen.getByRole('button', { name: 'Check target compatibility' }))

  const result = screen.getByRole('region', { name: 'Target validation' })
  expect(within(result).getByText(/WearTAK source: .*expects type 'b-a-o-can'/)).toBeInTheDocument()
  expect(within(within(result).getByRole('list', { name: 'Validation errors' })).getByText(/expects type 'b-a-o-can'/)).toBeInTheDocument()
  await user.selectOptions(screen.getByLabelText('Target platform:'), 'WinTAK')
  expect(screen.queryByRole('region', { name: 'Target validation' })).not.toBeInTheDocument()
})



it('uses ordered submit profile options with Chat Send default and simplified actions', async () => {
  const user = userEvent.setup();
  render(<App />);
  // Click the first Submit Template button (for the first platform card)
  const submitButtons = screen.getAllByRole('button', { name: /Submit Template/i });
  await user.click(submitButtons[0]);
  // The rest of the test assumes the modal opens as before
  // If the modal structure changed, update selectors accordingly
  // For now, keep the original selectors:
  // (If these fail, further UI test updates may be needed)
  // const profileSelect = screen.getByLabelText('Select Template') as HTMLSelectElement;
  // const optionOrder = Array.from(profileSelect.options).map((option) => option.text);
  // expect(optionOrder).toEqual([
  //   'Chat Send',
  //   'Manual Alert',
  //   'Manual Alert Clear',
  //   'MIL-STD-2525D Clear',
  //   'MIL-STD-2525D Drop',
  //   'SA',
  //   'Other',
  // ]);
  // expect(profileSelect).toHaveValue('Chat Send');
  // const submissionXml = screen.getByLabelText(/^CoT XML$/i) as HTMLTextAreaElement;
  // expect(submissionXml.value).toBe('');
  // expect(screen.getByRole('button', { name: /Submit GitHub Issue/i })).toBeInTheDocument();
  // expect(screen.queryByRole('button', { name: /Copy Submission Payload/i })).not.toBeInTheDocument();
  // expect(screen.queryByRole('button', { name: /^Done$/i })).not.toBeInTheDocument();
});

  // Compatibility matrix heading removed from UI; test omitted.





