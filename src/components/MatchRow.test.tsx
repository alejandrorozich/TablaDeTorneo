import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Result } from '../domain/types';
import { MatchRow } from './MatchRow';

function Harness({ initial, onSave, onDelete }: { initial?: Result; onSave: (r: Result) => void; onDelete: () => void }) {
  const [result, setResult] = useState<Result | undefined>(initial);
  return (
    <ul>
      <MatchRow
        homeName="Tigres"
        awayName="Pumas"
        result={result}
        onSave={(r) => {
          onSave(r);
          setResult(r);
        }}
        onDelete={() => {
          onDelete();
          setResult(undefined);
        }}
      />
    </ul>
  );
}

const setup = (initial?: Result) => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  const onDelete = vi.fn();
  render(<Harness initial={initial} onSave={onSave} onDelete={onDelete} />);
  const home = () => screen.getByLabelText('Goles de Tigres');
  const away = () => screen.getByLabelText('Goles de Pumas');
  const fill = async (h: string, a: string) => {
    await user.clear(home());
    if (h) await user.type(home(), h);
    await user.clear(away());
    if (a) await user.type(away(), a);
  };
  const save = () => user.click(screen.getByRole('button', { name: 'Guardar Tigres vs Pumas' }));
  return { user, onSave, onDelete, home, away, fill, save };
};

describe('MatchRow', () => {
  it('RQ-06.1 saving 2 and 1 stores the result and shows "2 - 1"', async () => {
    const { fill, save, onSave } = setup();
    await fill('2', '1');
    await save();
    expect(onSave).toHaveBeenCalledWith({ homeGoals: 2, awayGoals: 1 });
    expect(screen.getByText('2 - 1')).toBeInTheDocument();
    expect(screen.queryByLabelText('Goles de Tigres')).not.toBeInTheDocument();
  });

  it.each([
    ['', '1'],
    ['-1', '1'],
    ['100', '1'],
    ['1.5', '1'],
    ['2,5', '1'],
    ['abc', '1'],
    ['2', ''],
  ])('RQ-06.2 "%s" - "%s" is rejected with the goals error and the match stays pending', async (h, a) => {
    const { fill, save, onSave } = setup();
    await fill(h, a);
    await save();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Los goles deben ser números enteros entre 0 y 99.');
    expect(screen.getByLabelText('Goles de Tigres')).toBeInTheDocument();
  });

  it.each([
    ['0', '0', { homeGoals: 0, awayGoals: 0 }],
    ['99', '99', { homeGoals: 99, awayGoals: 99 }],
  ])('RQ-06.3 "%s" - "%s" is accepted', async (h, a, expected) => {
    const { fill, save, onSave } = setup();
    await fill(h, a);
    await save();
    expect(onSave).toHaveBeenCalledWith(expected);
  });

  it('RQ-07.1 "Editar" shows the fields with the current goals', async () => {
    const { user, home, away } = setup({ homeGoals: 3, awayGoals: 1 });
    await user.click(screen.getByRole('button', { name: 'Editar Tigres vs Pumas' }));
    expect(home()).toHaveValue('3');
    expect(away()).toHaveValue('1');
    expect(screen.getByRole('button', { name: 'Cancelar Tigres vs Pumas' })).toHaveTextContent('Cancelar');
  });

  it('RQ-07.2 editing and saving replaces the result', async () => {
    const { user, fill, save, onSave } = setup({ homeGoals: 3, awayGoals: 1 });
    await user.click(screen.getByRole('button', { name: 'Editar Tigres vs Pumas' }));
    await fill('1', '1');
    await save();
    expect(onSave).toHaveBeenCalledWith({ homeGoals: 1, awayGoals: 1 });
    expect(screen.getByText('1 - 1')).toBeInTheDocument();
  });

  it('RQ-07.3 an invalid value while editing shows the error and keeps the previous result', async () => {
    const { user, fill, save, onSave } = setup({ homeGoals: 3, awayGoals: 1 });
    await user.click(screen.getByRole('button', { name: 'Editar Tigres vs Pumas' }));
    await fill('100', '1');
    await save();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Los goles deben ser números enteros entre 0 y 99.');
    await user.click(screen.getByRole('button', { name: 'Cancelar Tigres vs Pumas' }));
    expect(screen.getByText('3 - 1')).toBeInTheDocument();
  });

  it('RQ-07.4 "Cancelar" shows the previous result unchanged', async () => {
    const { user, fill } = setup({ homeGoals: 3, awayGoals: 1 });
    await user.click(screen.getByRole('button', { name: 'Editar Tigres vs Pumas' }));
    await fill('0', '0');
    await user.click(screen.getByRole('button', { name: 'Cancelar Tigres vs Pumas' }));
    expect(screen.getByText('3 - 1')).toBeInTheDocument();
    expect(screen.queryByLabelText('Goles de Tigres')).not.toBeInTheDocument();
  });

  it('RQ-08.1 / RQ-08.3 "Borrar" deletes the result and the match is pending with empty fields', async () => {
    const { user, onDelete, home, away } = setup({ homeGoals: 3, awayGoals: 1 });
    await user.click(screen.getByRole('button', { name: 'Borrar Tigres vs Pumas' }));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(screen.queryByText('3 - 1')).not.toBeInTheDocument();
    expect(home()).toHaveValue('');
    expect(away()).toHaveValue('');
  });

  it('RQ-08.3 after deleting, a new result can be saved', async () => {
    const { user, fill, save, onSave } = setup({ homeGoals: 3, awayGoals: 1 });
    await user.click(screen.getByRole('button', { name: 'Borrar Tigres vs Pumas' }));
    await fill('0', '4');
    await save();
    expect(onSave).toHaveBeenCalledWith({ homeGoals: 0, awayGoals: 4 });
    expect(screen.getByText('0 - 4')).toBeInTheDocument();
  });

  it('RNF-02.1 goals fields are labelled "Goles de Tigres" and "Goles de Pumas"', () => {
    setup();
    expect(screen.getByRole('textbox', { name: 'Goles de Tigres' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Goles de Pumas' })).toBeInTheDocument();
  });

  it('RNF-02.2 pressing Enter in a goals field saves', async () => {
    const { user, home, away, onSave } = setup();
    await user.type(home(), '2');
    await user.type(away(), '1{Enter}');
    expect(onSave).toHaveBeenCalledWith({ homeGoals: 2, awayGoals: 1 });
  });

  it('RNF-02.4 the goals error is announced and associated with both fields', async () => {
    const { fill, save, home, away } = setup();
    await fill('', '');
    await save();
    const message = screen.getByRole('alert').textContent ?? '';
    expect(home()).toHaveAccessibleDescription(message);
    expect(away()).toHaveAccessibleDescription(message);
    expect(home()).toHaveAttribute('aria-invalid', 'true');
  });

  it('RNF-02.6 save, edit and delete buttons are named after the match', async () => {
    const { fill, save } = setup();
    expect(screen.getByRole('button', { name: 'Guardar Tigres vs Pumas' })).toHaveTextContent('Guardar');
    await fill('2', '1');
    await save();
    expect(screen.getByRole('button', { name: 'Editar Tigres vs Pumas' })).toHaveTextContent('Editar');
    expect(screen.getByRole('button', { name: 'Borrar Tigres vs Pumas' })).toHaveTextContent('Borrar');
  });
});
