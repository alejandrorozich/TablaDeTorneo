# Especificación — Tabla de Torneo

> Documento del **qué**. No describe tecnología ni implementación (eso está en
> `plan.md`). Si el código y este documento no coinciden, el error es del
> código, salvo que se acuerde cambiar la spec (ver `CLAUDE.md`).

- **Estado:** aprobada (2026-10-25)
- **Versión:** 1.0
- **Identificadores:** historias `HU-x`, requisitos funcionales `RQ-xx`,
  criterios `RQ-xx.n`, requisitos no funcionales `RNF-xx` con criterios
  `RNF-xx.n`. Los identificadores no se renumeran.

---

## 1. Propósito y usuarios

### Propósito
Permitir que un grupo de amigos organice una liga de fútbol en formato **todos
contra todos a una sola vuelta**: registrar los equipos, obtener el calendario
de partidos (fixture), anotar los resultados y consultar en todo momento la
tabla de posiciones con criterios de desempate claros y sin discusiones.

### Usuarios
- **Organizador:** la única persona que usa la app. Carga los equipos y los
  resultados desde su navegador. No hay cuentas ni otros roles.
- **Participantes:** miran la pantalla del organizador (o una captura) para
  consultar el fixture y la tabla. No interactúan con la app.

### Contexto de uso
- Un solo torneo a la vez, en un solo navegador.
- Los datos quedan guardados en ese navegador y sobreviven a recargar la
  página o cerrar el navegador.

---

## 2. Glosario y modelo del dominio

| Término | Definición |
|---|---|
| **Torneo** | Conjunto de equipos registrados, su fixture y los resultados cargados. Hay uno solo. |
| **Equipo** | Participante del torneo, identificado por su **nombre**. Los equipos tienen un **orden de registro** (el orden en que se agregaron), que determina el fixture. |
| **Nombre normalizado** | El nombre tal como se ingresó, sin espacios al principio ni al final y con cada secuencia de espacios internos reducida a uno solo. Ej.: `"  River   Plate "` → `"River Plate"`. Es el nombre que se guarda y se muestra. |
| **Clave de comparación** | El nombre normalizado en minúsculas. Dos equipos con la misma clave son el mismo nombre (duplicado). Ej.: `"River Plate"` y `"river plate"` tienen la misma clave. Las tildes **sí** distinguen: `"Atlético"` ≠ `"Atletico"`. |
| **Fixture** | Calendario completo del torneo: lista ordenada de fechas. Cada par de equipos se enfrenta exactamente una vez. |
| **Fecha** | Ronda del fixture, numerada desde 1. En una fecha cada equipo juega como máximo un partido. |
| **Equipo libre** | Con un número impar de equipos, el equipo que no juega en una fecha determinada. Cada equipo queda libre exactamente una vez. |
| **Partido** | Enfrentamiento entre un equipo **local** y un equipo **visitante** dentro de una fecha. Un partido está **pendiente** (sin resultado) o **jugado** (con resultado). |
| **Resultado** | Par de goles `(goles del local, goles del visitante)`, cada uno entero entre 0 y 99. Un partido tiene como máximo un resultado. |
| **Estado del torneo** | **En preparación:** no hay ningún resultado cargado; los equipos se pueden modificar. **En juego:** hay al menos un resultado cargado; los equipos están bloqueados. |
| **Tabla de posiciones** | Lista de **filas**, una por equipo, ordenada según los criterios de RQ-10 y RQ-11. |
| **Fila de tabla** | Posición y estadísticas de un equipo, calculadas solo con los partidos jugados. |
| **Grupo de empatados** | Conjunto de dos o más equipos con igual Pts, DG y GF. |
| **Puntos entre empatados** | Puntos que obtiene un equipo considerando solo los partidos jugados entre equipos del mismo grupo de empatados. |

### Estadísticas de una fila

Para un equipo *E*, considerando **solo los partidos jugados** en los que
participa *E* (como local o visitante). "Goles propios" son los que convirtió
*E* en ese partido y "goles rivales" los que convirtió su rival:

| Sigla | Nombre | Fórmula |
|---|---|---|
| **PJ** | Partidos jugados | Cantidad de partidos jugados de *E*. Siempre `PJ = PG + PE + PP`. |
| **PG** | Partidos ganados | Partidos con goles propios > goles rivales. |
| **PE** | Partidos empatados | Partidos con goles propios = goles rivales. |
| **PP** | Partidos perdidos | Partidos con goles propios < goles rivales. |
| **GF** | Goles a favor | Suma de goles propios. |
| **GC** | Goles en contra | Suma de goles rivales. |
| **DG** | Diferencia de gol | `GF − GC` (puede ser negativa). |
| **Pts** | Puntos | `3 × PG + 1 × PE` (la derrota suma 0). |

---

## 3. Historias de usuario

- **HU-1** — Como organizador, quiero registrar los equipos participantes para
  armar el torneo.
- **HU-2** — Como organizador, quiero obtener automáticamente el fixture todos
  contra todos para saber quién juega contra quién en cada fecha.
- **HU-3** — Como organizador, quiero cargar el resultado de cada partido para
  que la tabla refleje lo que pasó en la cancha.
- **HU-4** — Como organizador, quiero editar o borrar un resultado para
  corregir errores de carga.
