# Verificación — Tabla de Torneo

> Estado de cada criterio de `spec.md` (v1.0) contra la implementación
> terminada (tareas T-01 a T-12 de `tasks.md`).

- **Fecha:** 2026-10-25
- **Commit verificado:** `2761e9e` (T-12)
- **Chequeos de "verde"** (`CLAUDE.md`), todos sin errores:

  | Chequeo | Resultado |
  |---|---|
  | `npm test` | 13 archivos, **192 pruebas pasan**, 0 fallan, 0 omitidas |
  | `npm run typecheck` | sin errores |
  | `npm run lint` | sin errores ni advertencias (`--max-warnings 0`) |
  | `npm run build` | build de producción generado |

**Métodos:** **PA** = prueba automática (Vitest / RTL; la evidencia es
`archivo › título`), **PM** = prueba manual en el navegador (Chrome, servidor
`vite` en `localhost`), **RC** = revisión de código.

Abreviaturas de archivos de prueba: `teamName` = `src/domain/teamName.test.ts`,
`fixture` = `src/domain/fixture.test.ts`, `goals` = `src/domain/goals.test.ts`,
`standings` = `src/domain/standings.test.ts`, `tournament` =
`src/domain/tournament.test.ts`, `reducer` =
`src/state/tournamentReducer.test.ts`, `storage` = `src/state/storage.test.ts`,
`hook` = `src/state/useTournament.test.ts`, `Teams` =
`src/components/TeamsSection.test.tsx`, `Fixture` =
`src/components/FixtureSection.test.tsx`, `MatchRow` =
`src/components/MatchRow.test.tsx`, `Standings` =
`src/components/StandingsTable.test.tsx`, `App` = `src/components/App.test.tsx`.

---

## Requisitos funcionales

