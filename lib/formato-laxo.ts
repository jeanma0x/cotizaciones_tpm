// Tanda 3 del audit crítico, punto 5: advertencias visuales (no bloqueantes)
// para NIT/teléfono/placa — el cliente maneja empresas en Guatemala, Panamá
// y EE.UU. con formatos distintos entre sí, así que un patrón "correcto"
// único no existe. Esto solo avisa si algo se ve raro; nunca impide guardar
// (por eso vive en los componentes de formulario, no en los esquemas Zod —
// un .refine() ahí sí bloquearía el submit).
const PATRON_NIT = /^\d[\d-]{4,}$/;
const PATRON_TELEFONO = /^\d{7,8}$/;
const PATRON_PLACA = /^[A-Za-z0-9-]{5,10}$/;

export function pareceNitValido(valor: string): boolean {
  if (!valor.trim()) return true;
  return PATRON_NIT.test(valor.trim());
}

export function pareceTelefonoValido(valor: string): boolean {
  if (!valor.trim()) return true;
  return PATRON_TELEFONO.test(valor.trim());
}

export function parecePlacaValida(valor: string): boolean {
  if (!valor.trim()) return true;
  return PATRON_PLACA.test(valor.trim());
}