- **HU-5** — Como participante, quiero ver la tabla de posiciones con todas las
  estadísticas para saber cómo va el torneo.
- **HU-6** — Como participante, quiero que los empates en la tabla se resuelvan
  con reglas fijas y conocidas para que no haya discusiones.
- **HU-7** — Como organizador, quiero que los datos se conserven al recargar o
  cerrar el navegador para no perder el torneo.
- **HU-8** — Como organizador, quiero que no se pueda cambiar la lista de
  equipos una vez empezado el torneo para que el fixture y los resultados no
  queden inconsistentes.

---

## 4. Requisitos funcionales

> **Convención de los ejemplos.** Los textos entre comillas que aparecen en la
> interfaz están definidos en la sección 5 y se identifican como `[T-xx]`.
> Cuando un ejemplo de tabla o desempate dice `X a-b Y`, significa que *X*
> convirtió *a* goles e *Y* convirtió *b* goles en su partido, sin importar
> quién fue local. Los ejemplos de fixture sí respetan la localía.

### RQ-01 — Agregar un equipo
**Origen:** HU-1

El organizador puede agregar un equipo escribiendo su nombre. El nombre se
guarda normalizado. Se rechaza si está vacío, si supera los 30 caracteres o si
ya existe un equipo con la misma clave de comparación. Los equipos se muestran
en orden de registro.

**Criterios de aceptación**
- **RQ-01.1** — *Dado* un torneo en preparación sin equipos, *cuando* el
  organizador agrega `"Leones"`, *entonces* la lista de equipos muestra
  `Leones` y el contador muestra `1 de 10 equipos` `[T-06]`.
- **RQ-01.2** — *Dado* un torneo en preparación, *cuando* el organizador agrega
  `"  River   Plate  "`, *entonces* el equipo se guarda y se muestra como
  `River Plate`.
- **RQ-01.3** — *Dado* un torneo con el equipo `River Plate`, *cuando* el
  organizador intenta agregar `"river plate"`, `"RIVER PLATE"` o
  `" River  Plate "`, *entonces* el equipo no se agrega y se muestra el error
  `[T-11]`.
- **RQ-01.4** — *Dado* un torneo con el equipo `Atlético`, *cuando* el
  organizador agrega `"Atletico"`, *entonces* el equipo se agrega (las tildes
  distinguen nombres).
- **RQ-01.5** — *Dado* un torneo en preparación, *cuando* el organizador intenta
  agregar `""` o `"    "`, *entonces* no se agrega ningún equipo y se muestra
  el error `[T-10]`.
- **RQ-01.6** — *Dado* un torneo en preparación, *cuando* el organizador intenta
  agregar un nombre que, normalizado, tiene 31 caracteres, *entonces* no se
  agrega y se muestra el error `[T-12]`; con exactamente 30 caracteres, sí se
  agrega.
- **RQ-01.7** — *Dado* que se agregaron, en este orden, `Leones`, `Tigres` y
  `Pumas`, *cuando* se mira la lista de equipos, *entonces* aparecen en ese
  mismo orden.
- **RQ-01.8** — *Dado* que se mostró un error al agregar, *cuando* el
  organizador agrega con éxito un equipo válido, *entonces* el error desaparece
  y el campo de nombre queda vacío.

### RQ-02 — Cantidad de equipos (entre 3 y 10)
**Origen:** HU-1, HU-2

El torneo admite como máximo 10 equipos. El fixture y la tabla solo existen
con al menos 3 equipos.

**Criterios de aceptación**
- **RQ-02.1** — *Dado* un torneo con 10 equipos, *cuando* el organizador intenta
  agregar un undécimo equipo con nombre válido, *entonces* no se agrega y se
  muestra el error `[T-13]`.
- **RQ-02.2** — *Dado* un torneo con 0, 1 o 2 equipos, *cuando* se mira la
  sección de fixture, *entonces* no se muestran fechas y se muestra el estado
  vacío `[T-16]`; en la sección de tabla se muestra `[T-24]`.
- **RQ-02.3** — *Dado* un torneo con 2 equipos, *cuando* se agrega el tercero,
  *entonces* se muestran el fixture y la tabla de posiciones.
- **RQ-02.4** — *Dado* un torneo sin equipos, *cuando* se mira la sección de
  equipos, *entonces* se muestra el estado vacío `[T-07]`.

### RQ-03 — Eliminar un equipo
**Origen:** HU-1

Mientras el torneo está en preparación, el organizador puede eliminar
cualquier equipo. Los demás conservan su orden relativo de registro y el
fixture se recalcula.

**Criterios de aceptación**
- **RQ-03.1** — *Dado* un torneo en preparación con `A`, `B`, `C`, `D`, *cuando*
  el organizador elimina `B`, *entonces* la lista queda `A`, `C`, `D` y el
  fixture mostrado es el de esos 3 equipos en ese orden (ver RQ-05.1 con
  `B`→`C`, `C`→`D`).
- **RQ-03.2** — *Dado* un torneo en preparación con 3 equipos, *cuando* se
  elimina uno, *entonces* el fixture y la tabla dejan de mostrarse (RQ-02.2).
- **RQ-03.3** — *Dado* que se eliminó `Leones`, *cuando* se agrega de nuevo
  `"leones"`, *entonces* se acepta (ya no es duplicado) y queda al final del
  orden de registro.