| Criterio | Estado | Método | Evidencia |
|---|---|---|---|
| RQ-01.1 | Cumple | PA | `Teams › RQ-01.1 adding "Leones" lists it and shows "1 de 10 equipos"`; `reducer › RQ-01.1 teamAdded adds the team with id t1 and its normalized name` |
| RQ-01.2 | Cumple | PA | `teamName › RQ-01.2 trims and collapses inner spaces…`; `teamName › RQ-01.2 returns the normalized name when valid`; `Teams › RQ-01.2 shows the normalized name` |
| RQ-01.3 | Cumple | PA | `teamName › RQ-01.3 rejects "river plate" / "RIVER PLATE" / " River  Plate " as duplicate…` (3 casos); `Teams › RQ-01.3 shows the duplicate name error`; `reducer › RQ-01.3 / RQ-01.5 ignores invalid names` |
| RQ-01.4 | Cumple | PA | `teamName › RQ-01.4 accepts "Atletico" when "Atlético" exists`; `teamName › RQ-01.3 ignores case and extra spaces but keeps accents` |
| RQ-01.5 | Cumple | PA | `teamName › RQ-01.5 rejects empty name ""` y `"    "`; `Teams › RQ-01.5 shows the empty name error` |
| RQ-01.6 | Cumple | PA | `teamName › RQ-01.6 accepts 30 characters and rejects 31, measured after normalizing`; `Teams › RQ-01.6 shows the long name error` |
| RQ-01.7 | Cumple | PA | `reducer › RQ-01.7 keeps registration order`; `Teams › RQ-01.7 lists teams in registration order` |
| RQ-01.8 | Cumple | PA | `Teams › RQ-01.8 after a valid add the error disappears and the field is emptied` |
| RQ-02.1 | Cumple | PA | `teamName › RQ-02.1 rejects an eleventh team…`; `reducer › RQ-02.1 ignores an eleventh team`; `Teams › RQ-02.1 with 10 teams adding another shows the maximum teams error` |
| RQ-02.2 | Cumple | PA | `fixture › RQ-02.2 returns no rounds with 0/1/2 teams`; `Fixture › RQ-02.2 …empty state instead of rounds`; `Standings › RQ-02.2 …empty state instead of the table`; `App › RQ-02.2 with 0 to 2 teams shows the fixture and table empty states` |
| RQ-02.3 | Cumple | PA | `App › RQ-02.3 adding the third team shows the fixture and the standings table` |
| RQ-02.4 | Cumple | PA | `Teams › RQ-02.4 without teams shows the empty state` |
| RQ-03.1 | Cumple | PA | `reducer › RQ-03.1 teamRemoved keeps the relative order of the others`; `Teams › RQ-03.1 "Eliminar" removes the team`; `App › RQ-03.1 removing a team recomputes the fixture…` |
| RQ-03.2 | Cumple | PA | `App › RQ-03.2 removing one of 3 teams hides the fixture and the table` |
| RQ-03.3 | Cumple | PA | `teamName › RQ-03.3 accepts "leones" once "Leones" is no longer registered`; `reducer › RQ-03.3 re-adding a removed name gets a new id and goes last` |
| RQ-04.1 | Cumple | PA | `fixture › RQ-04.1 produces the exact fixture for A, B, C, D` |
| RQ-04.2 | Cumple | PA | `fixture › RQ-04.2 with 4/6/8/10 teams has n-1 rounds of n/2 matches and no bye` |
| RQ-04.3 | Cumple | PA | `fixture › RQ-04.3 with 3…10 teams every pair meets exactly once and nobody plays twice per round` (8 casos) |
| RQ-04.4 | Cumple | PA | `fixture › RQ-04.4 / RNF-01.1 is deterministic…`; `fixture › RQ-04.4 match ids are the sorted pair…`; `matchId › RQ-04.4 is symmetric…`; `App › RQ-13.1 after a reload…` (mismo fixture tras remontar) |
| RQ-04.5 | Cumple | PA | `fixture › RQ-04.5 uses registration order (D, C, B, A -> round 1 "D vs A", "C vs B")` |
| RQ-04.6 | Cumple | PA | `Fixture › RQ-04.6 shows each round titled "Fecha n" with "local vs visitante" matches in fixture order`; `Fixture › RQ-04.6 an even number of teams shows no bye` |
| RQ-05.1 | Cumple | PA | `fixture › RQ-05.1 produces the exact fixture with byes for A, B, C` |
| RQ-05.2 | Cumple | PA | `fixture › RQ-05.2 produces the exact fixture with byes for A, B, C, D, E` |
| RQ-05.3 | Cumple | PA | `fixture › RQ-05.3 with 3/5/7/9 teams has n rounds, (n-1)/2 matches and each team rests once` |
| RQ-05.4 | Cumple | PA + PM | `Fixture › RQ-05.4 shows "Libre: equipo" under the matches of a round with a bye`; en el navegador se ve `Libre: Leones`, `Libre: Tigres`, `Libre: Pumas` |
| RQ-06.1 | Cumple | PA + PM | `MatchRow › RQ-06.1 saving 2 and 1 stores the result and shows "2 - 1"`; `reducer › RQ-06.1 resultSaved stores…` y `…ignores results with invalid goals…`; en el navegador `Tigres vs Pumas` muestra `2 - 1` |
| RQ-06.2 | Cumple | PA | `goals › RQ-06.2 rejects …` (10 casos: vacío, espacios, `-1`, `100`, `1.5`, `2,5`, `abc`, `1e1`, `+3`, `٣`); `MatchRow › RQ-06.2 … is rejected with the goals error and the match stays pending` (7 casos) |
| RQ-06.3 | Cumple | PA | `goals › RQ-06.3 accepts "0"/"99"/" 7 "/"07"`; `MatchRow › RQ-06.3 "0" - "0" is accepted` y `"99" - "99"` |
| RQ-06.4 | Cumple | PA + PM | `tournament › RQ-06.4 / RQ-12 is false without results and true with at least one`; `reducer › RQ-06.4 / RQ-12.2 …`; en el navegador, tras el primer resultado aparece `T-15` y se deshabilitan los controles |
| RQ-06.5 | Cumple | PA | `App › RQ-06.5 saving results updates the table right away (spec RQ-09.1)` |
| RQ-07.1 | Cumple | PA | `MatchRow › RQ-07.1 "Editar" shows the fields with the current goals` |
| RQ-07.2 | Cumple | PA | `standings › RQ-07.2 after editing Leones 3-1 Tigres to 1-1…`; `reducer › RQ-07.2 resultSaved on a played match replaces its result`; `MatchRow › RQ-07.2 editing and saving replaces the result`; `App › RQ-07.2 editing Leones 3-1 Tigres to 1-1 updates the match and the table` |
| RQ-07.3 | Cumple | PA | `MatchRow › RQ-07.3 an invalid value while editing shows the error and keeps the previous result` |
| RQ-07.4 | Cumple | PA | `MatchRow › RQ-07.4 "Cancelar" shows the previous result unchanged` |
| RQ-08.1 | Cumple | PA + PM | `standings › RQ-08.1 …`; `reducer › RQ-08.1 resultDeleted makes the match pending again`; `MatchRow › RQ-08.1 / RQ-08.3 "Borrar" deletes…`; `App › RQ-08.1 deleting Leones 3-1 Tigres…`; en el navegador, con F1 y F2 cargadas, la tabla coincide con la de RQ-08.1 |
| RQ-08.2 | Cumple | PA | `reducer › RQ-08.2 / RQ-12.4 deleting the only result unlocks the team list`; `App › RQ-08.2 / RQ-12.4 deleting the only result unlocks the team list` |
| RQ-08.3 | Cumple | PA | `reducer › RQ-08.3 after deleting a result a new one can be saved`; `MatchRow › RQ-08.3 after deleting, a new result can be saved` |
| RQ-09.1 | Cumple | PA + PM | `standings › RQ-09.1 computes PJ, PG, PE, PP, GF, GC, DG and Pts…`; `standings › RQ-09.1 shows "+" for positive…`; `standings › RQ-09.1 positions go from 1 to n without repeats`; `Standings › RQ-09.1 shows exactly the table of the spec example…`; en el navegador, tras cargar F1–F3 y recargar, la tabla es la de la spec |
| RQ-09.2 | Cumple | PA | `standings › RQ-09.2 without results every statistic is 0 and teams are in alphabetical order`; `Standings › RQ-09.2 without results every numeric cell is 0` |
| RQ-09.3 | Cumple | PA | `standings › RQ-09.3 invariants hold for spec example …` (10 ejemplos de la spec) |
| RQ-09.4 | Cumple | PA | `standings › RQ-09.4 a pending match does not count in any statistic` |
| RQ-10.1 | Cumple | PA | `standings › RQ-10.1 orders by points (Leones 4, Tigres 3, Pumas 1)` |
| RQ-10.2 | Cumple | PA | `standings › RQ-10.2 breaks equal points by goal difference` |
| RQ-10.3 | Cumple | PA | `standings › RQ-10.3 breaks equal points and goal difference by goals for` |
| RQ-11.1 | Cumple | PA | `standings › RQ-11.1 two tied teams are ordered by the match between them` |
| RQ-11.2 | Cumple | PA | `standings › RQ-11.2 a triple tie is resolved by points among the tied teams` |
| RQ-11.3 | Cumple | PA | `standings › RQ-11.3 a circular triple tie falls back to alphabetical order` |
| RQ-11.4 | Cumple | PA | `standings › RQ-11.4 tied teams that drew between them are ordered alphabetically` |
| RQ-11.5 | Cumple | PA | `standings › RQ-11.5 tied teams with no match between them are ordered alphabetically` |
| RQ-11.6 | Cumple | PA | `standings › RQ-11.6 the head-to-head criterion is applied once per group, without recursion` (ver H-2) |
| RQ-11.7 | Cumple | PA | `standings › RQ-11.7 alphabetical order follows Spanish collation…` |
| RQ-11.8 | Cumple | PA | `standings › RQ-11.8 / RNF-01.2 order does not depend on registration order nor on result loading order` |
| RQ-12.1 | Cumple | PA + PM | `Teams › RQ-12.1 with results the field and buttons are disabled and the lock message is shown`; verificado en el navegador |
| RQ-12.2 | Cumple | PA + RC | `reducer › RQ-06.4 / RQ-12.2 with a result, teamAdded and teamRemoved do not change the state`; `TeamsSection.tsx` además ignora el envío si `locked` |
| RQ-12.3 | Cumple | PA | `Teams › RQ-12.3 without results the controls are enabled and there is no lock message` |
| RQ-12.4 | Cumple | PA | `reducer › RQ-08.2 / RQ-12.4 …`; `App › RQ-08.2 / RQ-12.4 deleting the only result unlocks the team list` |
| RQ-13.1 | Cumple | PA + PM | `storage › RQ-13.1 saving and loading returns the same tournament`; `storage › RQ-13.1 stores versioned JSON…`; `hook › RQ-13.1 saves after each change and a new mount restores it`; `App › RQ-13.1 after a reload…`; en el navegador, al recargar se ven los mismos equipos, resultados y tabla |
| RQ-13.2 | Cumple | PA | `storage › RQ-13.2 with no saved data the load result is empty`; `App › RQ-13.2 the first time the app opens there is no error notice` |
| RQ-13.3 | Cumple | PA | `storage › RQ-13.3 after deleting a result or removing a team the saved data reflects it` |
| RQ-13.4 | Cumple | PA | `App › RQ-13.4 values typed while editing and not saved are lost on reload` |
| RQ-14.1 | Cumple | PA + PM | `storage › RQ-14.1 unreadable data ("{esto no es válido") is reported as corrupt`; `App › RQ-14.1 corrupt saved data shows the notice and an empty tournament`; en el navegador, con `{esto no es válido` guardado aparece `T-27` con `Entendido` y un torneo vacío |
| RQ-14.2 | Cumple | PA | `tournament › RQ-14.2 rejects data with …` (23 casos, uno por cada condición de la spec más ids inválidos) y `…returns a valid tournament unchanged`; `storage › RQ-14.2 readable data with an unknown version is reported as corrupt` |
| RQ-14.3 | Cumple | PA | `App › RQ-14.3 "Entendido" hides the notice`; `reducer › RQ-14.3 storageNoticeDismissed hides the corrupt data notice` |
| RQ-14.4 | Cumple | PA | `hook › RQ-14.4 with corrupt data, nothing is written until the first change, which overwrites it` (ver H-5) |
| RQ-14.5 | Cumple | PA | `tournament › RQ-14.5 returns nothing partial…`; `storage › RQ-14.5 with corrupt data the initial state is an empty tournament with the notice on` |

