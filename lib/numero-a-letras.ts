const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const DIECES = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const DECENAS = ['veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function palabraDecena(n: number): string {
  if (n < 10) return UNIDADES[n];
  if (n < 20) return DIECES[n - 10];
  const d = Math.floor(n / 10), u = n % 10;
  if (n < 30) return u === 0 ? 'veinte' : 'veinti' + UNIDADES[u];
  return u === 0 ? DECENAS[d - 2] : `${DECENAS[d - 2]} y ${UNIDADES[u]}`;
}

function palabraCentena(n: number): string {
  if (n < 100) return palabraDecena(n);
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100), r = n % 100;
  const cWord = c === 1 ? 'ciento' : CENTENAS[c - 1];
  return r === 0 ? cWord : `${cWord} ${palabraDecena(r)}`;
}

// "uno" se apocopa a "un" (y "veintiuno" a "veintiún") justo antes de un
// sustantivo — "mil", "millones", o la moneda. Sin esto, montos como 71,830
// salían como "setenta y uno mil ochocientos treinta" en vez de "...un mil...".
function apocopeUno(palabra: string): string {
  if (palabra === 'uno') return 'un';
  if (palabra === 'veintiuno') return 'veintiún';
  if (palabra.endsWith(' uno')) return `${palabra.slice(0, -4)} un`;
  return palabra;
}

function palabraMiles(n: number): string {
  if (n < 1000) return palabraCentena(n);
  const m = Math.floor(n / 1000), r = n % 1000;
  const mWord = m === 1 ? 'mil' : `${apocopeUno(palabraCentena(m))} mil`;
  return r === 0 ? mWord : `${mWord} ${palabraCentena(r)}`;
}

export function numeroALetras(n: number): string {
  n = Math.floor(n);
  if (n === 0) return 'cero';
  if (n < 1_000_000) return palabraMiles(n);
  const mm = Math.floor(n / 1_000_000), r = n % 1_000_000;
  const mmWord = mm === 1 ? 'un millón' : `${apocopeUno(palabraMiles(mm))} millones`;
  return r === 0 ? mmWord : `${mmWord} ${palabraMiles(r)}`;
}

export function totalEnLetras(monto: number, moneda: 'GTQ' | 'USD' = 'GTQ'): string {
  const entero = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);
  const letras = apocopeUno(numeroALetras(entero));
  const cap = letras.charAt(0).toUpperCase() + letras.slice(1);
  const nombreMoneda = moneda === 'USD' ? 'dólares' : 'quetzales';
  return `${cap} ${nombreMoneda} con ${String(centavos).padStart(2, '0')}/100`;
}
