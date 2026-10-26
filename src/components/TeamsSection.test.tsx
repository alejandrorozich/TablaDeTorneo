import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { describe, expect, it } from 'vitest';
import { buildTournament } from '../domain/testUtils';
import { isLocked } from '../domain/tournament';
import type { Tournament } from '../domain/types';
import { initialState, tournamentReducer } from '../state/tournamentReducer';
import { TeamsSection } from './TeamsSection';

function Harness({ tournament = initialState.tournament }: { tournament?: Tournament }) {
  const [state, dispatch] = useReducer(tournamentReducer, { tournament, storageNotice: false });
  return (
    <TeamsSection
      teams={state.tournament.teams}
      locked={isLocked(state.tournament)}
      onAdd={(name) => dispatch({ type: 'teamAdded', name })}
      onRemove={(teamId) => dispatch({ type: 'teamRemoved', teamId })}
    />
  );
}

const setup = (tournament?: Tournament) => {
  const user = userEvent.setup();
  render(<Harness tournament={tournament} />);
  const input = () => screen.getByLabelText('Nombre del equipo');
  const add = async (name: string) => {
    await user.clear(input());
    if (name) await user.type(input(), name);
    await user.click(screen.getByRole('button', { name: 'Agregar equipo' }));
  };
  return { user, input, add };
};

const listedTeams = () => screen.queryAllByRole('listitem').map((li) => li.firstChild?.textContent);

describe('TeamsSection', () => {
  it('RQ-01.1 adding "Leones" lists it and shows "1 de 10 equipos"', async () => {
    const { add } = setup();
    await add('Leones');
    expect(listedTeams()).toEqual(['Leones']);
    expect(screen.getByText('1 de 10 equipos')).toBeInTheDocument();
  });

  it('RQ-01.2 shows the normalized name', async () => {
    const { add } = setup();
    await add('  River   Plate  ');
    expect(listedTeams()).toEqual(['River Plate']);
  });

  it('RQ-01.3 shows the duplicate name error', async () => {
    const { add } = setup();
    await add('River Plate');
    await add('river plate');
    expect(screen.getByRole('alert')).toHaveTextContent('Ya existe un equipo con ese nombre.');
    expect(listedTeams()).toEqual(['River Plate']);
  });

  it('RQ-01.5 shows the empty name error', async () => {
    const { add } = setup();
    await add('    ');
    expect(screen.getByRole('alert')).toHaveTextContent('El nombre del equipo no puede estar vacío.');
    expect(listedTeams()).toEqual([]);
  });

  it('RQ-01.6 shows the long name error', async () => {
    const { add } = setup();
    await add('A'.repeat(31));
    expect(screen.getByRole('alert')).toHaveTextContent('El nombre del equipo no puede tener más de 30 caracteres.');
  });

  it('RQ-01.7 lists teams in registration order', async () => {
    const { add } = setup();
    await add('Leones');
    await add('Tigres');
    await add('Pumas');
    expect(listedTeams()).toEqual(['Leones', 'Tigres', 'Pumas']);
  });

  it('RQ-01.8 after a valid add the error disappears and the field is emptied', async () => {
    const { add, input } = setup();
    await add('');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await add('Leones');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(input()).toHaveValue('');
  });

  it('RQ-02.1 with 10 teams adding another shows the maximum teams error', async () => {
    const { add } = setup(buildTournament(Array.from({ length: 10 }, (_, i) => `E${i + 1}`)));
    await add('E11');
    expect(screen.getByRole('alert')).toHaveTextContent('El torneo admite como máximo 10 equipos.');
    expect(listedTeams()).toHaveLength(10);
  });

  it('RQ-02.4 without teams shows the empty state', () => {
    setup();
    expect(screen.getByText('Todavía no hay equipos. Agrega entre 3 y 10 para armar el torneo.')).toBeInTheDocument();
  });

  it('RQ-03.1 "Eliminar" removes the team', async () => {
    const { user } = setup(buildTournament(['A', 'B', 'C', 'D']));
    await user.click(screen.getByRole('button', { name: 'Eliminar B' }));
    expect(listedTeams()).toEqual(['A', 'C', 'D']);
  });

  it('RQ-12.1 with results the field and buttons are disabled and the lock message is shown', () => {
    setup(buildTournament(['Leones', 'Tigres', 'Pumas'], ['Tigres 2-1 Pumas']));
    expect(screen.getByLabelText('Nombre del equipo')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Agregar equipo' })).toBeDisabled();
    for (const button of screen.getAllByRole('button', { name: /^Eliminar / })) expect(button).toBeDisabled();
    expect(
      screen.getByText(
        'Los equipos no se pueden modificar porque ya hay resultados cargados. Borra todos los resultados para volver a editarlos.',
      ),
    ).toBeInTheDocument();
  });

  it('RQ-12.3 without results the controls are enabled and there is no lock message', () => {
    setup(buildTournament(['Leones', 'Tigres', 'Pumas']));
    expect(screen.getByLabelText('Nombre del equipo')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Agregar equipo' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Eliminar Leones' })).toBeEnabled();
    expect(screen.queryByText(/Los equipos no se pueden modificar/)).not.toBeInTheDocument();
  });

  it('RNF-02.1 the name field is labelled "Nombre del equipo"', () => {
    setup();
    expect(screen.getByRole('textbox', { name: 'Nombre del equipo' })).toBeInTheDocument();
  });

  it('RNF-02.2 pressing Enter in the field adds the team', async () => {
    const { user, input } = setup();
    await user.type(input(), 'Leones{Enter}');
    expect(listedTeams()).toEqual(['Leones']);
  });

  it('RNF-02.4 the error is announced and associated with the field', async () => {
    const { add, input } = setup();
    await add('');
    const alert = screen.getByRole('alert');
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(input()).toHaveAccessibleDescription(alert.textContent ?? '');
  });

  it('RNF-02.6 the remove button is named after its team', () => {
    setup(buildTournament(['Leones', 'Tigres', 'Pumas']));
    const button = screen.getByRole('button', { name: 'Eliminar Leones' });
    expect(button).toHaveTextContent('Eliminar');
  });
});