### RQ-04 — Generación del fixture
**Origen:** HU-2

El fixture se genera automáticamente a partir de la lista de equipos en orden
de registro, cada vez que hay entre 3 y 10 equipos. Se usa el **método del
círculo**, definido así:

1. Sea `L` la lista de equipos en orden de registro. Si la cantidad de equipos
   es impar, se agrega al final de `L` una marca **LIBRE**. Sea `N` el largo
   de `L` (siempre par).
2. Hay `N − 1` fechas. Para la fecha `f` (1, 2, …, `N − 1`) se forman los pares
   `(L[i], L[N − 1 − i])` para `i = 0, 1, …, N/2 − 1` (posiciones desde 0).
3. **Localía:** en el par `i = 0`, si `f` es impar el local es `L[0]`; si `f`
   es par el local es `L[N − 1]`. En los pares `i ≥ 1`, el local es `L[i]` y el
   visitante `L[N − 1 − i]`.
4. Un par que contiene la marca LIBRE no es un partido: el otro equipo del par
   es el **equipo libre** de esa fecha.
5. Los partidos de una fecha se listan en orden de `i` creciente (omitiendo el
   par con LIBRE).
6. Después de cada fecha se rota `L` manteniendo fijo `L[0]`: el último
   elemento pasa a la posición 1 y los demás desde la posición 1 avanzan un
   lugar. Ej.: `[A, B, C, D]` → `[A, D, B, C]`.

**Criterios de aceptación**
- **RQ-04.1** — *Dado* los equipos `A`, `B`, `C`, `D` registrados en ese orden,
  *cuando* se genera el fixture, *entonces* es exactamente:

  | Fecha | Partidos (local vs visitante) |
  |---|---|
  | 1 | A vs D · B vs C |
  | 2 | C vs A · D vs B |
  | 3 | A vs B · C vs D |

- **RQ-04.2** — *Dado* `n` equipos con `n` par (4, 6, 8 o 10), *cuando* se genera
  el fixture, *entonces* tiene `n − 1` fechas, cada fecha tiene `n/2` partidos,
  ningún equipo queda libre y el total de partidos es `n(n − 1)/2`.
- **RQ-04.3** — *Dado* cualquier cantidad de equipos entre 3 y 10, *cuando* se
  genera el fixture, *entonces* cada par de equipos distintos se enfrenta
  exactamente una vez y ningún equipo juega dos veces en la misma fecha.
- **RQ-04.4** — *Dado* los mismos equipos en el mismo orden, *cuando* se genera
  el fixture dos veces (o tras recargar la página), *entonces* ambos fixtures
  son idénticos: mismas fechas, mismos partidos, misma localía y mismo orden.
- **RQ-04.5** — *Dado* los equipos `A`, `B`, `C`, `D`, *cuando* se registran en
  otro orden (`D`, `C`, `B`, `A`), *entonces* el fixture se calcula con ese
  nuevo orden (fecha 1: `D vs A · C vs B`).
- **RQ-04.6** — *Dado* un fixture generado, *cuando* se muestra, *entonces* cada
  fecha aparece con el título `[T-17]` y cada partido muestra local y
  visitante en el formato `[T-18]`.

### RQ-05 — Equipo libre con cantidad impar
**Origen:** HU-2

**Criterios de aceptación**
- **RQ-05.1** — *Dado* los equipos `A`, `B`, `C` registrados en ese orden,
  *cuando* se genera el fixture, *entonces* es exactamente:

  | Fecha | Partidos | Libre |
  |---|---|---|
  | 1 | B vs C | A |
  | 2 | C vs A | B |
  | 3 | A vs B | C |

- **RQ-05.2** — *Dado* los equipos `A`, `B`, `C`, `D`, `E` registrados en ese
  orden, *cuando* se genera el fixture, *entonces* es exactamente:

  | Fecha | Partidos | Libre |
  |---|---|---|
  | 1 | B vs E · C vs D | A |
  | 2 | E vs A · B vs C | D |
  | 3 | A vs D · E vs C | B |
  | 4 | C vs A · D vs B | E |
  | 5 | A vs B · D vs E | C |

- **RQ-05.3** — *Dado* `n` equipos con `n` impar (3, 5, 7 o 9), *cuando* se
  genera el fixture, *entonces* tiene `n` fechas, cada fecha tiene `(n − 1)/2`
  partidos y exactamente un equipo libre, y cada equipo queda libre
  exactamente una vez.
- **RQ-05.4** — *Dado* una fecha con equipo libre, *cuando* se muestra,
  *entonces* debajo de sus partidos aparece `[T-19]` con el nombre del equipo
  libre.

### RQ-06 — Cargar un resultado
**Origen:** HU-3

Cada partido pendiente muestra dos campos de goles (local y visitante) y el
botón `[T-20]`. Un valor de goles es válido si, sin espacios alrededor, es un
número entero entre 0 y 99 escrito solo con dígitos (`"07"` se acepta como 7).

**Criterios de aceptación**
- **RQ-06.1** — *Dado* el partido pendiente `Tigres vs Pumas`, *cuando* el
  organizador ingresa `2` y `1` y presiona `[T-20]`, *entonces* el partido pasa
  a jugado y muestra `2 - 1` `[T-21]`.