## Requisitos no funcionales

| Criterio | Estado | Método | Evidencia |
|---|---|---|---|
| RNF-01.1 | Cumple | PA + RC | `fixture › RQ-04.4 / RNF-01.1 is deterministic…`. RC: `src/domain/` no usa `Math.random`, `Date` ni `crypto` (`grep` sin resultados). |
| RNF-01.2 | Cumple | PA | `standings › RQ-11.8 / RNF-01.2 order does not depend on registration order nor on result loading order` |
| RNF-02.1 | Cumple | PA | `Teams › RNF-02.1 the name field is labelled "Nombre del equipo"`; `MatchRow › RNF-02.1 goals fields are labelled "Goles de Tigres" and "Goles de Pumas"` |
| RNF-02.2 | Cumple | PA + PM | `Teams › RNF-02.2 pressing Enter in the field adds the team`; `MatchRow › RNF-02.2 pressing Enter in a goals field saves`; `App › RNF-02.2 adding teams and saving a result can be done with the keyboard only`. PM: en Chrome se agregaron 3 equipos y se cargó F1 solo con teclado (Tab, Enter). |
| RNF-02.3 | Cumple | PM + RC | PM: en Chrome, el campo enfocado con Tab muestra un contorno azul de 3 px. RC: regla global `:focus-visible` en `src/index.css`. |
| RNF-02.4 | Cumple | PA | `Teams › RNF-02.4 the error is announced and associated with the field`; `MatchRow › RNF-02.4 the goals error is announced and associated with both fields`; `App › RNF-02.4 the corrupt data notice is announced as an alert`. RC: `T-15` usa `role="status"`. |
| RNF-02.5 | Cumple | PA | `Standings › RNF-02.5 is a table with the 10 column headers and the full description of each abbreviation` |
| RNF-02.6 | Cumple | PA | `Teams › RNF-02.6 the remove button is named after its team`; `MatchRow › RNF-02.6 save, edit and delete buttons are named after the match` |
| RNF-03.1 | Cumple | PM + RC | PM: en Chrome, con el registro de red activo, editar y cancelar un resultado no generó ninguna petición; al recargar solo se pidieron los módulos de la app a `localhost`. RC: `grep` de `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon` y `http(s)://` en `src/` sin resultados; `npm ls --omit=dev` solo lista `react` y `react-dom`. |

