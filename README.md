# Tabla de Torneo

App web para gestionar una liga de fútbol entre amigos en formato **todos
contra todos a una vuelta**. Permite registrar entre 3 y 10 equipos, genera
automáticamente el fixture (con equipo libre cuando la cantidad es impar),
cargar, editar y borrar resultados, y muestra la tabla de posiciones con
desempates por puntos, diferencia de gol, goles a favor, resultado entre los
empatados y orden alfabético.

Corre solo en el navegador: sin backend, sin red y sin cuentas. Los datos se
guardan en el `localStorage` del navegador. La interfaz está en español.

Proyecto construido con **Spec-Driven Development (SDD) en nivel
spec-anchored**: la especificación vive junto al código y manda sobre él.

---

## Cómo correrla

**Requisitos:** Node.js 20 o superior (probado con Node 24) y npm.

```bash
npm install        # instala dependencias
npm run dev        # servidor de desarrollo en http://localhost:5173
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta la app en modo desarrollo |
| `npm test` | Ejecuta toda la suite de pruebas (Vitest + React Testing Library) |
| `npm run typecheck` | Chequeo de tipos de TypeScript (`strict`) |
| `npm run lint` | ESLint, sin advertencias permitidas |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción localmente |

Una tarea se considera **en verde** cuando pasan `test`, `typecheck`, `lint`
y `build`.

**Stack:** React + TypeScript (strict) + Vite, CSS Modules y `useReducer`.
No usa librerías de UI, de CSS ni de estado. Las únicas dependencias de
producción son `react` y `react-dom`.

---

## Estructura del repositorio

```
CLAUDE.md                      constitución del proyecto (reglas para todo)
README.md
specs/tabla-torneo/
  spec.md                      QUÉ hace la app (HU, RQ con criterios, textos de UI)
  plan.md                      CÓMO se construye (capas, tipos, ADR, pruebas, riesgos)
  tasks.md                     tareas T-01…T-12 ordenadas y trazables
  verification.md              cada criterio con su estado, método y evidencia
src/
  domain/                      funciones puras: nombres, fixture, goles, tabla, desempates, validación
  state/                       reducer, persistencia versionada y hook useTournament
  components/                  interfaz (React + CSS Modules) y textos exactos de la spec
```

Las pruebas van junto a cada archivo (`*.test.ts` / `*.test.tsx`).

## Estructura de la especificación

| Documento | Contenido | Identificadores |
|---|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Idioma, stack y límites, dependencias permitidas, orden de trabajo, reglas spec-anchored, TDD, commits y permisos | — |
| [`spec.md`](specs/tabla-torneo/spec.md) | Propósito, glosario con fórmulas, 8 historias, 14 requisitos con 66 criterios Dado/Cuando/Entonces y ejemplos numéricos, 30 textos de UI, no funcionales, fuera de alcance, preguntas abiertas resueltas | `HU-x`, `RQ-xx`, `RQ-xx.n`, `RNF-xx.n`, `T-xx` (textos), `P-x` |
| [`plan.md`](specs/tabla-torneo/plan.md) | Arquitectura en capas, modelo de datos en TypeScript, 6 decisiones ADR, estrategia de pruebas, trazabilidad RQ → módulo → prueba, riesgos | `ADR-x`, `R-x` |
| [`tasks.md`](specs/tabla-torneo/tasks.md) | 12 tareas con objetivo, criterios cubiertos, archivos, pruebas primero y "Hecha cuando"; matriz de cobertura de los 75 criterios | `T-xx` |
| [`verification.md`](specs/tabla-torneo/verification.md) | Estado de cada criterio (75/75 cumplen), método y evidencia, hallazgos y resumen | `H-x` |

La trazabilidad recorre toda la cadena: una historia `HU` origina requisitos
`RQ`, cada criterio `RQ-xx.n` está asignado a una tarea `T-xx` (matriz de
`tasks.md`), cada prueba lleva el `RQ-xx.n` en su título, cada commit de
implementación indica `Task:` y `Covers:` en su cuerpo, y `verification.md`
enlaza cada criterio con la prueba que lo demuestra.

---

## Cómo se aplicó SDD

El trabajo siguió el orden **constitución → spec → plan → tasks → código →
verificación**. Cada fase de documentos terminó con una pausa para revisión y
aprobación, y cada documento aprobado tuvo su propio commit.

| Fase | Qué se hizo | Evidencia |
|---|---|---|
| **0. Constitución** | Se fijaron las reglas que valen para todo el proyecto: idioma, stack y límites, dependencias permitidas, "la spec manda", TDD con el RQ en el título de cada prueba, la definición de "verde", un commit por tarea y los permisos. | [`CLAUDE.md`](CLAUDE.md) · commit `0a108fb docs: add project constitution` |
| **1. Especificación** | Solo el **qué**, sin tecnología. Requisitos con criterios verificables y ejemplos con números: fixtures exactos para 3, 4 y 5 equipos, tablas esperadas, triple empate, empate circular, borrar un resultado, nombres duplicados y datos corruptos. Las ambigüedades se anotaron como preguntas abiertas (P-1 a P-6) y se confirmaron antes de aprobar; entre ellas, que el criterio entre empatados se aplica una sola vez por grupo. | [`spec.md`](specs/tabla-torneo/spec.md) · commit `fe3739c docs: add tournament table specification` |
| **2. Plan** | El **cómo**: capas `components → state → domain` con un dominio puro, tipos, ADR (método del círculo literal, desempate por grupos, ids deterministas `t<n>` y `t1:t3`, formato `localStorage` versionado y validado todo o nada), estrategia de pruebas, trazabilidad y riesgos. | [`plan.md`](specs/tabla-torneo/plan.md) · commit `b7c2e31 docs: add technical plan` |
| **3. Tareas** | 12 tareas ordenadas: proyecto, dominio, estado e interfaz. Cada una con sus criterios, archivos, pruebas a escribir primero y condición de terminada, más una matriz que muestra que los 74 criterios de la v1.0 de la spec están cubiertos. | [`tasks.md`](specs/tabla-torneo/tasks.md) · commit `31d756b docs: add implementation tasks` |
| **4. Implementación** | Por cada tarea: escribir las pruebas a partir de los criterios, verlas **fallar**, implementar hasta **verde** (los 4 chequeos), marcar el checkbox y hacer un commit. | 12 commits, de `d5c4f80` (T-01) a `2761e9e` (T-12), cada uno con `Task:` y `Covers:` · checkboxes marcados en `tasks.md` |
| **5. Verificación** | Cada criterio con su estado, método (prueba automática, prueba manual en Chrome o revisión de código) y evidencia. Se registraron los hallazgos H-1 a H-5. | [`verification.md`](specs/tabla-torneo/verification.md) · commit `3d1393b docs: add verification report` |

**La spec sigue viva después de la verificación.** Los hallazgos que pedían
cambiar documentos aprobados se propusieron con su texto exacto y se aplicaron
recién después de aprobarlos. H-1 actualizó la constitución (commit
`docs: allow @testing-library/dom as a dev dependency`). H-3 agregó el
criterio RQ-14.6 a la spec (v1.1) en el mismo commit que su prueba y que las
actualizaciones de `tasks.md` y `verification.md`.

Para ver la secuencia completa:

```bash
git log --oneline              # un commit por documento y uno por tarea
git show <commit> --stat       # qué cambió cada tarea (código, pruebas, checkbox)
```

**Resultado:** 75 de 75 criterios cumplen, con 193 pruebas automáticas en
verde. Los dos criterios que no tienen prueba automática (foco visible y
ausencia de tráfico de red) se verificaron a mano en el navegador y revisando
el código.
