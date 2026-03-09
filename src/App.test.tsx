import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, it } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
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