- **RQ-06.2** — *Dado* un partido pendiente, *cuando* el organizador guarda con
  alguno de estos valores en cualquiera de los campos: vacío, `-1`, `100`,
  `1.5`, `2,5`, `abc`, *entonces* el resultado no se guarda, el partido sigue
  pendiente y se muestra el error `[T-14]` junto a ese partido.
- **RQ-06.3** — *Dado* un partido pendiente, *cuando* el organizador guarda `0` y
  `0`, *entonces* se acepta (empate 0 - 0); con `99` y `99` también se acepta.
- **RQ-06.4** — *Dado* un torneo en preparación, *cuando* se guarda el primer
  resultado, *entonces* el torneo pasa a estar en juego (ver RQ-12).
- **RQ-06.5** — *Dado* que se guarda un resultado, *cuando* se mira la tabla,
  *entonces* ya refleja ese resultado (sin acciones adicionales).

### RQ-07 — Editar un resultado
**Origen:** HU-4

Un partido jugado muestra su resultado y los botones `[T-22]` y `[T-23]`. Al
editar, los campos aparecen con los goles actuales y los botones `[T-20]` y
`[T-25]`.

**Criterios de aceptación**
- **RQ-07.1** — *Dado* el partido jugado `Leones 3 - 1 Tigres`, *cuando* el
  organizador presiona `[T-22]`, *entonces* aparecen los campos con `3` y `1`.
- **RQ-07.2** — *Dado* el torneo del ejemplo de RQ-09.1, *cuando* el organizador
  edita `Leones 3 - 1 Tigres` a `1 - 1` y guarda, *entonces* el partido muestra
  `1 - 1` y la tabla queda:

  | # | Equipo | PJ | PG | PE | PP | GF | GC | DG | Pts |
  |---|---|---|---|---|---|---|---|---|---|
  | 1 | Tigres | 2 | 1 | 1 | 0 | 3 | 2 | +1 | 4 |
  | 2 | Leones | 2 | 0 | 2 | 0 | 1 | 1 | 0 | 2 |
  | 3 | Pumas | 2 | 0 | 1 | 1 | 1 | 2 | -1 | 1 |

- **RQ-07.3** — *Dado* un partido en edición, *cuando* el organizador ingresa un
  valor inválido (RQ-06.2) y guarda, *entonces* se muestra `[T-14]` y el
  resultado anterior se conserva sin cambios.
- **RQ-07.4** — *Dado* un partido en edición, *cuando* el organizador presiona
  `[T-25]`, *entonces* se vuelve a mostrar el resultado anterior sin cambios.

### RQ-08 — Borrar un resultado
**Origen:** HU-4

**Criterios de aceptación**
- **RQ-08.1** — *Dado* el torneo del ejemplo de RQ-09.1, *cuando* el organizador
  borra el resultado de `Leones 3 - 1 Tigres` con `[T-23]`, *entonces* ese
  partido vuelve a estar pendiente (con los campos vacíos) y la tabla queda:

  | # | Equipo | PJ | PG | PE | PP | GF | GC | DG | Pts |
  |---|---|---|---|---|---|---|---|---|---|
  | 1 | Tigres | 1 | 1 | 0 | 0 | 2 | 1 | +1 | 3 |
  | 2 | Leones | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 1 |
  | 3 | Pumas | 2 | 0 | 1 | 1 | 1 | 2 | -1 | 1 |

- **RQ-08.2** — *Dado* un torneo con un único resultado cargado, *cuando* se
  borra, *entonces* el torneo vuelve a estar en preparación y la lista de
  equipos se puede modificar otra vez.
- **RQ-08.3** — *Dado* un partido con su resultado borrado, *cuando* se carga un
  resultado nuevo, *entonces* se comporta como en RQ-06.

### RQ-09 — Estadísticas de la tabla de posiciones
**Origen:** HU-5

Con 3 o más equipos se muestra la tabla con las columnas `[T-26]`. Hay una fila
por cada equipo registrado, aunque no haya jugado. Las estadísticas se
calculan con las fórmulas de la sección 2. La DG se muestra con signo `+` si es
positiva, `0` si es cero y `-` si es negativa (ej.: `+2`, `0`, `-1`). La
columna `#` numera las posiciones de 1 a *n* sin repetir.

**Criterios de aceptación**
- **RQ-09.1** — *Dado* los equipos `Leones`, `Tigres`, `Pumas` registrados en ese
  orden (fixture: F1 `Tigres vs Pumas`, F2 `Pumas vs Leones`, F3
  `Leones vs Tigres`), *cuando* se cargan F1 `2 - 1`, F2 `0 - 0` y F3 `3 - 1`,
  *entonces* la tabla es:

  | # | Equipo | PJ | PG | PE | PP | GF | GC | DG | Pts |
  |---|---|---|---|---|---|---|---|---|---|
  | 1 | Leones | 2 | 1 | 1 | 0 | 3 | 1 | +2 | 4 |
  | 2 | Tigres | 2 | 1 | 0 | 1 | 3 | 4 | -1 | 3 |
  | 3 | Pumas | 2 | 0 | 1 | 1 | 1 | 2 | -1 | 1 |

