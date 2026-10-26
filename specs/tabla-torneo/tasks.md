# Tareas — Tabla de Torneo

> Tareas ordenadas para implementar `spec.md` (v1.0) según `plan.md` (v1.0).
> Orden: primero el dominio puro (T-02 a T-06), después el estado (T-07, T-08)
> y por último la interfaz (T-09 a T-12). T-01 prepara el proyecto.

- **Estado:** aprobado (2026-10-25)

**Reglas para cada tarea** (de `CLAUDE.md`):
1. Escribir primero las pruebas indicadas, con el título `RQ-xx.n …`.
2. Ejecutarlas y confirmar que **fallan** (por la razón esperada).
3. Implementar hasta **verde**: `npm test`, `npm run typecheck`,
   `npm run lint`, `npm run build`.
4. Marcar el checkbox y hacer **un commit** Conventional Commits con
   `Task: T-xx` y `Covers: …` en el cuerpo.

---

## T-01 — Preparar el proyecto
- [x] **Objetivo:** dejar el esqueleto Vite + React + TypeScript strict con
  Vitest, RTL, ESLint y los cuatro scripts de "verde" funcionando.
- **Cubre:** base de todas las tareas; texto `T-01` (spec §5); RNF-03.1
  (solo dependencias permitidas, ninguna de red).
- **Archivos:** `package.json`, `package-lock.json`, `tsconfig*.json`,
  `vite.config.ts` (incluye config de Vitest: `jsdom`, `setupFiles`),
  `eslint.config.js`, `index.html` (`lang="es"`), `.gitignore`,
  `.gitattributes`, `src/main.tsx`, `src/index.css`,
  `src/components/App.tsx`, `src/components/texts.ts` (solo `T-01` por ahora),
  `src/test/setup.ts`.
- **Pruebas primero:** `src/components/App.test.tsx` —
  `T-01 renders the app title "Tabla de Torneo" as the main heading`.
- **Hecha cuando:** la prueba falla sin `App` y pasa con él; los cuatro
  chequeos están en verde; `npm ls --prod` solo lista `react` y `react-dom`.

## T-02 — Nombres de equipo: normalización y validación
- [x] **Objetivo:** normalizar nombres, calcular la clave de comparación y
  validar un nombre nuevo contra la lista actual.
- **Cubre:** RQ-01.2, RQ-01.3, RQ-01.4, RQ-01.5, RQ-01.6, RQ-02.1, RQ-03.3.
- **Archivos:** `src/domain/types.ts`, `src/domain/teamName.ts`,
  `src/domain/tournament.ts` (solo constantes `MIN_TEAMS`, `MAX_TEAMS`,
  `MAX_NAME_LENGTH`).
- **Pruebas primero:** `src/domain/teamName.test.ts`
  - `RQ-01.2` `"  River   Plate  "` → `"River Plate"`.
  - `RQ-01.3` `"river plate"`, `"RIVER PLATE"`, `" River  Plate "` → `duplicate`.
  - `RQ-01.4` `"Atletico"` válido si existe `"Atlético"`.
  - `RQ-01.5` `""` y `"    "` → `empty`.
  - `RQ-01.6` 30 caracteres válido, 31 → `tooLong` (medido tras normalizar).
  - `RQ-02.1` con 10 equipos → `maxTeams`.
  - `RQ-03.3` `"leones"` válido si `Leones` ya no está en la lista.
- **Hecha cuando:** las 7 pruebas pasan y los cuatro chequeos están en verde.

## T-03 — Generación del fixture (método del círculo)
- [x] **Objetivo:** implementar `generateFixture` y `matchId` según ADR-1 y
  ADR-3.
- **Cubre:** RQ-02.2 (dominio: sin fixture con < 3 equipos), RQ-04.1, RQ-04.2,
  RQ-04.3, RQ-04.4, RQ-04.5, RQ-05.1, RQ-05.2, RQ-05.3, RNF-01.1.
