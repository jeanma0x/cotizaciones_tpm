// Mock mínimo de next/headers `cookies()` para probar lib/empresa-activa.ts y
// la server action que la establece, sin necesitar un request real de
// Next.js. Los tests controlan el valor guardado llamando setMockCookie() /
// clearMockCookies() directamente, simulando una cookie manipulada a mano
// (sin pasar por establecerEmpresaActiva) cuando hace falta probar que la
// lectura revalida igual.
const store = new Map<string, string>();

export function setMockCookie(name: string, value: string) {
  store.set(name, value);
}

export function clearMockCookies() {
  store.clear();
}

export async function cookies() {
  return {
    get(name: string) {
      const value = store.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set(name: string, value: string) {
      store.set(name, value);
    },
    delete(name: string) {
      store.delete(name);
    },
  };
}