- **RQ-09.2** — *Dado* un torneo con 3 o más equipos y ningún resultado,
  *cuando* se mira la tabla, *entonces* todos los equipos aparecen con todas
  sus estadísticas en `0` y ordenados alfabéticamente (RQ-11.5).
- **RQ-09.3** — *Dado* cualquier torneo, *cuando* se calcula la tabla,
  *entonces* para cada fila se cumple `PJ = PG + PE + PP`, `DG = GF − GC` y
  `Pts = 3·PG + PE`, y la suma de GF de todas las filas es igual a la suma de
  GC de todas las filas.
- **RQ-09.4** — *Dado* un partido pendiente, *cuando* se calcula la tabla,
  *entonces* ese partido no suma en ninguna estadística.

### RQ-10 — Orden de la tabla: puntos, diferencia de gol y goles a favor
**Origen:** HU-5, HU-6

Las filas se ordenan, de mayor a menor, por: (1) Pts, (2) DG, (3) GF. Si
persiste el empate se aplica RQ-11.

**Criterios de aceptación**
- **RQ-10.1** — *Dado* el ejemplo de RQ-09.1, *cuando* se ordena la tabla,
  *entonces* el orden es `Leones` (4 Pts), `Tigres` (3), `Pumas` (1).
- **RQ-10.2 (diferencia de gol)** — *Dado* los equipos `Rojos`, `Azules`,
  `Verdes` registrados en ese orden, *cuando* se cargan F1 `Azules 1 - 0 Verdes`,
  F2 `Verdes 0 - 3 Rojos` y F3 `Rojos 1 - 1 Azules`, *entonces* la tabla es
  (`Rojos` supera a `Azules` por DG pese a ir después alfabéticamente):

  | # | Equipo | PJ | PG | PE | PP | GF | GC | DG | Pts |
  |---|---|---|---|---|---|---|---|---|---|
  | 1 | Rojos | 2 | 1 | 1 | 0 | 4 | 1 | +3 | 4 |
  | 2 | Azules | 2 | 1 | 1 | 0 | 2 | 1 | +1 | 4 |
  | 3 | Verdes | 2 | 0 | 0 | 2 | 0 | 4 | -4 | 0 |

- **RQ-10.3 (goles a favor)** — *Dado* los equipos `Rojos`, `Azules`, `Verdes`
  registrados en ese orden, *cuando* se cargan F1 `Azules 1 - 0 Verdes`,
  F2 `Verdes 2 - 3 Rojos` y F3 `Rojos 0 - 0 Azules`, *entonces* la tabla es
  (igualan en Pts y DG; `Rojos` va primero por GF):

  | # | Equipo | PJ | PG | PE | PP | GF | GC | DG | Pts |
  |---|---|---|---|---|---|---|---|---|---|
  | 1 | Rojos | 2 | 1 | 1 | 0 | 3 | 2 | +1 | 4 |
  | 2 | Azules | 2 | 1 | 1 | 0 | 1 | 0 | +1 | 4 |
  | 3 | Verdes | 2 | 0 | 0 | 2 | 2 | 4 | -2 | 0 |

### RQ-11 — Desempate entre empatados y orden alfabético
**Origen:** HU-6

Se aplica a cada **grupo de empatados** (dos o más equipos con igual Pts, DG y
GF), de forma independiente para cada grupo:

1. **Resultado entre los empatados.** Se calculan los *puntos entre
   empatados* de cada equipo del grupo: 3 por victoria y 1 por empate,
   contando **solo** los partidos jugados en los que **ambos** equipos
   pertenecen al grupo. Los partidos pendientes entre ellos no cuentan. Los
   equipos del grupo se ordenan por esos puntos, de mayor a menor. Con dos
   equipos, esto equivale a: va primero el que ganó el partido entre ambos.
2. Este criterio se aplica **una sola vez** sobre el grupo completo. Los
   equipos que sigan igualados en puntos entre empatados **no** vuelven a
   evaluarse entre sí con este criterio: pasan directamente al paso 3.
3. **Orden alfabético** ascendente por nombre, según el orden alfabético del
   español: sin distinguir mayúsculas de minúsculas (`a` = `A`), la `ñ` va
   después de la `n`, y a igualdad de letras la palabra sin tilde va antes que
   la acentuada (`Atletico` antes que `Atlético`). Como no hay dos nombres con
   la misma clave de comparación, este paso siempre deja un orden total.

**Criterios de aceptación**
- **RQ-11.1 (dos empatados, decide el partido entre ellos)** — *Dado* los
  equipos `Alfa`, `Beta`, `Gama`, `Delta` y los resultados `Beta 1-0 Alfa`,
  `Alfa 2-0 Gama`, `Alfa 1-0 Delta`, `Beta 2-0 Gama`, `Delta 1-0 Beta`,
  `Gama 0-0 Delta`, *cuando* se ordena la tabla, *entonces* es (`Alfa` y `Beta`
  igualan en Pts 6, DG +2 y GF 3; `Beta` va primero porque le ganó a `Alfa`):

  | # | Equipo | PJ | PG | PE | PP | GF | GC | DG | Pts |
  |---|---|---|---|---|---|---|---|---|---|
  | 1 | Beta | 3 | 2 | 0 | 1 | 3 | 1 | +2 | 6 |
  | 2 | Alfa | 3 | 2 | 0 | 1 | 3 | 1 | +2 | 6 |
  | 3 | Delta | 3 | 1 | 1 | 1 | 1 | 1 | 0 | 4 |
  | 4 | Gama | 3 | 0 | 1 | 2 | 0 | 4 | -4 | 1 |