- **Archivos:** `src/domain/fixture.ts`.
- **Pruebas primero:** `src/domain/fixture.test.ts`
  - `RQ-04.1` fixture exacto de `A, B, C, D`.
  - `RQ-04.2` para n = 4, 6, 8, 10: `n−1` fechas, `n/2` partidos, sin libre,
    `n(n−1)/2` partidos.
  - `RQ-04.3` para n = 3…10: cada par una vez, nadie juega dos veces por fecha.
  - `RQ-04.4` / `RNF-01.1` dos llamadas con la misma entrada son iguales en
    profundidad.
  - `RQ-04.5` orden `D, C, B, A` → fecha 1 `D vs A · C vs B`.
  - `RQ-05.1` fixture exacto de `A, B, C`; `RQ-05.2` fixture exacto de
    `A…E`.
  - `RQ-05.3` para n = 3, 5, 7, 9: `n` fechas, `(n−1)/2` partidos, un libre
    por fecha, cada equipo libre una vez.
  - `RQ-02.2` 0, 1 y 2 equipos → `[]`.
  - `matchId` es simétrico (`matchId(a,b) === matchId(b,a)`).
- **Hecha cuando:** las pruebas pasan y los cuatro chequeos están en verde.

## T-04 — Goles y estadísticas de la tabla
- [x] **Objetivo:** validar goles (`parseGoals`), calcular las estadísticas de
  cada fila (`computeStandings` sin desempates finos todavía: solo
  estadísticas) y `formatGoalDifference`. Crear el helper de pruebas
  `buildTournament`.
- **Cubre:** RQ-06.2, RQ-06.3, RQ-09.1, RQ-09.3, RQ-09.4.
- **Archivos:** `src/domain/goals.ts`, `src/domain/standings.ts`,
  `src/domain/testUtils.ts`.
- **Pruebas primero:** `src/domain/goals.test.ts`,
  `src/domain/standings.test.ts`
  - `RQ-06.2` `""`, `"-1"`, `"100"`, `"1.5"`, `"2,5"`, `"abc"` → `null`.
  - `RQ-06.3` `"0"`, `"99"`, `" 7 "`, `"07"` → 0, 99, 7, 7.
  - `RQ-09.1` estadísticas de Leones/Tigres/Pumas (valores de la spec).
  - `RQ-09.3` invariantes sobre todos los ejemplos de la spec.
  - `RQ-09.4` un partido sin resultado no suma.
  - `RQ-09` `formatGoalDifference(2|0|-1)` → `"+2"`, `"0"`, `"-1"`.
- **Hecha cuando:** las pruebas pasan y los cuatro chequeos están en verde.

## T-05 — Orden de la tabla y desempates
- [x] **Objetivo:** ordenar las filas por Pts, DG, GF, puntos entre empatados
  (una sola vez por grupo) y orden alfabético del español (ADR-2).
- **Cubre:** RQ-07.2 (tabla), RQ-08.1 (tabla), RQ-09.2, RQ-10.1, RQ-10.2,
  RQ-10.3, RQ-11.1 a RQ-11.8, RNF-01.2.
- **Archivos:** `src/domain/standings.ts`.
- **Pruebas primero:** `src/domain/standings.test.ts`
  - Una prueba por criterio con la tabla exacta de la spec
    (`RQ-10.1` a `RQ-10.3`, `RQ-11.1` a `RQ-11.5`, `RQ-07.2`, `RQ-08.1`).
  - `RQ-09.2` sin resultados: todo en 0 y orden alfabético.
  - `RQ-11.6` grupo de 4 empatados con dos igualados en puntos entre
    empatados que se ganaron entre sí → quedan en orden alfabético (sin
    recursión). Datos armados con `buildTournament`.
  - `RQ-11.7` `Atletico`, `Atlético`, `boca`, `Nutrias`, `ñandúes`.
  - `RQ-11.8` / `RNF-01.2` misma tabla con equipos registrados y resultados
    cargados en distinto orden.
  - `position` va de 1 a n sin repetir.
- **Hecha cuando:** las pruebas pasan y los cuatro chequeos están en verde.

