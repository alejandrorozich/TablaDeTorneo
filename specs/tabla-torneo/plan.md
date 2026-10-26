# Plan técnico — Tabla de Torneo

> Documento del **cómo**. Implementa lo que define `spec.md` (aprobada,
> v1.0) dentro de los límites de `CLAUDE.md`. Si este plan contradice la spec,
> manda la spec.

- **Estado:** aprobado (2026-10-25)
- **Versión:** 1.0

---

## 1. Stack

| Aspecto | Elección |
|---|---|
| Lenguaje | TypeScript con `strict: true` (además `noUncheckedIndexedAccess`) |
| UI | React (versión estable vigente) + `react-dom` (únicas dependencias de producción) |
| Build / dev | Vite + `@vitejs/plugin-react` |
| Estilos | CSS Modules (`*.module.css`) + un `index.css` global mínimo (reset, foco visible) |
| Estado | `useReducer` dentro de un hook propio; sin Context (el árbol es chico, se pasan props) |
| Persistencia | `window.localStorage`, una sola clave |
| Pruebas | Vitest (entorno `jsdom`) + React Testing Library + `@testing-library/user-event` + `@testing-library/jest-dom` |
| Lint | ESLint (flat config) con `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` |

Scripts de `package.json` (definición de "verde" de `CLAUDE.md`):

| Script | Comando |
|---|---|
| `dev` | `vite` |
| `build` | `tsc -b && vite build` |
| `typecheck` | `tsc -b --noEmit` (o `tsc --noEmit -p …` por proyecto) |
| `lint` | `eslint . --max-warnings 0` |
| `test` | `vitest run` |

---

## 2. Arquitectura en capas

```
┌──────────────────────────────────────────────┐
│ components/   Interfaz (React, CSS Modules)  │  muestra, captura eventos,
│               App, secciones, filas, textos  │  estado efímero de formularios
└───────────────┬──────────────────────────────┘
                │ props + dispatch(acción)
┌───────────────▼──────────────────────────────┐
│ state/        Reducer, hook, persistencia    │  única fuente de verdad del
│               tournamentReducer, storage     │  torneo; guarda y carga
└───────────────┬──────────────────────────────┘
                │ llamadas a funciones puras
┌───────────────▼──────────────────────────────┐
│ domain/       Funciones puras                │  reglas del negocio: nombres,
│               teamName, fixture, goals,      │  fixture, goles, estadísticas,
│               standings, tournament          │  desempates, validación
└──────────────────────────────────────────────┘
```

Regla de dependencias: `components → state → domain`. `domain` no importa
nada de las otras capas, ni React, ni `localStorage`, ni `Date`, ni
`Math.random` (CLAUDE.md, RNF-01).

| Capa | Responsabilidad | No hace |
|---|---|---|
| `domain/` | Normalizar y validar nombres; generar el fixture; validar goles; calcular estadísticas y ordenar la tabla; validar un torneo completo; decidir si está bloqueado. | Guardar, renderizar, conocer textos de UI (devuelve **códigos** de error). |
| `state/` | Mantener el estado del torneo con un reducer; aplicar las acciones respetando las reglas del dominio (bloqueo, validación); serializar y deserializar a `localStorage` con versión. | Renderizar; decidir textos. |
| `components/` | Renderizar las secciones; mapear códigos de error a los textos exactos de la spec (`texts.ts`); manejar el estado efímero (lo escrito en un campo, qué partido está en edición). | Calcular reglas del torneo por su cuenta. |

### Archivos

```
src/
  main.tsx                         monta <App/>
  index.css                        estilos globales mínimos (foco visible)
  domain/
    types.ts                       tipos del dominio (sección 3)
    teamName.ts                    normalizeName, comparisonKey, validateNewTeamName
    fixture.ts                     generateFixture, matchId
    goals.ts                       parseGoals
    standings.ts                   computeStandings, formatGoalDifference
    tournament.ts                  isLocked, validateTournament, MAX/MIN_TEAMS
  state/
    tournamentReducer.ts           reducer + acciones + initialState
    storage.ts                     loadTournament, saveTournament, STORAGE_KEY
    useTournament.ts               hook: useReducer + carga inicial + guardado
  components/
    texts.ts                       todos los textos T-01…T-30 de la spec
    App.tsx (+ .module.css)        layout y composición
    TeamsSection.tsx (+ css)       formulario, lista, contador, bloqueo
    FixtureSection.tsx (+ css)     fechas, partidos, libre
    MatchRow.tsx (+ css)           un partido: pendiente / jugado / en edición
    StandingsTable.tsx (+ css)     tabla de posiciones
    StorageNotice.tsx (+ css)      aviso de datos corruptos
```