- **RQ-11.2 (triple empate resuelto por resultados entre ellos)** — *Dado* los
  equipos `Alfa`, `Beta`, `Gama`, `Delta` y los resultados `Gama 1-0 Beta`,
  `Beta 1-0 Alfa`, `Gama 0-0 Alfa`, `Delta 2-1 Gama`, `Beta 1-1 Delta`,
  `Alfa 2-1 Delta`, *cuando* se ordena la tabla, *entonces* `Delta` va primero
  por GF y el grupo `Gama`, `Beta`, `Alfa` (Pts 4, DG 0, GF 2) se ordena por
  puntos entre empatados: `Gama` 4 (ganó a Beta, empató con Alfa), `Beta` 3
  (ganó a Alfa), `Alfa` 1 (empató con Gama):

  | # | Equipo | PJ | PG | PE | PP | GF | GC | DG | Pts |
  |---|---|---|---|---|---|---|---|---|---|
  | 1 | Delta | 3 | 1 | 1 | 1 | 4 | 4 | 0 | 4 |
  | 2 | Gama | 3 | 1 | 1 | 1 | 2 | 2 | 0 | 4 |
  | 3 | Beta | 3 | 1 | 1 | 1 | 2 | 2 | 0 | 4 |
  | 4 | Alfa | 3 | 1 | 1 | 1 | 2 | 2 | 0 | 4 |

- **RQ-11.3 (triple empate circular → alfabético)** — *Dado* los equipos
  registrados en el orden `Gama`, `Alfa`, `Beta` y los resultados
  `Alfa 1-0 Beta`, `Beta 1-0 Gama`, `Gama 1-0 Alfa`, *cuando* se ordena la
  tabla, *entonces* los tres tienen Pts 3, DG 0, GF 1 y 3 puntos entre
  empatados, y el orden es alfabético: `Alfa`, `Beta`, `Gama`.
- **RQ-11.4 (empate entre ellos → alfabético)** — *Dado* los equipos `Zorros`,
  `Osos`, `Lobos` registrados en ese orden y solo el resultado
  `Osos 0 - 0 Lobos` (F1), *cuando* se ordena la tabla, *entonces* el orden es
  `Lobos` (1 Pt), `Osos` (1 Pt), `Zorros` (0 Pts): `Lobos` y `Osos` igualan en
  todo, empataron entre sí y se ordenan alfabéticamente.
- **RQ-11.5 (sin partidos entre ellos → alfabético)** — *Dado* los equipos
  `Zorros`, `Osos`, `Lobos` registrados en ese orden y ningún resultado,
  *cuando* se ordena la tabla, *entonces* el orden es `Lobos`, `Osos`, `Zorros`.
- **RQ-11.6 (un solo criterio entre empatados por grupo)** — *Dado* un grupo de
  empatados en el que, tras el paso 1, dos o más equipos siguen igualados en
  puntos entre empatados, *cuando* se ordena la tabla, *entonces* esos equipos
  se ordenan alfabéticamente entre sí, sin recalcular puntos solo entre ellos.
- **RQ-11.7 (orden alfabético del español)** — *Dado* equipos empatados en todos
  los criterios anteriores llamados `ñandúes`, `Nutrias`, `Atlético`, `Atletico`
  y `boca`, *cuando* se ordenan alfabéticamente, *entonces* el orden es
  `Atletico`, `Atlético`, `boca`, `Nutrias`, `ñandúes`.
- **RQ-11.8 (determinismo)** — *Dado* los mismos equipos y resultados, *cuando*
  se calcula la tabla en cualquier momento, *entonces* el orden es siempre el
  mismo y no depende del orden de registro ni del orden de carga de los
  resultados.

### RQ-12 — Bloqueo de la lista de equipos
**Origen:** HU-8

Mientras el torneo está en juego (hay al menos un resultado), no se pueden
agregar ni eliminar equipos.

**Criterios de aceptación**
- **RQ-12.1** — *Dado* un torneo con al menos un resultado, *cuando* se mira la
  sección de equipos, *entonces* el campo de nombre, el botón `[T-04]` y los
  botones `[T-05]` están deshabilitados y se muestra el mensaje `[T-15]`.
- **RQ-12.2** — *Dado* un torneo con al menos un resultado, *cuando* se intenta
  agregar o eliminar un equipo por cualquier vía, *entonces* la lista de
  equipos no cambia.
- **RQ-12.3** — *Dado* un torneo en preparación, *cuando* se mira la sección de
  equipos, *entonces* los controles están habilitados y no se muestra `[T-15]`.
- **RQ-12.4** — *Dado* un torneo en juego, *cuando* se borran todos sus
  resultados, *entonces* los controles se habilitan de nuevo y `[T-15]`
  desaparece.

### RQ-13 — Persistencia
**Origen:** HU-7

Cada cambio (agregar o eliminar un equipo, cargar, editar o borrar un
resultado) se guarda automáticamente en el navegador, sin botón de guardar.