## T-06 — Reglas del torneo: bloqueo y validación completa
- [x] **Objetivo:** `isLocked` y `validateTournament` (todo o nada, ADR-4).
- **Cubre:** RQ-06.4 (dominio), RQ-12 (regla de bloqueo), RQ-14.2, RQ-14.5.
- **Archivos:** `src/domain/tournament.ts`.
- **Pruebas primero:** `src/domain/tournament.test.ts`
  - `RQ-06.4` / `RQ-12` `isLocked` es falso sin resultados y verdadero con uno.
  - `RQ-14.2` una prueba por cada caso inválido listado en la spec (versión
    desconocida; faltan `teams` o `results`; > 10 equipos; nombre vacío, de
    31 caracteres o no normalizado; claves duplicadas; goles fuera de rango o
    no enteros; resultado de partido inexistente; resultados con < 3
    equipos) más ids duplicados o mal formados → `null`.
  - `RQ-14.2` un torneo válido (Leones/Tigres/Pumas con resultados) se
    devuelve igual.
  - `RQ-14.5` un torneo con 3 equipos válidos y un resultado inválido →
    `null` (no se devuelve nada parcial).
- **Hecha cuando:** las pruebas pasan y los cuatro chequeos están en verde.

## T-07 — Reducer del torneo
- [x] **Objetivo:** `tournamentReducer` con las acciones del plan §3,
  aplicando bloqueo y validaciones (ADR-5).
- **Cubre:** RQ-01.1, RQ-01.7, RQ-02.1, RQ-03.1, RQ-03.3, RQ-06.1, RQ-06.4,
  RQ-07.2, RQ-08.1, RQ-08.2, RQ-08.3, RQ-12.2, RQ-12.4.
- **Archivos:** `src/state/tournamentReducer.ts`.
- **Pruebas primero:** `src/state/tournamentReducer.test.ts`
  - `RQ-01.1` `teamAdded` agrega con id `t1` y nombre normalizado.
  - `RQ-01.7` el orden de registro se conserva.
  - `RQ-02.1` el undécimo `teamAdded` no cambia el estado.
  - `RQ-03.1` `teamRemoved` conserva el orden relativo.
  - `RQ-03.3` re-agregar un nombre eliminado recibe un id nuevo y va al final.
  - `RQ-06.1` `resultSaved` guarda el resultado; con goles inválidos o
    `matchId` inexistente no cambia el estado.
  - `RQ-06.4` / `RQ-12.2` con un resultado, `teamAdded` y `teamRemoved` no
    cambian el estado.
  - `RQ-07.2` `resultSaved` sobre un partido jugado reemplaza el resultado.
  - `RQ-08.1` `resultDeleted` deja el partido pendiente.
  - `RQ-08.2` / `RQ-12.4` borrar el único resultado desbloquea.
  - `RQ-08.3` tras borrar, se puede guardar un resultado nuevo.
  - `storageNoticeDismissed` pone `storageNotice` en falso.
- **Hecha cuando:** las pruebas pasan y los cuatro chequeos están en verde.

## T-08 — Persistencia y hook `useTournament`
- [ ] **Objetivo:** `loadTournament` / `saveTournament` con versión (ADR-4) y
  el hook que inicializa el reducer desde `localStorage` y guarda tras cada
  cambio.
- **Cubre:** RQ-13.1, RQ-13.2, RQ-13.3, RQ-14.1, RQ-14.2, RQ-14.4, RQ-14.5.
- **Archivos:** `src/state/storage.ts`, `src/state/useTournament.ts`.
- **Pruebas primero:** `src/state/storage.test.ts`,
  `src/state/useTournament.test.ts`
  - `RQ-13.1` guardar y cargar devuelve el mismo torneo (ida y vuelta).
  - `RQ-13.2` sin clave → `empty`.
  - `RQ-13.3` tras borrar un resultado o eliminar un equipo, lo guardado lo
    refleja.
  - `RQ-14.1` `{esto no es válido` → `corrupt`.
  - `RQ-14.2` JSON legible con `version: 2` → `corrupt`.
  - `RQ-14.4` con datos corruptos, el primer cambio sobrescribe la clave.
  - `RQ-14.5` el estado inicial con datos corruptos es un torneo vacío con
    `storageNotice: true`.
  - `R-4` si `localStorage` lanza, la carga es `empty` y guardar no lanza.
