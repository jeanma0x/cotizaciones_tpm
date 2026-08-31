// Prefijo compartido entre servidor y cliente para el patrón de doble
// confirmación de duplicados (Cliente/Servicio/Proyecto, Tanda 2 del audit
// crítico) — el server action lanza un Error con este prefijo en vez de
// bloquear la creación; el formulario lo detecta en el catch y muestra
// ConfirmarDuplicadoDialog en vez de un toast de error. Compartir la
// constante evita que un typo en un lado deje de "engancharse" con el otro.
export const PREFIJO_ERROR_DUPLICADO = "DUPLICADO::";

export function esErrorDuplicado(mensaje: string) {
  return mensaje.startsWith(PREFIJO_ERROR_DUPLICADO);
}

export function mensajeDuplicado(mensaje: string) {
  return mensaje.slice(PREFIJO_ERROR_DUPLICADO.length);
}
