import { render, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { STORAGE_KEY } from '../state/storage';
import { App } from './App';

const LOCK_MESSAGE =
  'Los equipos no se pueden modificar porque ya hay resultados cargados. Borra todos los resultados para volver a editarlos.';

const setup = () => {
  const user = userEvent.setup();
  const view = render(<App />);
  return { user, ...view };
};

async function addTeams(user: UserEvent, ...names: string[]) {
  for (const name of names) {
    await user.type(screen.getByLabelText('Nombre del equipo'), `${name}{Enter}`);
  }
}

/** The fixture row of a match, so labels shared by several matches are not ambiguous. */
function matchRow(home: string, away: string) {
  const row = screen.getByText(`${home} vs ${away}`).closest('li');
  if (!row) throw new Error(`No row for ${home} vs ${away}`);
  return within(row);
}

async function saveResult(user: UserEvent, home: string, away: string, homeGoals: string, awayGoals: string) {
  const homeField = matchRow(home, away).getByLabelText(`Goles de ${home}`);
  const awayField = matchRow(home, away).getByLabelText(`Goles de ${away}`);
  await user.clear(homeField);
  await user.type(homeField, homeGoals);
  await user.clear(awayField);
  await user.type(awayField, awayGoals);
  await user.click(screen.getByRole('button', { name: `Guardar ${home} vs ${away}` }));
}

async function loadSpecExample(user: UserEvent) {
  await addTeams(user, 'Leones', 'Tigres', 'Pumas');
  await saveResult(user, 'Tigres', 'Pumas', '2', '1');
  await saveResult(user, 'Pumas', 'Leones', '0', '0');
  await saveResult(user, 'Leones', 'Tigres', '3', '1');
}

const tableRows = () =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((row) => [...row.querySelectorAll('td, th')].map((cell) => cell.textContent).join(' '));

describe('App', () => {
  it('T-01 renders the app title "Tabla de Torneo" as the main heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Tabla de Torneo' })).toBeInTheDocument();
  });

  it('RQ-02.2 with 0 to 2 teams shows the fixture and table empty states', async () => {
    const { user } = setup();
    for (const name of ['', 'Leones', 'Tigres']) {
      if (name) await addTeams(user, name);
      expect(screen.getByText('Agrega al menos 3 equipos para generar el fixture.')).toBeInTheDocument();
      expect(screen.getByText('La tabla aparecerá cuando haya al menos 3 equipos.')).toBeInTheDocument();
    }
  });

  it('RQ-02.3 adding the third team shows the fixture and the standings table', async () => {
    const { user } = setup();
    await addTeams(user, 'Leones', 'Tigres', 'Pumas');
    expect(screen.getByRole('heading', { name: 'Fecha 1' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Tabla de posiciones' })).toBeInTheDocument();
  });

  it('RQ-03.1 removing a team recomputes the fixture with the remaining teams in order', async () => {
    const { user } = setup();
    await addTeams(user, 'A', 'B', 'C', 'D');
    await user.click(screen.getByRole('button', { name: 'Eliminar B' }));
    const round1 = screen.getByRole('region', { name: 'Fecha 1' });
    expect(within(round1).getByText('C vs D')).toBeInTheDocument();
    expect(within(round1).getByText('Libre: A')).toBeInTheDocument();
  });

  it('RQ-03.2 removing one of 3 teams hides the fixture and the table', async () => {
    const { user } = setup();
    await addTeams(user, 'A', 'B', 'C');
    await user.click(screen.getByRole('button', { name: 'Eliminar C' }));
    expect(screen.queryByRole('heading', { name: 'Fecha 1' })).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('RQ-06.5 saving results updates the table right away (spec RQ-09.1)', async () => {
    const { user } = setup();
    await loadSpecExample(user);
    expect(tableRows()).toEqual([
      '1 Leones 2 1 1 0 3 1 +2 4',
      '2 Tigres 2 1 0 1 3 4 -1 3',
      '3 Pumas 2 0 1 1 1 2 -1 1',
    ]);
  });

  it('RQ-07.2 editing Leones 3-1 Tigres to 1-1 updates the match and the table', async () => {
    const { user } = setup();
    await loadSpecExample(user);
    await user.click(screen.getByRole('button', { name: 'Editar Leones vs Tigres' }));
    await saveResult(user, 'Leones', 'Tigres', '1', '1');
    expect(screen.getByText('1 - 1')).toBeInTheDocument();
    expect(tableRows()).toEqual([
      '1 Tigres 2 1 1 0 3 2 +1 4',
      '2 Leones 2 0 2 0 1 1 0 2',
      '3 Pumas 2 0 1 1 1 2 -1 1',
    ]);
  });

  it('RQ-08.1 deleting Leones 3-1 Tigres makes it pending and updates the table', async () => {
    const { user } = setup();
    await loadSpecExample(user);
    await user.click(screen.getByRole('button', { name: 'Borrar Leones vs Tigres' }));
    expect(matchRow('Leones', 'Tigres').getByLabelText('Goles de Leones')).toHaveValue('');
    expect(tableRows()).toEqual([
      '1 Tigres 1 1 0 0 2 1 +1 3',
      '2 Leones 1 0 1 0 0 0 0 1',
      '3 Pumas 2 0 1 1 1 2 -1 1',
    ]);
  });

  it('RQ-08.2 / RQ-12.4 deleting the only result unlocks the team list', async () => {
    const { user } = setup();
    await addTeams(user, 'Leones', 'Tigres', 'Pumas');
    await saveResult(user, 'Tigres', 'Pumas', '2', '1');
    expect(screen.getByText(LOCK_MESSAGE)).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre del equipo')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Borrar Tigres vs Pumas' }));
    expect(screen.queryByText(LOCK_MESSAGE)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nombre del equipo')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Eliminar Leones' })).toBeEnabled();
  });

  it('RQ-13.1 after a reload the same teams, fixture, results and table are shown', async () => {
    const { user, unmount } = setup();
    await loadSpecExample(user);
    const before = tableRows();
    unmount();
    render(<App />);
    expect(screen.getAllByRole('listitem').slice(0, 3).map((li) => li.firstChild?.textContent)).toEqual([
      'Leones',
      'Tigres',
      'Pumas',
    ]);
    expect(screen.getByText('2 - 1')).toBeInTheDocument();
    expect(screen.getByText('3 - 1')).toBeInTheDocument();
    expect(tableRows()).toEqual(before);
  });

  it('RQ-13.4 values typed while editing and not saved are lost on reload', async () => {
    const { user, unmount } = setup();
    await addTeams(user, 'Leones', 'Tigres', 'Pumas');
    await saveResult(user, 'Tigres', 'Pumas', '2', '1');
    await user.click(screen.getByRole('button', { name: 'Editar Tigres vs Pumas' }));
    await user.clear(matchRow('Tigres', 'Pumas').getByLabelText('Goles de Tigres'));
    await user.type(matchRow('Tigres', 'Pumas').getByLabelText('Goles de Tigres'), '5');
    await user.type(matchRow('Pumas', 'Leones').getByLabelText('Goles de Leones'), '4');
    unmount();
    render(<App />);
    expect(matchRow('Tigres', 'Pumas').getByText('2 - 1')).toBeInTheDocument();
    expect(matchRow('Tigres', 'Pumas').queryByLabelText('Goles de Tigres')).not.toBeInTheDocument();
    expect(matchRow('Pumas', 'Leones').getByLabelText('Goles de Leones')).toHaveValue('');
  });

  it('RQ-14.1 corrupt saved data shows the notice and an empty tournament', () => {
    localStorage.setItem(STORAGE_KEY, '{esto no es válido');
    render(<App />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudieron recuperar los datos guardados. Se empezó un torneo nuevo.',
    );
    expect(screen.getByRole('button', { name: 'Entendido' })).toBeInTheDocument();
    expect(screen.getByText('Todavía no hay equipos. Agrega entre 3 y 10 para armar el torneo.')).toBeInTheDocument();
  });

  it('RQ-14.3 "Entendido" hides the notice', async () => {
    localStorage.setItem(STORAGE_KEY, '{esto no es válido');
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Entendido' }));
    expect(screen.queryByText(/No se pudieron recuperar/)).not.toBeInTheDocument();
  });

  it('RQ-13.2 the first time the app opens there is no error notice', () => {
    render(<App />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('RNF-02.2 adding teams and saving a result can be done with the keyboard only', async () => {
    const { user } = setup();
    await user.tab();
    expect(screen.getByLabelText('Nombre del equipo')).toHaveFocus();
    await user.keyboard('Leones{Enter}Tigres{Enter}Pumas{Enter}');

    const homeField = matchRow('Tigres', 'Pumas').getByLabelText('Goles de Tigres');
    for (let i = 0; i < 20 && document.activeElement !== homeField; i++) {
      await user.tab();
    }
    expect(homeField).toHaveFocus();
    await user.keyboard('2');
    await user.tab();
    expect(matchRow('Tigres', 'Pumas').getByLabelText('Goles de Pumas')).toHaveFocus();
    await user.keyboard('1{Enter}');
    expect(screen.getByText('2 - 1')).toBeInTheDocument();
  });

  it('RNF-02.4 the corrupt data notice is announced as an alert', () => {
    localStorage.setItem(STORAGE_KEY, '{esto no es válido');
    render(<App />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