Cada archivo con lógica tiene su `*.test.ts(x)` al lado.

---

## 3. Modelo de datos (TypeScript)

```ts
// domain/types.ts
export type TeamId = string;            // "t1", "t2", … (ADR-3)
export type MatchId = string;           // "t1:t3" (ADR-3)

export interface Team {
  readonly id: TeamId;
  readonly name: string;                // nombre normalizado (spec §2)
}

export interface Match {
  readonly id: MatchId;
  readonly round: number;               // número de fecha, desde 1
  readonly homeId: TeamId;
  readonly awayId: TeamId;
}

export interface Round {
  readonly number: number;
  readonly matches: readonly Match[];   // en el orden de RQ-04 paso 5
  readonly byeTeamId: TeamId | null;    // equipo libre, o null si n es par
}

export interface Result {
  readonly homeGoals: number;           // entero 0–99, del local del fixture
  readonly awayGoals: number;
}

export interface Tournament {
  readonly teams: readonly Team[];      // en orden de registro
  readonly nextTeamNumber: number;      // próximo número para el id (ADR-3)
  readonly results: Readonly<Record<MatchId, Result>>;
}

export interface StandingRow {
  readonly position: number;            // 1…n
  readonly teamId: TeamId;
  readonly name: string;
  readonly played: number;              // PJ
  readonly won: number;                 // PG
  readonly drawn: number;               // PE
  readonly lost: number;                // PP
  readonly goalsFor: number;            // GF
  readonly goalsAgainst: number;        // GC
  readonly goalDifference: number;      // DG
  readonly points: number;              // Pts
}

export type TeamNameError = 'empty' | 'tooLong' | 'duplicate' | 'maxTeams';
export type ValidationResult<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

```ts
// state/tournamentReducer.ts
export interface AppState {
  readonly tournament: Tournament;
  readonly storageNotice: boolean;      // true → mostrar T-27 (RQ-14)
}

export type Action =
  | { type: 'teamAdded'; name: string }
  | { type: 'teamRemoved'; teamId: TeamId }
  | { type: 'resultSaved'; matchId: MatchId; result: Result }
  | { type: 'resultDeleted'; matchId: MatchId }
  | { type: 'storageNoticeDismissed' };
```

Firmas principales del dominio:

```ts
normalizeName(raw: string): string
comparisonKey(name: string): string
validateNewTeamName(teams: readonly Team[], raw: string): ValidationResult<string, TeamNameError>
generateFixture(teams: readonly Team[]): Round[]          // [] si n < 3 o n > 10
matchId(a: TeamId, b: TeamId): MatchId
parseGoals(raw: string): number | null                    // null si inválido
computeStandings(teams: readonly Team[], fixture: readonly Round[],
                 results: Readonly<Record<MatchId, Result>>): StandingRow[]
