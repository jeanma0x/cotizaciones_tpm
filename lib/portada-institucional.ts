// Contenido real de la portada institucional de "Propuesta de servicios",
// provisto por el cliente el 12 de agosto de 2026 (ver docs/business-context.md).
// No es texto de ejemplo — no modificar sin confirmar con el cliente.

export type SeccionPortada = {
  titulo: string;
  texto?: string;
  lista?: string[];
};

export const PORTADA_INSTITUCIONAL: SeccionPortada[] = [
  {
    titulo: "Definición empresarial",
    texto:
      "Somos líderes en brindar servicios profesionales a todo tipo de industria, ya que además de satisfacer a cabalidad los requerimientos de nuestros clientes, garantizamos el cumplimiento de las exigencias que se requieren.",
  },
  {
    titulo: "Misión",
    texto:
      "Estamos comprometidos en brindar eficacia y eficiencia en todos nuestros servicios, con enfoque de mejora continua para alcanzar la preferencia y satisfacción de nuestros clientes.",
  },
  {
    titulo: "Visión",
    texto:
      "Mantener el liderazgo, por medio de una estrecha relación comercial en la que nuestros clientes se sientan respaldados por el servicio de calidad que prestamos.",
  },
  {
    titulo: "Política de calidad",
    texto:
      "Comprometidos con brindar un servicio con excelencia, servimos de forma eficiente con personal especializado para lograr los objetivos de nuestros clientes.",
  },
  {
    titulo: "Lema",
    texto: '"Existimos para Servir y Servirle bien"',
  },
  {
    titulo: "Valores",
    texto: "Integridad, Responsabilidad, Transparencia, Lealtad",
  },
  {
    titulo: "Recurso humano",
    texto:
      "Con el propósito de atender de forma eficiente todos los servicios requeridos por nuestros clientes, contamos con equipo de trabajo especializado, capacitado y comprometido con el fin común de brindar un servicio de calidad.",
  },
  {
    titulo: "Nuestros servicios",
    lista: [
      "Servicios de transporte terrestre (Liviano y Pesado).",
      "Servicios modalidad Outsourcing (maquinaria y equipo).",
      "Servicios modalidad Outsourcing (Personal operativo).",
    ],
  },
];
