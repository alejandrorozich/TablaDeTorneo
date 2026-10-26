import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildTournament, specExamples } from '../domain/testUtils';
import { StandingsTable } from './StandingsTable';

const renderTable = (names: readonly string[], scores: readonly string[] = []) => {
  const { teams, results } = buildTournament(names, scores);
  render(<StandingsTable teams={teams} results={results} />);
};

const bodyRows = () =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((row) => [...row.querySelectorAll('td, th')].map((cell) => cell.textContent));

describe('StandingsTable', () => {
  it('RQ-09.1 shows exactly the table of the spec example, with signed goal difference', () => {
    renderTable(specExamples.rq09_1.names, specExamples.rq09_1.scores);
    expect(bodyRows()).toEqual([
      ['1', 'Leones', '2', '1', '1', '0', '3', '1', '+2', '4'],
      ['2', 'Tigres', '2', '1', '0', '1', '3', '4', '-1', '3'],
      ['3', 'Pumas', '2', '0', '1', '1', '1', '2', '-1', '1'],
    ]);
  });

  it('RQ-09.2 without results every numeric cell is 0', () => {
    renderTable(['Leones', 'Tigres', 'Pumas']);
    for (const [, , ...numbers] of bodyRows()) expect(numbers).toEqual(Array(8).fill('0'));
  });

  it('RNF-02.5 is a table with the 10 column headers and the full description of each abbreviation', () => {
    renderTable(['Leones', 'Tigres', 'Pumas']);
    const headers = screen.getAllByRole('columnheader');
    expect(headers.map((h) => h.textContent)).toEqual(['#', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'Pts']);
    const descriptions = headers.map((h) => h.querySelector('abbr')?.getAttribute('title') ?? h.textContent);
    expect(descriptions).toEqual([
      'Posición',
      'Equipo',
      'Partidos jugados',
      'Partidos ganados',
      'Partidos empatados',
      'Partidos perdidos',
      'Goles a favor',
      'Goles en contra',
      'Diferencia de gol',
      'Puntos',
    ]);
    expect(screen.getByRole('table', { name: 'Tabla de posiciones' })).toBeInTheDocument();
  });

  it('RQ-02.2 with fewer than 3 teams shows the empty state instead of the table', () => {
    renderTable(['Leones', 'Tigres']);
    expect(screen.getByText('La tabla aparecerá cuando haya al menos 3 equipos.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