**Criterios de aceptación**
- **RQ-13.1** — *Dado* un torneo con equipos y resultados, *cuando* se recarga la
  página, *entonces* se ven los mismos equipos en el mismo orden, el mismo
  fixture, los mismos resultados y la misma tabla.
- **RQ-13.2** — *Dado* que es la primera vez que se abre la app (no hay datos
  guardados), *cuando* carga, *entonces* se muestra un torneo vacío en
  preparación, sin mensajes de error.
- **RQ-13.3** — *Dado* que se borró un resultado o se eliminó un equipo,
  *cuando* se recarga la página, *entonces* el cambio se mantiene.
- **RQ-13.4** — *Dado* un partido en edición sin guardar, *cuando* se recarga la
  página, *entonces* se conserva el último resultado guardado (lo que estaba
  escrito y no se guardó se pierde).

### RQ-14 — Datos guardados corruptos o inválidos
**Origen:** HU-7

Si los datos guardados no se pueden leer o no describen un torneo válido, la
app no falla: empieza con un torneo vacío y avisa al organizador.

**Criterios de aceptación**
- **RQ-14.1** — *Dado* que los datos guardados no tienen un formato legible (por
  ejemplo, el texto `{esto no es válido`), *cuando* carga la app, *entonces*
  muestra un torneo vacío en preparación y el aviso `[T-27]` con el botón
  `[T-28]`.
- **RQ-14.2** — *Dado* que los datos guardados son legibles pero describen un
  torneo inválido, *cuando* carga la app, *entonces* se comporta como en
  RQ-14.1. Se considera inválido, al menos: versión de formato desconocida;
  faltan los equipos o los resultados; más de 10 equipos; un nombre vacío, de
  más de 30 caracteres o no normalizado; dos equipos con la misma clave de
  comparación; un resultado con goles fuera de 0–99 o no enteros; un resultado
  de un partido que no existe en el fixture de esos equipos; resultados
  cargados con menos de 3 equipos.
- **RQ-14.3** — *Dado* que se muestra el aviso `[T-27]`, *cuando* el organizador
  presiona `[T-28]`, *entonces* el aviso desaparece.
- **RQ-14.4** — *Dado* que se descartaron datos inválidos, *cuando* el
  organizador hace su primer cambio, *entonces* ese torneo nuevo es el que
  queda guardado, y al recargar ya no aparece el aviso.
- **RQ-14.5** — *Dado* que los datos guardados son inválidos, *cuando* carga la
  app, *entonces* no se recupera ningún dato parcial (no se mezclan equipos
  válidos con datos descartados).

---

## 5. Textos exactos de la interfaz

Los textos se copian literalmente. `{…}` indica un valor que se reemplaza.

| ID | Dónde | Texto |
|---|---|---|
| T-01 | Título de la app | `Tabla de Torneo` |
| T-02 | Título de sección | `Equipos` |
| T-03 | Etiqueta del campo de nombre | `Nombre del equipo` |
| T-04 | Botón para agregar | `Agregar equipo` |
| T-05 | Botón para eliminar un equipo (nombre accesible: `Eliminar {equipo}`) | `Eliminar` |
| T-06 | Contador de equipos | `{n} de 10 equipos` |
| T-07 | Estado vacío de equipos | `Todavía no hay equipos. Agrega entre 3 y 10 para armar el torneo.` |
| T-08 | Título de sección | `Fixture` |
| T-09 | Título de sección | `Tabla de posiciones` |
| T-10 | Error: nombre vacío | `El nombre del equipo no puede estar vacío.` |
| T-11 | Error: nombre duplicado | `Ya existe un equipo con ese nombre.` |
| T-12 | Error: nombre largo | `El nombre del equipo no puede tener más de 30 caracteres.` |
| T-13 | Error: máximo de equipos | `El torneo admite como máximo 10 equipos.` |
| T-14 | Error: goles inválidos | `Los goles deben ser números enteros entre 0 y 99.` |
| T-15 | Aviso de bloqueo de equipos | `Los equipos no se pueden modificar porque ya hay resultados cargados. Borra todos los resultados para volver a editarlos.` |
| T-16 | Estado vacío del fixture | `Agrega al menos 3 equipos para generar el fixture.` |
| T-17 | Título de cada fecha | `Fecha {n}` |
| T-18 | Partido | `{local} vs {visitante}` |
| T-19 | Equipo libre de la fecha | `Libre: {equipo}` |
| T-20 | Botón para guardar un resultado | `Guardar` |
| T-21 | Resultado de un partido jugado | `{golesLocal} - {golesVisitante}` |
| T-22 | Botón para editar un resultado | `Editar` |
| T-23 | Botón para borrar un resultado | `Borrar` |
| T-24 | Estado vacío de la tabla | `La tabla aparecerá cuando haya al menos 3 equipos.` |
| T-25 | Botón para cancelar la edición | `Cancelar` |
| T-26 | Encabezados de la tabla | `#`, `Equipo`, `PJ`, `PG`, `PE`, `PP`, `GF`, `GC`, `DG`, `Pts` |
| T-27 | Aviso de datos corruptos | `No se pudieron recuperar los datos guardados. Se empezó un torneo nuevo.` |
| T-28 | Botón para cerrar el aviso | `Entendido` |
| T-29 | Etiquetas de los campos de goles | `Goles de {local}` y `Goles de {visitante}` |
| T-30 | Descripción completa de las siglas de la tabla (texto alternativo de cada encabezado) | `Posición`, `Equipo`, `Partidos jugados`, `Partidos ganados`, `Partidos empatados`, `Partidos perdidos`, `Goles a favor`, `Goles en contra`, `Diferencia de gol`, `Puntos` |

