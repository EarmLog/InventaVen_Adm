import { KeyRound, ShieldCheck, Users } from "lucide-react";

const puntos = [
  {
    Icono: Users,
    titulo: "Usuarios centralizados",
    texto: "Consulta todos los negocios registrados en InventaVen.",
  },
  {
    Icono: KeyRound,
    titulo: "Licencias bajo control",
    texto: "Extiende, fija o revoca el vencimiento de cada cuenta.",
  },
  {
    Icono: ShieldCheck,
    titulo: "Acceso restringido",
    texto: "Solo cuentas con rol de administrador pueden entrar.",
  },
];

export default function LayoutAutenticacion({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_0.95fr]">
      <aside className="relative hidden overflow-hidden bg-[#0b1220] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 text-emerald-950 shadow-lg">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">InventaVen</p>
              <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-200/70">
                Consola de administración
              </p>
            </div>
          </div>

          <div className="mt-16 max-w-md">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Acceso exclusivo del administrador
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight">
              Gestiona los negocios
              <br />
              <span className="text-emerald-300">que usan InventaVen.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-300/70">
              Revisa el estado de cada licencia, extiende vencimientos y mantén el
              control de las cuentas desde un solo lugar.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {puntos.map(({ Icono, titulo, texto }) => (
              <div
                key={titulo}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <Icono className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <div>
                  <p className="text-sm font-semibold">{titulo}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300/60">
                    {texto}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-slate-400">
          Datos de licencias alojados de forma segura en Supabase.
        </p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold tracking-tight">InventaVen Admin</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--texto-suave)]">
                Licencias y usuarios
              </p>
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
