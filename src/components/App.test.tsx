import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('T-01 renders the app title "Tabla de Torneo" as the main heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Tabla de Torneo' })).toBeInTheDocument();
  });
});