---

## Hallazgos

| ID | Hallazgo | Dónde | Resolución | Estado |
|---|---|---|---|---|
| H-1 | `@testing-library/dom` no figura en la lista de dependencias permitidas de `CLAUDE.md`, pero es una *peer dependency* obligatoria de `@testing-library/react` (permitida). Se instaló en T-01 junto con RTL. | `CLAUDE.md` › Dependencias | Se agregó a la lista permitida de `CLAUDE.md` con el texto propuesto abajo, aprobado por el organizador del proyecto el 2026-10-25. | Resuelto (constitución actualizada) |
| H-2 | RQ-11.6 no tiene un ejemplo numérico en la spec. Con 3 empatados la regla "una sola vez" no se distingue de la recursiva (P-2), así que hizo falta un caso con 4 empatados. | `spec.md` › RQ-11.6 | Se construyó en la prueba una liga de 6 equipos (Tiburones, Pumas, Osos, Ranas empatados en Pts 7, DG 0, GF 2; Pumas le ganó a Osos pero Osos va primero por orden alfabético). La regla de la spec era suficiente: no hizo falta cambiarla. | Resuelto sin cambio de spec |
| H-3 | La spec no dice qué pasa si se cierra el aviso `T-27` **sin** hacer cambios y se recarga. Con la implementación actual, los datos inválidos siguen guardados y el aviso vuelve a aparecer. No contradice ningún criterio: RQ-14.4 solo habla del primer cambio. | `spec.md` › RQ-14 | Se propone documentar el comportamiento actual como RQ-14.6 (texto exacto abajo). | Pendiente de aprobación |
| H-4 | El plan proponía `tsc -b --noEmit` con referencias de proyecto. Se usó un único `tsconfig.json` con `noEmit` (el plan ya admitía la alternativa). Además, `tournament.ts` exporta `STORAGE_VERSION` y `emptyTournament`, que el plan no listaba. | `plan.md` §1 y §3 | Detalles de implementación que no cambian el comportamiento. Se registran aquí; no se modificó el plan. | Registrado |
| H-5 | RNF-02.6 pide nombres accesibles con el partido para `[T-05]`, `[T-20]`, `[T-22]` y `[T-23]`. La implementación aplica lo mismo a `[T-25]` (`Cancelar Tigres vs Pumas`). El texto visible sigue siendo `Cancelar`. | `MatchRow.tsx` | Mejora de accesibilidad compatible con la spec; no cambia ningún texto visible. | Registrado |

