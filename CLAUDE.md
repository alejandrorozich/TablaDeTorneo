# CLAUDE.md — Tabla de Torneo (constitución del proyecto)

Reglas que valen para todo el proyecto y para cualquier persona o agente que
trabaje en él. Si una instrucción puntual choca con algo de aquí, se avisa y
se pregunta antes de seguir.

## Proyecto

Tabla de Torneo: app web para gestionar una liga de fútbol entre amigos en
formato todos contra todos a una vuelta. Registra los equipos, genera el
fixture, permite cargar resultados y calcula la tabla de posiciones con sus
desempates. Corre solo en el navegador: sin backend, sin red y sin deploy.

## Idioma

- Documentos (`CLAUDE.md`, `README.md`, `spec.md`, `plan.md`, `tasks.md`,
  `verification.md`): español.
- Código (identificadores y comentarios), nombres de archivos de código y
  mensajes de commit: inglés.
- Los títulos de las pruebas van en inglés y empiezan con el `RQ-xx` que
  comprueban (ver "Pruebas").
- Los textos visibles de la interfaz se copian **exactamente** como los define
  la sección "Textos de la interfaz" de la spec (mayúsculas, tildes y
  puntuación incluidas). Un texto de UI que no esté en la spec no se inventa:
  se propone agregarlo a la spec.

## Stack y límites

- React + TypeScript (`strict: true`) + Vite.
- Pruebas con Vitest y React Testing Library (entorno `jsdom`).
- ESLint para el análisis estático.
- Estilos con CSS Modules. Sin librerías de UI (MUI, Chakra…) ni de CSS
  (Tailwind, Bootstrap, styled-components…).
- Estado con `useReducer` + Context si hace falta. Sin librerías de estado
  (Redux, Zustand, Jotai…).
- Sin frameworks sobre React (Next, Remix…), sin router.
- Sin backend ni llamadas de red. La única persistencia es `localStorage`.
- La lógica del dominio (`src/domain/`) es pura: sin React, sin `localStorage`,
  sin `Date.now()` ni `Math.random()`. Toda salida depende solo de la entrada.

### Dependencias

Se pueden instalar **sin preguntar** (siempre como `devDependencies`):
- `vite`, `@vitejs/plugin-react`, `typescript`.
- `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`,
  `@testing-library/jest-dom`, `@testing-library/user-event`.
- `eslint` y sus plugins/configuraciones para TypeScript y React
  (`typescript-eslint`, `eslint-plugin-react-hooks`,
  `eslint-plugin-react-refresh`, `@eslint/js`, `globals`).
- `@types/*` de los paquetes anteriores.

Requieren **consulta previa**:
- Cualquier dependencia de producción además de `react` y `react-dom`.
- Cualquier dependencia de desarrollo que no esté en la lista anterior.
- Cualquier paquete que contradiga los límites del stack.

## Documentos y orden de trabajo

Todos los documentos de la funcionalidad viven en `specs/tabla-torneo/`:

| Documento | Responde | Contenido |
|---|---|---|
| `spec.md` | **Qué** hace la app | Historias `HU-x`, requisitos `RQ-xx` con criterios `RQ-xx.n`, textos de UI, no funcionales, fuera de alcance. Sin tecnología. |
| `plan.md` | **Cómo** se construye | Arquitectura, tipos, decisiones `ADR-x`, estrategia de pruebas, trazabilidad, riesgos. |
| `tasks.md` | **En qué orden** | Tareas `T-xx` con checkbox, `RQ-xx` cubiertos, pruebas y "Hecha cuando". |
| `verification.md` | **Cómo sabemos que cumple** | Cada criterio `RQ-xx.n` con estado, método y evidencia; hallazgos `H-x`. |

- Orden de trabajo: **constitución → spec → plan → tasks → código →
  verificación**. No se empieza un documento sin haber aprobado el anterior.
- **La spec manda.** Si el código y la spec no coinciden, el error es del
  código, salvo que se acuerde explícitamente cambiar la spec.
- Los identificadores (`HU-x`, `RQ-xx`, `RQ-xx.n`, `ADR-x`, `T-xx`, `H-x`) son
  estables: no se renumeran. Un requisito eliminado se marca como
  "Retirado" en lugar de borrarse.

## Spec-anchored

- La spec no se descarta al terminar: se mantiene viva junto al código y es la
  fuente de verdad del comportamiento.
- Ningún cambio de comportamiento visible sin actualizar **antes o a la vez**
  el requisito `RQ-xx` correspondiente (y el plan, si cambia el cómo). Ese
  cambio de documento va en el mismo commit que el código.
- Si un cambio no tiene requisito, se propone uno nuevo con su texto exacto y
  se consulta antes de escribirlo.
- Si durante la implementación aparece un hueco o una contradicción en la
  spec, se detiene el trabajo, se propone el texto exacto del cambio y, una
  vez aprobado, se corrige primero la spec. Se registra como hallazgo `H-x`
  en `verification.md`.

## Pruebas

- **TDD por tarea**: las pruebas se escriben primero, a partir de los criterios
  de aceptación de los `RQ-xx` que cubre la tarea. Se ejecutan y se confirma
  que **fallan**; luego se implementa hasta que **pasan**.
- El título de cada prueba nombra el criterio que comprueba, p. ej.
  `it('RQ-05.2 orders tied teams by goal difference', …)`.
- Las pruebas van junto al archivo que prueban: `*.test.ts` / `*.test.tsx`.
- Prohibido `skip`, `only`, `todo` en la suite, borrar pruebas o debilitar sus
  aserciones para ponerlas en verde. Si algo falla, se reporta con su salida.
- Definición de **"verde"**: pasan sin errores los cuatro chequeos
  1. `npm test` (la suite completa, no solo las pruebas nuevas),
  2. `npm run typecheck`,
  3. `npm run lint`,
  4. `npm run build`.

## Commits

- Fase de documentos: un commit por documento aprobado
  (p. ej. `docs: add project constitution`).
- Fase de implementación: **un commit por tarea** de `tasks.md`, solo en
  verde. Incluye código, pruebas, el checkbox marcado en `tasks.md` y, si
  aplica, los cambios de spec y plan.
- Formato Conventional Commits, en inglés y en imperativo:
  `tipo: descripción` (p. ej. `feat: add round-robin fixture generation`).
  Tipos: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`, `style`.
- El cuerpo del commit puede mencionar la tarea y los requisitos
  (`Task: T-03`, `Covers: RQ-04, RQ-05`).

## Permisos

Requieren **OK explícito** antes de hacerse:
- Cambiar `spec.md` o `plan.md` fuera de una tarea (se propone el texto exacto
  antes de editar), o cambiar esta constitución.
- Agregar, quitar o reordenar tareas en `tasks.md`.
- Instalar dependencias fuera de la lista permitida.
- Acciones git destructivas o que reescriben historia: `reset --hard`,
  `rebase`, `push --force`, `commit --amend`, borrar ramas, `clean -f`.
- `git push` o configurar remotos.

Se hacen **sin preguntar**:
- Leer cualquier archivo del repositorio y ejecutar los chequeos
  (`npm test`, `typecheck`, `lint`, `build`, `dev`).
- Instalar las dependencias de la lista permitida.
- Crear y editar código y pruebas dentro de una tarea en curso.
- Marcar el checkbox de la tarea terminada y hacer su commit cuando está en
  verde.
