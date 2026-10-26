// UI texts copied verbatim from spec.md section 5. Each entry notes its T-xx id.
export const texts = {
  appTitle: 'Tabla de Torneo', // T-01
  teamsTitle: 'Equipos', // T-02
  teamNameLabel: 'Nombre del equipo', // T-03
  addTeam: 'Agregar equipo', // T-04
  removeTeam: 'Eliminar', // T-05
  removeTeamLabel: (team: string) => `Eliminar ${team}`, // T-05 (accessible name)
  teamCount: (n: number) => `${n} de 10 equipos`, // T-06
  teamsEmpty: 'Todavía no hay equipos. Agrega entre 3 y 10 para armar el torneo.', // T-07
  fixtureTitle: 'Fixture', // T-08
  standingsTitle: 'Tabla de posiciones', // T-09
  errorEmptyName: 'El nombre del equipo no puede estar vacío.', // T-10
  errorDuplicateName: 'Ya existe un equipo con ese nombre.', // T-11
  errorLongName: 'El nombre del equipo no puede tener más de 30 caracteres.', // T-12
  errorMaxTeams: 'El torneo admite como máximo 10 equipos.', // T-13
  errorGoals: 'Los goles deben ser números enteros entre 0 y 99.', // T-14
  teamsLocked:
    'Los equipos no se pueden modificar porque ya hay resultados cargados. Borra todos los resultados para volver a editarlos.', // T-15
  fixtureEmpty: 'Agrega al menos 3 equipos para generar el fixture.', // T-16
  roundTitle: (n: number) => `Fecha ${n}`, // T-17
  match: (home: string, away: string) => `${home} vs ${away}`, // T-18
  bye: (team: string) => `Libre: ${team}`, // T-19
  save: 'Guardar', // T-20
  score: (homeGoals: number, awayGoals: number) => `${homeGoals} - ${awayGoals}`, // T-21
  edit: 'Editar', // T-22
  remove: 'Borrar', // T-23
  standingsEmpty: 'La tabla aparecerá cuando haya al menos 3 equipos.', // T-24
  cancel: 'Cancelar', // T-25
  standingsHeaders: ['#', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'Pts'], // T-26
  storageCorrupt: 'No se pudieron recuperar los datos guardados. Se empezó un torneo nuevo.', // T-27
  dismiss: 'Entendido', // T-28
  goalsLabel: (team: string) => `Goles de ${team}`, // T-29
  standingsDescriptions: [
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
  ], // T-30
} as const;