### Textos propuestos y aprobados

**H-1 — `CLAUDE.md`, sección "Dependencias", primer punto de la lista "sin
preguntar":**
> - `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`,
>   `@testing-library/jest-dom`, `@testing-library/user-event`.

**H-3 — `spec.md`, nuevo criterio al final de RQ-14:**
> - **RQ-14.6** — *Dado* que se muestra el aviso `[T-27]`, *cuando* el
>   organizador lo cierra con `[T-28]` sin hacer ningún cambio y recarga la
>   página, *entonces* el aviso vuelve a mostrarse, porque los datos inválidos
>   siguen guardados hasta el primer cambio (RQ-14.4).

---

## Resumen

| | Cumple | Parcial | No cumple | Total |
|---|---|---|---|---|
| Criterios funcionales (RQ) | 65 | 0 | 0 | 65 |
| Criterios no funcionales (RNF) | 9 | 0 | 0 | 9 |
| **Total** | **74** | **0** | **0** | **74** |

| Método (un criterio puede tener varios) | Criterios |
|---|---|
| Prueba automática | 72 |
| Prueba manual en el navegador | 11 |
| Revisión de código | 5 |
| Solo verificación manual o por revisión de código (sin prueba automática) | 2 (RNF-02.3, RNF-03.1) |

- **Pruebas automáticas:** 192 en 13 archivos, todas en verde.
- **Hallazgos:** 5 (H-1 a H-5). H-1 resuelto con cambio de constitución,
  H-3 pendiente de aprobación, H-2 resuelto sin cambio de spec, y H-4 y H-5
  registrados. Ninguno
  deja un criterio sin cumplir.