- **Hecha cuando:** las pruebas pasan y los cuatro chequeos están en verde.

## T-09 — Sección de equipos
- [ ] **Objetivo:** `TeamsSection` con formulario, errores, contador, lista,
  eliminación y bloqueo; textos en `texts.ts`.
- **Cubre:** RQ-01.1, RQ-01.2, RQ-01.3, RQ-01.5, RQ-01.7, RQ-01.8, RQ-02.1,
  RQ-02.4, RQ-12.1, RQ-12.3, RNF-02.1, RNF-02.2, RNF-02.4, RNF-02.6.
- **Archivos:** `src/components/TeamsSection.tsx`,
  `src/components/TeamsSection.module.css`, `src/components/texts.ts`.
- **Pruebas primero:** `src/components/TeamsSection.test.tsx`
  - `RQ-01.1` agregar `Leones` muestra el nombre y `1 de 10 equipos`.
  - `RQ-01.2`, `RQ-01.3`, `RQ-01.5` muestran el nombre normalizado o el
    error exacto (`T-11`, `T-10`).
  - `RQ-01.7` lista en orden de registro.
  - `RQ-01.8` tras un alta válida el error desaparece y el campo queda vacío.
  - `RQ-02.1` con 10 equipos se muestra `T-13`.
  - `RQ-02.4` sin equipos se muestra `T-07`.
  - `RQ-12.1` con resultados: campo, `Agregar equipo` y `Eliminar`
    deshabilitados y `T-15` visible; `RQ-12.3` sin resultados, habilitados y
    sin `T-15`.
  - `RNF-02.1` el campo se encuentra por la etiqueta `Nombre del equipo`.
  - `RNF-02.2` Enter en el campo agrega el equipo.
  - `RNF-02.4` el error tiene `role="alert"` y está asociado al campo.
  - `RNF-02.6` el botón se llama `Eliminar Leones`.
- **Hecha cuando:** las pruebas pasan y los cuatro chequeos están en verde.

## T-10 — Fixture y carga de resultados en la interfaz
- [ ] **Objetivo:** `FixtureSection` y `MatchRow` (pendiente / jugado /
  edición, ADR-6).
- **Cubre:** RQ-04.6, RQ-05.4, RQ-06.1, RQ-06.2, RQ-06.3, RQ-07.1, RQ-07.3,
  RQ-07.4, RQ-08.3, RNF-02.1, RNF-02.2, RNF-02.4, RNF-02.6.
- **Archivos:** `src/components/FixtureSection.tsx`,
  `src/components/MatchRow.tsx` (+ sus `.module.css`),
  `src/components/texts.ts`.
- **Pruebas primero:** `src/components/FixtureSection.test.tsx`,
  `src/components/MatchRow.test.tsx`
  - `RQ-04.6` se muestran `Fecha 1…` y `B vs C` en el orden del fixture.
  - `RQ-05.4` con 3 equipos se muestra `Libre: A` en la fecha 1.
  - `RQ-06.1` cargar `2` y `1` despacha `resultSaved` y luego se ve `2 - 1`.
  - `RQ-06.2` cada valor inválido muestra `T-14` y no despacha.
  - `RQ-06.3` `0`–`0` y `99`–`99` se aceptan.
  - `RQ-07.1` `Editar` precarga `3` y `1`.
  - `RQ-07.3` valor inválido en edición muestra `T-14` y no despacha.
  - `RQ-07.4` `Cancelar` vuelve a mostrar el resultado anterior.
  - `RQ-08.3` `Borrar` despacha `resultDeleted` y vuelven los campos vacíos.
  - `RNF-02.1` campos por etiqueta `Goles de Tigres` / `Goles de Pumas`.
  - `RNF-02.2` Enter en un campo de goles guarda.
  - `RNF-02.4` el error tiene `role="alert"` y está asociado a los campos.
  - `RNF-02.6` botones `Guardar Tigres vs Pumas`, `Editar …`, `Borrar …`.
