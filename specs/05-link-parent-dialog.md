# SPEC 05 — Vincular padre dialog

> **Status:** Implemented
> **Depends on:** SPEC 02, SPEC 04
> **Date:** 2026-08-22
> **Objective:** Implementar el diálogo "Vincular padre" en la página de perfil del niño (`/kids/[id]`) que coincida con `references/pantallas/vincular-padre.dc.html`, con persistencia en datos mock, validación de campos y generación de código de invitación aleatorio.

## Scope

**In:**

- Implementar diálogo triggered por el link "Vincular otro padre" en `/kids/[id]`
- Coincidir exactamente con el diseño visual de `references/pantallas/vincular-padre.dc.html` (colores, espaciado, tipografía, border-radius)
- Estructura del diálogo: header con título "Vincular padre" (izquierda, Fredoka 600 18px) + subtítulo "a [nombre del niño]" (más pequeño), botón cerrar (derecha, icono X)
- Banner informativo: fondo azul (#E3ECFB), icono info, texto "Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de [nombre del niño]."
- Campos del formulario:
  - NOMBRE DEL PADRE/MADRE (input text, requerido, placeholder "Ej. Diego Fernández")
  - EMAIL (input type="email", requerido, placeholder "correo@ejemplo.com")
  - PARENTESCO (pill buttons: Mamá, Papá, Tutor/a — usuario debe seleccionar uno, sin valor por defecto)
- Caja de código de invitación: borde punteado amarillo (#FBF1D6 bg, #E6D08A border), genera código alfanumérico aleatorio de 5 caracteres al abrir el diálogo, muestra "Vence en 7 días"
- Botón "Enviar invitación": fondo gradiente (#F4977E → #EE8164), texto blanco, icono paper-plane
- Validación: campos requeridos (nombre, email, parentesco) muestran borde rojo (#D9583C) al hacer click en "Enviar invitación" si están vacíos/sin seleccionar
- "Enviar invitación" agrega el padre al array mock `parents` con status `"pending"` y cierra el diálogo
- Datos del padre agregados al mock: `id` (nombre slugificado), `name`, `initial` (primera letra), `role` (parentesco seleccionado), `avatarBgColor` (aleatorio de paleta), `status: "pending"`
- Botón cerrar (X) y click en backdrop cierran el diálogo y resetean el estado del formulario
- Reutilizar componente `Dialog` de SPEC 04
- Responsive: full-screen sheet en mobile (< md), card centrada en desktop (md+)
- Todo el texto visible en español para coincidir con la referencia
- Todo el código (variables, funciones, tipos, interfaces) en inglés

**Out of scope (para futuros specs):**

- Envío real de emails o llamadas a API
- Lógica de expiración del código de invitación
- Flujo de activación de cuenta del padre
- Funcionalidad de editar/eliminar padre
- Toast/notificación después de "Enviar invitación"
- Cambios a otras páginas (listado de niños, feed)
- Filtrado de vista/feed del padre

## Data model

Este spec no introduce nuevas estructuras de datos persistentes. Extiende el uso del tipo `Parent` existente:

```ts
// data/kids.ts — tipo existente reutilizado
type Parent = {
  id: string;
  name: string;
  initial: string;
  role: string;
  avatarBgColor: string;
  status: "active" | "pending";
};
```

Colores de fondo del avatar del padre (selección aleatoria al agregar):

```ts
const PARENT_AVATAR_COLORS = [
  "#C9B6E8", // purple
  "#A9C7E8", // blue
  "#F4B8CC", // pink
  "#B9DEC4", // green
  "#F4DC8E", // yellow
  "#A9D9E8", // cyan
];
```

Generación de código de invitación:

```ts
function generateInvitationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin I,O,0,1 para evitar confusión
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
```

Convenciones:

- Colores del diálogo: container bg `#FBF4EC`, border `#ECE0D0`, card shadow `0 20px 50px -24px rgba(63,54,46,.35)`
- Borde de error: `#D9583C`
- Estilo de labels: 12px, font-weight 800, letter-spacing 0.7px, color `#94887B`
- Estilo de inputs: padding 13px 16px, border-radius 14px, border 1.5px solid `#EADFD0`, bg white, font-size 15px
- Banner informativo: bg `#E3ECFB`, text color `#3F5694`, icon color `#4E72C8`
- Caja de código de invitación: bg `#FBF1D6`, border 1.5px dashed `#E6D08A`, código text Fredoka 600 34px color `#8A7234`
- Pills de parentesco: seleccionado = bg `#CCD8F4` border `#9FB8EC` text `#4E72C8`; no seleccionado = bg `#FFFDF9` border `#ECE0D0` text `#6E6359`
- Botón submit: gradiente `linear-gradient(180deg, #F4977E, #EE8164)`, texto blanco, font-weight 800, shadow `0 10px 22px -8px rgba(238,129,100,.7)`

## Implementation plan

1. Crear `components/LinkParentDialog.tsx`:
   - Usa `Dialog` como wrapper
   - Props: `open: boolean`, `onClose: () => void`, `kidName: string`, `kidId: string`, `onParentAdded: (parent: Parent) => void`
   - Header: título "Vincular padre" (Fredoka 600 18px) + subtítulo "a [kidName]" (13px, color `#A89A8B`), botón cerrar (icono X, 34px cuadrado, bg `#F0E6D8`, rounded 10px)
   - Banner informativo con nombre del niño dinámico
   - Campos del formulario: nombre (input), email (input type="email"), parentesco (3 pill buttons)
   - Código de invitación: generado vía `generateInvitationCode()` al abrir el diálogo (useEffect cuando `open` cambia), mostrado en caja amarilla
   - Estado: campos del formulario controlados vía `useState`, `hasError` por campo
   - Click en "Enviar invitación": valida campos requeridos, si es válido crea objeto `Parent`, llama `onParentAdded`, resetea formulario, llama `onClose`
   - Botón cerrar y click en backdrop: resetea formulario, llama `onClose`

2. Crear `components/ParentsSection.tsx` — wrapper client component para la sección de padres:
   - Directiva `"use client"`
   - Props: `kidId: string`, `initialParents: Parent[]`
   - Estado: `parents: Parent[]` inicializado con `initialParents`, `dialogOpen: boolean`
   - Renderiza la card "PADRES VINCULADOS" con lista de padres (mismo visual que página actual)
   - Link "Vincular otro padre" se convierte en `<button>` que setea `dialogOpen` a `true`
   - Renderiza `<LinkParentDialog>` condicionalmente
   - `handleParentAdded`: agrega nuevo padre al estado `parents` Y muta el array `kids` en `data/kids.ts` (para persistencia mock a través de navegaciones de página)

3. Actualizar `app/kids/[id]/page.tsx`:
   - Importar componente `ParentsSection`
   - Reemplazar la sección inline de padres (líneas 144-201) con `<ParentsSection kidId={kid.id} initialParents={kid.parents} />`
   - Mantener el resto de la página como server component (no es necesario convertir toda la página a client)

4. Ejecutar `pnpm run lint` y `npx tsc --noEmit`. Verificación visual en múltiples breakpoints contra la referencia.

## Acceptance criteria

- [ ] `/kids/[id]` carga sin errores
- [ ] Click en "Vincular otro padre" abre el diálogo
- [ ] El diálogo coincide visualmente con la referencia: layout del header (título + subtítulo + botón cerrar), banner informativo, labels de campos, estilo de inputs, pills de parentesco, caja de código de invitación, botón submit
- [ ] El texto del banner informativo incluye el nombre del niño dinámicamente
- [ ] El código de invitación es un código alfanumérico de 5 caracteres generado aleatoriamente al abrir el diálogo
- [ ] El código de invitación muestra "Vence en 7 días"
- [ ] Los campos nombre y email son obligatorios
- [ ] El parentesco debe ser seleccionado (sin valor por defecto)
- [ ] Campos requeridos vacíos muestran borde rojo (`#D9583C`) cuando se hace click en "Enviar invitación"
- [ ] "Enviar invitación" agrega el padre al array mock `parents` con status `"pending"`
- [ ] El padre agregado tiene: `id` (nombre slugificado), `name`, `initial` (primera letra), `role` (parentesco seleccionado), `avatarBgColor` (aleatorio de paleta)
- [ ] "Enviar invitación" cierra el diálogo después de agregar el padre
- [ ] La lista de padres en la página se actualiza para mostrar el nuevo padre agregado
- [ ] Botón cerrar (X) cierra el diálogo y resetea todos los valores de los campos
- [ ] Click en backdrop cierra el diálogo
- [ ] Desktop (md+): el diálogo es una card centrada (max-width 520px) con backdrop (negro 40% opacidad + blur)
- [ ] Mobile (< md): el diálogo es full-screen sheet
- [ ] El uso existente de `Dialog` no cambia (backward compatible)
- [ ] Sin errores de TypeScript (`npx tsc --noEmit` pasa)
- [ ] Sin errores de lint en el código de la aplicación
- [ ] Fredoka para el título del diálogo, Nunito para el texto del body
- [ ] Sin scroll horizontal en ningún viewport

## Decisions

- **Sí:** Persistir datos mockeando la adición del padre al array `parents`. El usuario explícitamente pidió este comportamiento.
- **No:** Solo validar sin persistir. Contradice el requerimiento del usuario.
- **Sí:** Generar código de invitación aleatorio al abrir el diálogo. Hace el código más realista.
- **No:** Código fijo "7K4P9" como en la referencia. Sería menos realista.
- **Sí:** Cerrar el diálogo después de "Enviar invitación". El usuario confirmó este comportamiento.
- **No:** Mantener el diálogo abierto después de enviar. Contradice el requerimiento del usuario.
- **Sí:** Crear `ParentsSection` como client component separado. Permite que el resto de la página permanezca como server component.
- **No:** Convertir toda la página `/kids/[id]` a client component. Agrega complejidad innecesaria.
- **Sí:** Reutilizar componente `Dialog` de SPEC 04. Evita duplicación de código.
- **No:** Crear un nuevo componente de diálogo desde cero. Duplicaría lógica existente.
- **Sí:** Validación muestra borde rojo solamente, sin mensaje de error de texto. Coincide con el estilo visual mínimo de la referencia.
- **No:** Mensajes de error inline debajo de los campos. Cambiaría el layout y se desviaría de la referencia.
- **Sí:** Parentesco sin valor por defecto. El usuario debe seleccionar explícitamente.
- **No:** "Mamá" seleccionado por defecto. El usuario debe elegir activamente.
- **Sí:** Mutar el array `kids` en `data/kids.ts` para persistencia mock. Permite que los datos persistan a través de navegaciones de página en la sesión.
- **No:** Solo mantener estado en el componente. Los datos se perderían al navegar.

## What is **not** in this spec

- Envío real de emails o integración con API
- Lógica de expiración del código de invitación
- Flujo de activación de cuenta del padre
- Funcionalidad de editar/eliminar padre
- Notificaciones toast
- Cambios a otras páginas (listado de niños, feed)
- Vista/feed filtrado del padre

Cada uno de esos, si es necesario, va en su propio spec.
