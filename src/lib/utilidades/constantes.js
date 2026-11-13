export const TIPOS_CUENTA = [
  {
    valor: "personal",
    etiqueta: "Personal",
    descripcion: "Uso personal, sin datos fiscales.",
  },
  {
    valor: "micronegocio",
    etiqueta: "Micro negocio",
    descripcion: "Emprendimiento, venta informal o desde casa.",
  },
  {
    valor: "negocio",
    etiqueta: "Negocio / Mercado",
    descripcion: "Local, mercado, abasto o negocio establecido.",
  },
  {
    valor: "empresa",
    etiqueta: "Empresa",
    descripcion: "Empresa constituida legalmente en Venezuela.",
  },
];

export const SUFIJOS_LEGALES_VE = [
  { valor: "C.A.", etiqueta: "C.A. — Compañía Anónima" },
  { valor: "S.A.", etiqueta: "S.A. — Sociedad Anónima" },
  {
    valor: "S.R.L.",
    etiqueta: "S.R.L. — Sociedad de Responsabilidad Limitada",
  },
  { valor: "C.A.S.A.", etiqueta: "C.A.S.A. — Compañía Anónima S.A." },
  { valor: "S.C.", etiqueta: "S.C. — Sociedad Civil" },
  { valor: "Cooperativa", etiqueta: "Cooperativa" },
];

export function etiquetaTipoCuenta(valor) {
  return TIPOS_CUENTA.find((tipo) => tipo.valor === valor)?.etiqueta || "Personal";
}