- **Hecha cuando:** las pruebas pasan y los cuatro chequeos están en verde.

## T-11 — Tabla de posiciones en la interfaz
- [ ] **Objetivo:** `StandingsTable` que muestra las filas de
  `computeStandings` con los encabezados y formatos de la spec.
- **Cubre:** RQ-09.1 (vista), RQ-09.2 (vista), RNF-02.5.
- **Archivos:** `src/components/StandingsTable.tsx`,
  `src/components/StandingsTable.module.css`, `src/components/texts.ts`.
- **Pruebas primero:** `src/components/StandingsTable.test.tsx`
  - `RQ-09.1` las filas muestran exactamente la tabla de la spec, con DG
    `+2`, `-1`.
  - `RQ-09.2` sin resultados todas las celdas numéricas en `0`.
  - `RNF-02.5` es una `table` con 10 `columnheader` (`T-26`) y cada sigla
    tiene su descripción `T-30`.
- **Hecha cuando:** las pruebas pasan y los cuatro chequeos están en verde.

## T-12 — Integración de la app, aviso de datos corruptos y estilos
- [ ] **Objetivo:** componer `App` con `useTournament`, las tres secciones,
  los estados vacíos y `StorageNotice`; estilos base y foco visible.
- **Cubre:** RQ-02.2, RQ-02.3, RQ-03.1 (vista), RQ-03.2, RQ-06.5, RQ-07.2
  (vista), RQ-08.1 (vista), RQ-08.2 (vista), RQ-12.4 (vista), RQ-13.1,
  RQ-13.4, RQ-14.1, RQ-14.3, RNF-02.2, RNF-02.3, RNF-02.4, RNF-03.1.
- **Archivos:** `src/components/App.tsx`, `src/components/App.module.css`,
  `src/components/StorageNotice.tsx` (+ css), `src/index.css`,
  `src/components/texts.ts`.
- **Pruebas primero:** `src/components/App.test.tsx`
  - `RQ-02.2` con 0–2 equipos se ven `T-16` y `T-24`; `RQ-02.3` al agregar el
    tercero aparecen fixture y tabla.
  - `RQ-03.1` / `RQ-03.2` eliminar un equipo actualiza el fixture o lo oculta.
  - `RQ-06.5`, `RQ-07.2`, `RQ-08.1` cargar, editar y borrar actualiza la tabla
    con los valores de la spec.
  - `RQ-08.2` / `RQ-12.4` borrar el único resultado rehabilita los equipos y
    oculta `T-15`.
  - `RQ-13.1` desmontar y volver a montar muestra los mismos datos.
  - `RQ-13.4` lo escrito sin guardar no sobrevive al remontaje.
  - `RQ-14.1` con `{esto no es válido` guardado se ve `T-27` y un torneo
    vacío; `RQ-14.3` `Entendido` lo oculta.
  - `RNF-02.2` el flujo agregar equipo → cargar resultado se completa solo
    con teclado.
  - `RNF-02.4` el aviso `T-27` tiene rol de alerta/estado.
- **Revisión manual (se registra en `verification.md`):** foco visible
  (`RNF-02.3`) y ninguna petición de red en DevTools (`RNF-03.1`).
- **Hecha cuando:** las pruebas pasan, los cuatro chequeos están en verde y
  `npm run dev` muestra la app funcionando.

---

## Matriz de cobertura

Cada criterio de la spec y la(s) tarea(s) que lo cubren. ✔ = cubierto.

