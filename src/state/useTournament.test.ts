import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { STORAGE_KEY } from './storage';
import { useTournament } from './useTournament';

describe('useTournament', () => {
  it('RQ-13.1 saves after each change and a new mount restores it', () => {
    const first = renderHook(() => useTournament());
    act(() => first.result.current[1]({ type: 'teamAdded', name: 'Leones' }));
    first.unmount();
    const second = renderHook(() => useTournament());
    expect(second.result.current[0].tournament.teams).toEqual([{ id: 't1', name: 'Leones' }]);
  });

  it('RQ-14.4 with corrupt data, nothing is written until the first change, which overwrites it', () => {
    localStorage.setItem(STORAGE_KEY, '{esto no es válido');
    const { result } = renderHook(() => useTournament());
    expect(result.current[0].storageNotice).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{esto no es válido');

    act(() => result.current[1]({ type: 'teamAdded', name: 'Leones' }));
    const second = renderHook(() => useTournament());
    expect(second.result.current[0]).toEqual({
      tournament: { teams: [{ id: 't1', name: 'Leones' }], nextTeamNumber: 2, results: {} },
      storageNotice: false,
    });
  });
});
