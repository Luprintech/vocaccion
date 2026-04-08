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
    total_items: 72,
    current_index: 0,
    phase: 'activities',
    item: { id: 1, phase: 'activities', dimension: 'I', text_es: 'Me gusta investigar', context_es: 'Contexto' },
  }),
  responderPregunta: vi.fn().mockResolvedValue({
    success: true,
    current_index: 30,
    phase: 'competencies',
    phase_transition: 'competencies',
    item: {
      id: 31,
      phase: 'competencies',
      dimension: 'S',
      text_es: 'Me interesa ayudar a otras personas',
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
      expect(screen.getByText(/fase 2: competencias/i)).toBeInTheDocument();
    });
  });
});