| Criterio | Tareas | | Criterio | Tareas |
|---|---|---|---|---|
| RQ-01.1 | T-07, T-09 | | RQ-08.1 | T-05, T-07, T-12 |
| RQ-01.2 | T-02, T-09 | | RQ-08.2 | T-07, T-12 |
| RQ-01.3 | T-02, T-09 | | RQ-08.3 | T-07, T-10 |
| RQ-01.4 | T-02 | | RQ-09.1 | T-04, T-11 |
| RQ-01.5 | T-02, T-09 | | RQ-09.2 | T-05, T-11 |
| RQ-01.6 | T-02 | | RQ-09.3 | T-04 |
| RQ-01.7 | T-07, T-09 | | RQ-09.4 | T-04 |
| RQ-01.8 | T-09 | | RQ-10.1 | T-05 |
| RQ-02.1 | T-02, T-07, T-09 | | RQ-10.2 | T-05 |
| RQ-02.2 | T-03, T-12 | | RQ-10.3 | T-05 |
| RQ-02.3 | T-12 | | RQ-11.1 | T-05 |
| RQ-02.4 | T-09 | | RQ-11.2 | T-05 |
| RQ-03.1 | T-07, T-12 | | RQ-11.3 | T-05 |
| RQ-03.2 | T-12 | | RQ-11.4 | T-05 |
| RQ-03.3 | T-02, T-07 | | RQ-11.5 | T-05 |
| RQ-04.1 | T-03 | | RQ-11.6 | T-05 |
| RQ-04.2 | T-03 | | RQ-11.7 | T-05 |
| RQ-04.3 | T-03 | | RQ-11.8 | T-05 |
| RQ-04.4 | T-03 | | RQ-12.1 | T-09 |
| RQ-04.5 | T-03 | | RQ-12.2 | T-07 |
| RQ-04.6 | T-10 | | RQ-12.3 | T-09 |
| RQ-05.1 | T-03 | | RQ-12.4 | T-07, T-12 |
| RQ-05.2 | T-03 | | RQ-13.1 | T-08, T-12 |
| RQ-05.3 | T-03 | | RQ-13.2 | T-08 |
| RQ-05.4 | T-10 | | RQ-13.3 | T-08 |
| RQ-06.1 | T-07, T-10 | | RQ-13.4 | T-12 |
| RQ-06.2 | T-04, T-10 | | RQ-14.1 | T-08, T-12 |
| RQ-06.3 | T-04, T-10 | | RQ-14.2 | T-06, T-08 |
| RQ-06.4 | T-06, T-07 | | RQ-14.3 | T-12 |
| RQ-06.5 | T-12 | | RQ-14.4 | T-08 |
| RQ-07.1 | T-10 | | RQ-14.5 | T-06, T-08 |
| RQ-07.2 | T-05, T-07, T-12 | | RNF-01.1 | T-03 |
| RQ-07.3 | T-10 | | RNF-01.2 | T-05 |
| RQ-07.4 | T-10 | | RNF-02.1 | T-09, T-10 |
| | | | RNF-02.2 | T-09, T-10, T-12 |
| | | | RNF-02.3 | T-12 (manual) |
| | | | RNF-02.4 | T-09, T-10, T-12 |
| | | | RNF-02.5 | T-11 |
| | | | RNF-02.6 | T-09, T-10 |
| | | | RNF-03.1 | T-01, T-12 (revisión + manual) |

**Totales:** 65 criterios funcionales y 9 no funcionales; los 74 están
cubiertos por al menos una tarea. Ningún criterio queda sin tarea.

### Cobertura por tarea

| Tarea | Capa | Criterios |
|---|---|---|
| T-01 | Proyecto | T-01 (texto), RNF-03.1 |
| T-02 | Dominio | 7 |
| T-03 | Dominio | 10 |
| T-04 | Dominio | 5 |
| T-05 | Dominio | 15 |
| T-06 | Dominio | 3 (+ regla de bloqueo de RQ-12) |
| T-07 | Estado | 13 |
| T-08 | Estado | 7 |
| T-09 | Interfaz | 14 |
| T-10 | Interfaz | 13 |
| T-11 | Interfaz | 3 |
| T-12 | Interfaz | 17 |