formatGoalDifference(dg: number): string                  // "+2" | "0" | "-1"
isLocked(t: Tournament): boolean                          // hay ≥ 1 resultado
validateTournament(data: unknown): Tournament | null      // RQ-14.2
```

---

## 4. Decisiones técnicas (ADR)

### ADR-1 — Algoritmo del fixture: método del círculo literal
- **Contexto.** RQ-04 y RQ-05 exigen un fixture todos contra todos,
  determinista y con equipo libre para cantidades impares. La spec fija el
  algoritmo paso a paso y da fixtures exactos para 3, 4 y 5 equipos.
- **Decisión.** `generateFixture` implementa literalmente los pasos 1–6 de
  RQ-04: arreglo de ids (+ `null` como marca LIBRE si n es impar), `N − 1`
  fechas, pares `(L[i], L[N−1−i])`, localía alternada solo para el par 0, y
  rotación `L = [L[0], L[N−1], L[1], …, L[N−2]]`. Es O(n²) y n ≤ 10.
- **Alternativas descartadas.** (a) Tablas de Berger precalculadas: más datos
  que mantener y más difícil de verificar contra la spec. (b) Barajar al azar:
  viola RNF-01. (c) Backtracking/búsqueda: innecesario y no garantiza el
  orden exacto de la spec.
- **Por qué.** Es la definición de la spec traducida a código, de modo que las
  pruebas de RQ-04.1, RQ-05.1 y RQ-05.2 comparan contra las tablas de la spec
  sin interpretación.

### ADR-2 — Algoritmo de orden y desempate
- **Contexto.** RQ-10 y RQ-11 definen: Pts, DG, GF, puntos entre empatados
  (aplicado una sola vez por grupo) y orden alfabético del español.
- **Decisión.** `computeStandings` trabaja en tres pasos:
  1. Calcula las estadísticas de cada equipo recorriendo los partidos del
     fixture que tienen resultado.
  2. Ordena por `(Pts desc, DG desc, GF desc)` y parte la lista en **grupos de
     empatados** consecutivos con igual terna.
  3. Para cada grupo de tamaño ≥ 2: calcula los puntos entre empatados con los
     resultados cuyos dos equipos están en el grupo y ordena el grupo por
     `(puntosEntreEmpatados desc, nombre según collator)`. No hay recursión
     (RQ-11 paso 2, P-2).
  Al final asigna `position` 1…n.
  El orden alfabético usa `new Intl.Collator('es', { sensitivity: 'accent' })`:
  ignora mayúsculas, distingue tildes, pone `ñ` después de `n` y la variante
  sin tilde antes. Como red de seguridad, si el collator devolviera 0 se
  compara por `comparisonKey` con `<`/`>` para garantizar un orden total.
- **Alternativas descartadas.** (a) Un único `sort` con comparador que calcule
  puntos entre empatados por pares: incorrecto para 3 o más (el resultado
  entre empatados depende del grupo completo, no del par) y puede ser
  intransitivo. (b) Recursión sobre subgrupos: descartada por P-2.
  (c) `localeCompare` sin opciones: depende de la configuración regional del
  navegador.
- **Por qué.** Separar "agrupar" de "desempatar" refleja la spec y vuelve el
  orden independiente del orden de registro y de carga (RQ-11.8): los grupos
  y los puntos entre empatados solo dependen de los datos, y el último
  criterio es total.

### ADR-3 — Ids deterministas de equipos y partidos
- **Contexto.** Los resultados deben quedar asociados a un partido de forma
  estable entre recargas (RQ-13). No se puede usar azar ni hora (RNF-01).
  Dos equipos pueden tener nombres que solo difieren en tildes.
- **Decisión.**
  - **Equipo:** `"t" + nextTeamNumber`, con un contador que vive en el
    `Tournament` y se persiste. Empieza en 1 y solo crece (eliminar un equipo
    no libera su número).
  - **Partido:** `matchId(a, b)` = los dos ids de equipo ordenados por su
    número y unidos con `:` (ej. `"t1:t3"`). Identifica el par sin importar
    localía ni fecha; en una sola vuelta cada par juega una vez.
  - **Resultado:** `results[matchId]` guarda los goles según la localía del
    fixture. Como el fixture no cambia mientras haya resultados (RQ-12), la
    localía es estable.
- **Alternativas descartadas.** (a) `crypto.randomUUID()`: no determinista y
  complica las pruebas. (b) Usar el nombre o su clave como id: nombres con
  `:` u otros caracteres complican el id del partido, y acopla identidad con
  presentación. (c) Id de partido por posición (`fecha-índice`): se rompe si
  cambia el orden de los equipos y no se puede validar contra el par.
- **Por qué.** Ids cortos, legibles en las pruebas y reproducibles a partir
  de la misma secuencia de acciones.

### ADR-4 — Formato y versión de lo guardado en `localStorage`
- **Contexto.** RQ-13 pide persistir todo; RQ-14 pide detectar datos
  corruptos o inválidos sin fallar y sin recuperar datos parciales.
- **Decisión.**
  - Clave única: `tabla-torneo`.
  - Valor: JSON con versión explícita:
    ```json
    {
      "version": 1,
      "teams": [{ "id": "t1", "name": "Leones" }],
      "nextTeamNumber": 2,
      "results": { "t1:t2": { "homeGoals": 2, "awayGoals": 1 } }
    }
    ```
  - Se guarda el `Tournament` completo tras cada acción que lo cambie (un
    `useEffect` sobre `state.tournament` en `useTournament`).
  - Carga (`loadTournament`): devuelve uno de tres casos —
    `{ kind: 'empty' }` (no hay clave, RQ-13.2), `{ kind: 'ok', tournament }`,
    `{ kind: 'corrupt' }` (JSON inválido, o `validateTournament` devuelve
    `null`, RQ-14.1/14.2). Con `corrupt` el estado inicial es un torneo vacío
    con `storageNotice: true`. No se borra la clave al cargar: se sobrescribe
    con el primer cambio (RQ-14.4).
  - `validateTournament` aplica todas las reglas de RQ-14.2: `version === 1`,
    tipos correctos, 0–10 equipos, nombres normalizados, no vacíos y de hasta
    30 caracteres, claves de comparación únicas, ids únicos con forma `t<n>`
    y `n < nextTeamNumber`, cada `matchId` de `results` existe en
    `generateFixture(teams)`, goles enteros 0–99, y sin resultados si hay
    menos de 3 equipos. Es todo o nada (RQ-14.5).
  - Si `localStorage` lanza una excepción (modo privado, cuota), la lectura se
    trata como `empty` y la escritura se ignora en silencio: la app sigue
    funcionando en memoria.
- **Alternativas descartadas.** (a) Sin versión: impide migrar el formato
  después. (b) Guardar también el fixture: es derivable (ADR-1) y duplicarlo
  abre inconsistencias. (c) Validar con una librería de esquemas (zod): sería
  una dependencia de producción que requiere consulta y la validación es
  chica.
- **Por qué.** Un formato mínimo y versionado; la validación completa en el
  dominio permite probar RQ-14 sin navegador. Una versión futura agregará una
  función de migración `v1 → v2`; mientras tanto, cualquier versión distinta
  de 1 es inválida.

### ADR-5 — Reglas de negocio aplicadas en el reducer, textos en la UI
- **Contexto.** RQ-12.2 pide que la lista no cambie "por cualquier vía"
  mientras hay resultados. Los textos exactos (spec §5) no deben repetirse
  por todo el código.
- **Decisión.** El reducer ignora (devuelve el mismo estado) `teamAdded` y
  `teamRemoved` si `isLocked`, `teamAdded` con nombre inválido y
  `resultSaved` con goles fuera de rango o `matchId` inexistente. Los
  componentes validan antes con las mismas funciones del dominio para
  mostrar el error (códigos → `texts.ts`). Todos los textos de la spec viven
  en `components/texts.ts` con el id `T-xx` en un comentario.
- **Alternativas descartadas.** Validar solo en la UI (el bloqueo podría
  saltearse con un dispatch); guardar el mensaje de error en el estado global
  (es estado efímero del formulario).
- **Por qué.** Defensa en profundidad y una sola fuente para los textos.

### ADR-6 — Estado efímero de edición en el componente
- **Decisión.** Lo que el usuario escribe en los campos de goles y qué partido
  está en modo edición vive en `useState` de `MatchRow`; solo al presionar
  `Guardar` con valores válidos se despacha `resultSaved`. Así RQ-13.4 (lo no
  guardado se pierde al recargar) se cumple sin lógica extra.

---

## 5. Interfaz (estructura)

Una sola página, sin rutas, con tres secciones en este orden: `Equipos`,
`Fixture`, `Tabla de posiciones`, y arriba el aviso `[T-27]` si corresponde.

- **TeamsSection:** `<form>` con `<label>` `[T-03]` + `<input>` + botón
  submit `[T-04]` (Enter envía, RNF-02.2); error con `role="alert"` y
  `aria-describedby` desde el input (RNF-02.4); contador `[T-06]`; `<ol>` de
  equipos con botón `[T-05]` y `aria-label="Eliminar {equipo}"`; con bloqueo,
  `<fieldset disabled>` + aviso `[T-15]` con `role="status"`.
- **FixtureSection:** una `<section>` por fecha con `<h3>` `[T-17]`, `<ul>` de
  `MatchRow` y `[T-19]` si hay libre.
- **MatchRow:** pendiente → `<form>` con dos inputs (`inputMode="numeric"`,
  `type="text"` para poder validar `1.5`, `abc`, etc. según RQ-06.2) con
  label `[T-29]` y botón `[T-20]`; jugado → `[T-21]` + `[T-22]` + `[T-23]`;
  edición → inputs precargados + `[T-20]` + `[T-25]`. Los botones llevan
  `aria-label` con el partido (RNF-02.6).
- **StandingsTable:** `<table>` con `<caption>`, `<th scope="col">` y
  `<abbr title="…">` con `[T-30]` (RNF-02.5).
- **Foco visible:** regla global `:focus-visible` con `outline` (RNF-02.3).

---

## 6. Estrategia de pruebas

| Nivel | Qué prueba | Herramienta | Archivos |
|---|---|---|---|
| Unidad (dominio) | Cada criterio con datos de la spec: nombres, fixture (tablas exactas + propiedades para n = 3…10), goles, estadísticas, desempates, validación de torneos | Vitest | `src/domain/*.test.ts` |
| Unidad (estado) | Reducer: cada acción, bloqueo, acciones inválidas ignoradas; storage: ida y vuelta, `empty`, `corrupt` para cada caso de RQ-14.2, excepciones de `localStorage` | Vitest + jsdom | `src/state/*.test.ts` |
| Componentes | Textos exactos, errores, bloqueo, editar/borrar, labels, roles, teclado (`user.tab()`, `{Enter}`) | RTL + user-event | `src/components/*.test.tsx` |
| Integración | Flujo completo en `<App/>`: agregar 3 equipos, cargar F1–F3 de RQ-09.1, ver tabla; "recarga" = desmontar y volver a montar leyendo el mismo `localStorage`; datos corruptos | RTL | `src/components/App.test.tsx` |
| Manual | Foco visible (RNF-02.3), recorrido con teclado en navegador real, sin red (RNF-03.1, pestaña Red de DevTools) | Navegador | registrado en `verification.md` |

Convenciones:
- Título de cada prueba: `RQ-xx.n <descripción en inglés>`
  (CLAUDE.md). Un criterio puede tener varias pruebas.
- Los datos de prueba copian los ejemplos de la spec (Leones/Tigres/Pumas,
  Rojos/Azules/Verdes, Alfa/Beta/Gama/Delta, Zorros/Osos/Lobos).
- Un helper de pruebas `buildTournament(names, scores)` en
  `src/domain/testUtils.ts` arma un `Tournament` a partir de nombres y
  resultados escritos como en la spec (`"Beta 1-0 Alfa"`), resolviendo la
  localía contra el fixture. Se prueba a sí mismo con RQ-09.1.
- `localStorage` se limpia en `beforeEach` (setup global
  `src/test/setup.ts`, que además carga `@testing-library/jest-dom`).

---

## 7. Trazabilidad

| Requisito | Módulo(s) | Archivo(s) de prueba |
|---|---|---|
| RQ-01 Agregar equipo | `domain/teamName.ts`, `state/tournamentReducer.ts`, `components/TeamsSection.tsx` | `teamName.test.ts`, `tournamentReducer.test.ts`, `TeamsSection.test.tsx` |
| RQ-02 Entre 3 y 10 | `domain/teamName.ts`, `domain/fixture.ts`, `components/FixtureSection.tsx`, `StandingsTable.tsx`, `TeamsSection.tsx` | `teamName.test.ts`, `fixture.test.ts`, `TeamsSection.test.tsx`, `App.test.tsx` |
| RQ-03 Eliminar equipo | `state/tournamentReducer.ts`, `components/TeamsSection.tsx` | `tournamentReducer.test.ts`, `TeamsSection.test.tsx`, `App.test.tsx` |
| RQ-04 Fixture | `domain/fixture.ts`, `components/FixtureSection.tsx` | `fixture.test.ts`, `FixtureSection.test.tsx` |
| RQ-05 Equipo libre | `domain/fixture.ts`, `components/FixtureSection.tsx` | `fixture.test.ts`, `FixtureSection.test.tsx` |
| RQ-06 Cargar resultado | `domain/goals.ts`, `state/tournamentReducer.ts`, `components/MatchRow.tsx` | `goals.test.ts`, `tournamentReducer.test.ts`, `MatchRow.test.tsx`, `App.test.tsx` |
| RQ-07 Editar resultado | `state/tournamentReducer.ts`, `components/MatchRow.tsx` | `tournamentReducer.test.ts`, `MatchRow.test.tsx`, `App.test.tsx` |
| RQ-08 Borrar resultado | `state/tournamentReducer.ts`, `components/MatchRow.tsx` | `tournamentReducer.test.ts`, `MatchRow.test.tsx`, `App.test.tsx` |
| RQ-09 Estadísticas | `domain/standings.ts`, `components/StandingsTable.tsx` | `standings.test.ts`, `StandingsTable.test.tsx` |
| RQ-10 Pts, DG, GF | `domain/standings.ts` | `standings.test.ts` |
| RQ-11 Desempates | `domain/standings.ts` | `standings.test.ts` |
| RQ-12 Bloqueo | `domain/tournament.ts`, `state/tournamentReducer.ts`, `components/TeamsSection.tsx` | `tournament.test.ts`, `tournamentReducer.test.ts`, `TeamsSection.test.tsx`, `App.test.tsx` |
| RQ-13 Persistencia | `state/storage.ts`, `state/useTournament.ts` | `storage.test.ts`, `App.test.tsx` |
| RQ-14 Datos corruptos | `domain/tournament.ts`, `state/storage.ts`, `components/StorageNotice.tsx` | `tournament.test.ts`, `storage.test.ts`, `App.test.tsx` |
| RNF-01 Determinismo | `domain/fixture.ts`, `domain/standings.ts` | `fixture.test.ts`, `standings.test.ts` |
| RNF-02 Accesibilidad | `components/*` | `TeamsSection.test.tsx`, `MatchRow.test.tsx`, `StandingsTable.test.tsx`, `App.test.tsx` + manual |
| RNF-03 Sin red | todo `src/` | revisión de código + manual |

---

## 8. Riesgos

| ID | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| R-1 | `Intl.Collator('es')` ordena distinto en otro motor o sin datos ICU completos | RQ-11.7 falla en algún navegador | Prueba explícita de RQ-11.7; Node ≥ 18 trae ICU completo; desempate final por `comparisonKey` garantiza orden total. |
| R-2 | Malinterpretar la rotación o la localía del método del círculo | Fixture distinto del de la spec | Pruebas que comparan contra las tablas exactas de RQ-04.1, RQ-05.1 y RQ-05.2 antes de implementar. |
| R-3 | Ejemplos de la spec mal calculados a mano | Pruebas que fallan por error del documento | Las invariantes de RQ-09.3 se prueban sobre cada ejemplo; si un ejemplo resulta inconsistente se detiene y se propone el cambio de spec (hallazgo `H-x`). |
| R-4 | `localStorage` no disponible o lleno | La app se rompe al iniciar | `try/catch` en lectura y escritura (ADR-4); prueba con un `localStorage` que lanza. |
| R-5 | Validación incompleta de datos guardados | Un dato inválido rompe la tabla o el fixture | `validateTournament` con una prueba por cada caso de RQ-14.2; todo o nada. |
| R-6 | Inputs `type="number"` del navegador filtran `1.5` o `abc` antes de validar | RQ-06.2 no se puede probar ni mostrar el error | Inputs `type="text"` con `inputMode="numeric"` (sección 5). |
| R-7 | Finales de línea CRLF en Windows hacen fallar lint o diffs | Ruido en commits | `.gitattributes` con `* text=auto eol=lf`. |
