import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TestVocacional from './TestVocacional';

const navigateMock = vi.fn();

vi.mock('@/context/AuthContextFixed', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

vi.mock('@/api', () => ({
  getTestEstado: vi.fn().mockResolvedValue({ estado: 'nuevo' }),
  startTest: vi.fn().mockResolvedValue({
    success: true,
    version: 2,
    session_id: 'session-1',
    total_items: 34,
    current_index: 0,
    phase: 'likert',
    item: { id: 1, phase: 'likert', dimension: 'I', text_es: 'Me gusta investigar', context_es: 'Contexto' },
  }),
  responderPregunta: vi.fn().mockResolvedValue({
    success: true,
    current_index: 18,
    phase: 'checklist',
    phase_transition: 'checklist',
    item: {
      id: 19,
      phase: 'checklist',
      dimension: 'S',
      text_es: 'Me interesa ayudar a otras personas',
      options: [{ label: 'Escuchar' }],
    },
    test_complete: false,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({ state: { ageGroup: 'young_adult' } }),
  };
});

describe('TestVocacional', () => {
  it('shows phase transition after submitting an answer that changes phase', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TestVocacional />
      </MemoryRouter>
    );

    await screen.findByText(/me gusta investigar/i);
    await user.click(screen.getByRole('button', { name: /^de acuerdo$/i }));
    await user.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/fase 2: actividades e intereses/i)).toBeInTheDocument();
    });
  });
});
