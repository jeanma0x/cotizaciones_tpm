# Seguridad

La prioridad de seguridad #1 de este proyecto, por encima de cualquier otra, es que
**un usuario nunca pueda ver ni modificar datos de una empresa a la que no tiene
acceso asignado.** El cliente tiene un socio con acceso limitado a una sola de sus 4
empresas — un fallo aquí no es un bug cosmético, es una filtración de información
comercial entre socios y rompe la confianza del cliente de inmediato.

## Regla central: autorización en el servidor, siempre

**Nunca confiar en el `empresaId` que venga del cliente** (query param, campo oculto de
formulario, body de una request) para decidir qué datos devolver o modificar. El
`empresaId` que importa es el que se deriva de la sesión del usuario en el servidor.

Patrón obligatorio para toda Server Action o Route Handler que toque datos de una
empresa:

```typescript
// lib/auth.ts
export async function getEmpresasPermitidas(): Promise<string[]> {
  const { userId } = auth(); // Clerk
  if (!userId) throw new Error("No autenticado");

  const usuario = await db.usuario.findUnique({
    where: { clerkId: userId },
    include: { empresas: true },
  });
  if (!usuario) throw new Error("Usuario no encontrado");

  return usuario.empresas.map((ue) => ue.empresaId);
}

export async function assertAccesoEmpresa(empresaId: string) {
  const permitidas = await getEmpresasPermitidas();
  if (!permitidas.includes(empresaId)) {
    throw new Error("No autorizado para esta empresa");
  }
}
```

Y en cada Server Action:

```typescript
export async function crearCliente(empresaId: string, datos: ClienteInput) {
  await assertAccesoEmpresa(empresaId); // ← nunca omitir esta línea
  return db.cliente.create({ data: { empresaId, ...datos } });
}

export async function listarDocumentos() {
  const empresasPermitidas = await getEmpresasPermitidas();
  return db.documento.findMany({
    where: { empresaId: { in: empresasPermitidas } }, // nunca "where: {}" sin filtrar
  });
}
```

**Checklist antes de dar por terminada cualquier Server Action nueva:**
- [ ] ¿Llama a `assertAccesoEmpresa` o filtra por `getEmpresasPermitidas()`?
- [ ] ¿El filtro está en la query a la base de datos, no solo en lo que se muestra en
      la interfaz? (Ocultar en la UI no es seguridad — hay que evitar que el dato salga
      del servidor.)
- [ ] Si la acción recibe un `documentoId`, `clienteId`, etc., ¿se valida que ese
      registro pertenezca a una empresa permitida antes de operar sobre él? (Un ID
      válido de otra empresa no debe ser aceptado solo porque el formato es correcto —
      esto es una vulnerabilidad de tipo IDOR / referencia insegura a objetos.)

## Autenticación

- Delegar por completo en **Clerk** — no construir login, hash de contraseñas, ni
  manejo de sesiones a mano. Clerk ya resuelve recuperación de contraseña, expiración
  de sesión y protección contra fuerza bruta.
- El rol (`SUPERUSUARIO` / `MIEMBRO`) y la relación con empresas viven en la base de
  datos propia (tabla `Usuario` + `UsuarioEmpresa`), no en los metadatos de Clerk — así
  el modelo de permisos es explícito, auditable y consultable con SQL normal.
- Sincronizar la creación de usuario en Clerk con la creación en la base de datos
  mediante un webhook de Clerk (`user.created`), no confiando en que el frontend haga
  esa llamada.

## Validación de datos

- Todo input de formulario pasa por un **schema de Zod** compartido entre cliente y
  servidor. La validación en el cliente es para UX (feedback inmediato); la validación
  en el servidor es la que realmente protege — nunca omitirla asumiendo que "ya se
  validó en el formulario".
- Casos concretos a validar explícitamente: `cantidad` y `precioUnitario` deben ser
  números positivos; `correlativo` nunca se acepta como input del usuario (siempre lo
  asigna el servidor); `empresaId` en cualquier payload se ignora si no coincide con una
  empresa autorizada para el usuario (revalidar server-side, no solo confiar en que el
  formulario no lo dejó cambiar).

## Base de datos

- Prisma parametriza las queries automáticamente — **no usar `$queryRawUnsafe` ni
  concatenar strings en SQL** bajo ninguna circunstancia.
- Activar backups / point-in-time recovery en Neon (disponible en el plan gratuito con
  ventana limitada; confirmar la ventana y ampliarla si el proyecto crece).

## Manejo de texto libre (XSS)

- Nombres de clientes, descripciones de ítems, notas y anexos son texto libre escrito
  por el cliente — al usarse en componentes React normales, el escape es automático.
  **Si en algún punto se genera HTML a partir de strings manualmente** (por ejemplo,
  para la vista imprimible o un futuro export por servidor), escapar explícitamente
  cualquier valor interpolado antes de insertarlo en el HTML.

## Secretos y variables de entorno

- `DATABASE_URL`, las claves de Clerk, y cualquier otro secreto viven únicamente en
  variables de entorno (Vercel en producción, `.env.local` en desarrollo — este último
  en `.gitignore`, nunca commiteado).
- No exponer ninguna clave secreta en código que corra en el cliente (todo lo que use
  `NEXT_PUBLIC_` es público por diseño — revisar dos veces antes de prefijar algo así).

## Pruebas mínimas antes de la entrega

Escribir al menos estas pruebas (Vitest) antes de dar por cerrado el desarrollo — son
baratas de escribir y cubren exactamente el riesgo más caro de este proyecto:

1. Un usuario con rol `MIEMBRO` asignado solo a la Empresa A **no puede leer**
   documentos, clientes ni servicios de la Empresa B, aunque conozca o adivine sus IDs.
2. Un usuario con rol `MIEMBRO` **no puede crear ni editar** un documento pasando el
   `empresaId` de una empresa a la que no tiene acceso.
3. El superusuario **sí puede** leer y escribir en las 4 empresas.
4. Asignar un correlativo dos veces "al mismo tiempo" (dos llamadas concurrentes a la
   función de asignación) nunca produce el mismo número dos veces — probar que la
   transacción de incremento realmente previene la condición de carrera.

## HTTPS y despliegue

Vercel provee HTTPS automático — no hay configuración manual pendiente aquí, solo
verificar que el dominio final (cuando se defina) quede correctamente apuntado.
