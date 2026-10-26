import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildTournament } from '../domain/testUtils';
import { FixtureSection } from './FixtureSection';

const renderFixture = (names: string[]) => {
  const { teams, results } = buildTournament(names);
  render(<FixtureSection teams={teams} results={results} onSave={vi.fn()} onDelete={vi.fn()} />);
};

const round = (n: number) => screen.getByRole('region', { name: `Fecha ${n}` });
const matchesIn = (region: HTMLElement) =>
  within(region)
    .getAllByRole('listitem')
    .map((item) => item.querySelector('[data-match]')?.textContent);

describe('FixtureSection', () => {
  it('RQ-04.6 shows each round titled "Fecha n" with "local vs visitante" matches in fixture order', () => {
    renderFixture(['A', 'B', 'C', 'D']);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Fecha 1',
      'Fecha 2',
      'Fecha 3',
    ]);
    expect(matchesIn(round(1))).toEqual(['A vs D', 'B vs C']);
    expect(matchesIn(round(2))).toEqual(['C vs A', 'D vs B']);
    expect(matchesIn(round(3))).toEqual(['A vs B', 'C vs D']);
  });

  it('RQ-05.4 shows "Libre: equipo" under the matches of a round with a bye', () => {
    renderFixture(['A', 'B', 'C']);
    expect(within(round(1)).getByText('Libre: A')).toBeInTheDocument();
    expect(within(round(2)).getByText('Libre: B')).toBeInTheDocument();
    expect(within(round(3)).getByText('Libre: C')).toBeInTheDocument();
  });

  it('RQ-04.6 an even number of teams shows no bye', () => {
    renderFixture(['A', 'B', 'C', 'D']);
    expect(screen.queryByText(/^Libre:/)).not.toBeInTheDocument();
  });

  it('RQ-02.2 with fewer than 3 teams shows the empty state instead of rounds', () => {
    renderFixture(['A', 'B']);
    expect(screen.getByText('Agrega al menos 3 equipos para generar el fixture.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });
});
