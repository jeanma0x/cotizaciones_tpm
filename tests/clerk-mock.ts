// Mock mínimo de @clerk/nextjs/server para las pruebas de aislamiento —
// lib/auth.ts solo usa `auth()` para obtener el userId (clerkId) actual.
// Los tests controlan qué "usuario" está autenticado llamando setMockUserId().
let mockUserId: string | null = null;

export function setMockUserId(id: string | null) {
  mockUserId = id;
}

export async function auth() {
  return { userId: mockUserId };
}
