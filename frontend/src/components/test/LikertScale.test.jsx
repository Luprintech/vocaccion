import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LikertScale from './LikertScale';

describe('LikertScale', () => {
  it('emits selected value when clicking an option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <LikertScale
        item={{ text_es: 'Me gusta resolver problemas', context_es: 'Piensa en tu día a día' }}
        value={null}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /^de acuerdo$/i }));

    expect(onChange).toHaveBeenCalledWith(4);
  });
});