---

## 6. Requisitos no funcionales

### RNF-01 — Determinismo
El resultado de la app depende solo de los datos ingresados: no usa azar ni
la fecha u hora actual.

- **RNF-01.1** — *Dado* los mismos equipos en el mismo orden, *cuando* se genera
  el fixture en distintas sesiones, *entonces* es idéntico (RQ-04.4).
- **RNF-01.2** — *Dado* los mismos equipos y resultados, *cuando* se calcula la
  tabla, *entonces* es idéntica, sin importar el orden en que se cargaron los
  resultados (RQ-11.8).

### RNF-02 — Accesibilidad básica
- **RNF-02.1** — *Dado* cualquier campo de entrada (nombre del equipo, goles),
  *cuando* se inspecciona, *entonces* tiene una etiqueta asociada con el texto
  de `[T-03]` o `[T-29]`.
- **RNF-02.2** — *Dado* que un usuario solo usa teclado, *cuando* recorre la app
  con Tab y Shift+Tab, *entonces* puede llegar a todos los campos y botones
  habilitados, en el orden visual, y activarlos con Enter o Espacio. En el
  formulario de equipos y en el de goles, Enter en un campo equivale a
  presionar `[T-04]` o `[T-20]`.
- **RNF-02.3** — *Dado* que el foco está en un control, *cuando* se mira la
  pantalla, *entonces* el foco es visible.
- **RNF-02.4** — *Dado* que aparece un mensaje de error o aviso (`[T-10]` a
  `[T-15]`, `[T-27]`), *cuando* un lector de pantalla está activo, *entonces*
  el mensaje se anuncia, y los errores de un campo quedan asociados a ese
  campo.
- **RNF-02.5** — *Dado* la tabla de posiciones, *cuando* se inspecciona,
  *entonces* es una tabla con encabezados de columna y cada sigla tiene su
  descripción completa `[T-30]`.
- **RNF-02.6** — *Dado* los botones `[T-05]`, `[T-20]`, `[T-22]`, `[T-23]`,
  *cuando* un lector de pantalla los anuncia, *entonces* su nombre accesible
  identifica el equipo o partido (ej.: `Eliminar Leones`,
  `Editar Leones vs Tigres`).

### RNF-03 — Funcionamiento local
- **RNF-03.1** — *Dado* que la app está abierta, *cuando* se usa cualquier
  función, *entonces* no se hace ninguna comunicación por red; todo funciona
  sin conexión una vez cargada.

---

## 7. Fuera de alcance

Queda explícitamente fuera de esta versión:
- Torneos de **ida y vuelta** (cada par se enfrenta una sola vez).
- **Playoffs**, finales, eliminación directa o fases de grupos.
- **Estadísticas de jugadores** (goleadores, tarjetas, planteles, etc.).
- **Varios torneos a la vez** o historial de torneos anteriores.
- **Usuarios o cuentas**, inicio de sesión, permisos o compartir en línea.
- **Backend**, sincronización entre dispositivos o almacenamiento en la nube.
- Renombrar equipos o cambiar su orden después de agregarlos (para cambiar un
  nombre se elimina y se vuelve a agregar mientras el torneo está en
  preparación).
- Fechas y horarios reales de los partidos, sedes, árbitros.
- Sanciones, quita de puntos o partidos ganados por *walkover*.
- Exportar o imprimir el fixture o la tabla.
- Un botón para reiniciar el torneo completo.

---

## 8. Preguntas abiertas

Decisiones tomadas para que la spec no tuviera huecos. Todas fueron
**confirmadas** por el organizador del proyecto el 2026-10-25.

| ID | Pregunta | Decisión (confirmada) |
|---|---|---|
| P-1 | ¿El fixture se genera con un botón "Generar fixture" o automáticamente? | **Automático** (RQ-04): siempre se deriva de la lista de equipos, así nunca queda un fixture desactualizado. Como la lista se bloquea con el primer resultado, el fixture tampoco cambia después. |
| P-2 | Con más de dos empatados, si tras los puntos entre empatados un subgrupo sigue igualado, ¿se vuelve a aplicar el criterio solo dentro del subgrupo? | **No** (RQ-11 paso 2, RQ-11.6): se aplica una sola vez y luego alfabético. Con grupos de 3 el resultado es el mismo en ambos casos; solo cambia en grupos de 4 o más. |
| P-3 | ¿El criterio "resultado entre los empatados" usa solo puntos, o también diferencia de gol y goles entre ellos? | **Solo puntos** entre empatados, para respetar la lista de criterios pedida. |
| P-4 | ¿`"Atlético"` y `"Atletico"` deben considerarse el mismo nombre? | **No**: solo se ignoran mayúsculas y espacios extra, como se pidió (RQ-01.4). |
| P-5 | ¿Hace falta un botón para reiniciar el torneo completo? | **No** (fuera de alcance): para cambiar equipos se borran los resultados. |
| P-6 | Límite de largo del nombre del equipo. | **30 caracteres** tras normalizar (RQ-01.6). |
