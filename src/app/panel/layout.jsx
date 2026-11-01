"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Menu, Moon, ShieldCheck, Sun } from "lucide-react";
import { useSesion } from "@/context/SesionContext";
import { useTema } from "@/context/TemaContext";
import BarraLateralAdmin from "@/components/layout/BarraLateralAdmin";

function PantallaCargando({ texto = "Verificando acceso..." }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
        <ShieldCheck className="h-7 w-7" />
      </div>
      <div className="flex items-center gap-2 text-sm text-[var(--texto-suave)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        {texto}
      </div>
    </div>
  );
}

export default function LayoutPanelAdmin({ children }) {
  const router = useRouter();
  const { sesion, perfil, cargandoPerfil, errorAcceso, cerrarSesion } = useSesion();
  const { tema, alternarTema } = useTema();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    if (sesion === null) router.replace("/login");
  }, [sesion, router]);

  async function salir() {
    await cerrarSesion();
    router.replace("/login");
  }

  if (sesion === undefined) return <PantallaCargando />;
  if (sesion === null) return <PantallaCargando texto="Redirigiendo al inicio de sesión..." />;
  if (!perfil && cargandoPerfil) return <PantallaCargando />;

  if (!perfil) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--peligro-suave)] text-[var(--peligro)]">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <div>
          <p className="text-sm font-semibold">No se pudo verificar tu acceso</p>
          <p className="mt-1 max-w-sm text-xs text-[var(--texto-suave)]">
            {errorAcceso || "Inicia sesión nuevamente con la cuenta administradora."}
          </p>
        </div>
        <button
          type="button"
          onClick={salir}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white"
        >
          Volver al inicio de sesión
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:pl-64">
      <BarraLateralAdmin
        abierto={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
        perfil={perfil}
      />
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[var(--borde)] bg-[var(--superficie)]/90 px-3 backdrop-blur-md sm:px-5 lg:px-7">
          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            className="rounded-lg p-2 text-[var(--texto-suave)] hover:bg-[var(--superficie-3)] lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold tracking-tight">Consola de administración</p>
            <p className="truncate text-[10px] text-[var(--texto-suave)]">
              Usuarios, licencias y vencimientos de InventaVen
            </p>
          </div>
          <button
            type="button"
            onClick={alternarTema}
            className="rounded-lg p-2 text-[var(--texto-suave)] hover:bg-[var(--superficie-3)]"
            aria-label="Cambiar tema"
          >
            {tema === "oscuro" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <div className="hidden items-center gap-2 border-l border-[var(--borde)] pl-3 sm:flex">
            <div className="text-right">
              <p className="text-[11px] font-semibold">{perfil.nombreNegocio}</p>
              <p className="text-[10px] text-[var(--texto-suave)]">{perfil.correo}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              {(perfil.nombreNegocio || "A").slice(0, 2).toUpperCase()}
            </div>
          </div>
          <button
            type="button"
            onClick={salir}
            className="rounded-lg p-2 text-[var(--texto-suave)] hover:bg-[var(--peligro-suave)] hover:text-[var(--peligro)]"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 px-3 py-4 sm:px-5 lg:px-7 lg:py-6">
          <div className="mx-auto w-full max-w-[1500px]">{children}</div>
        </main>

        <footer className="px-4 pb-5 pt-2 text-center text-[10px] text-[var(--texto-tenue)]">
          InventaVen Admin · Licencias gestionadas con Supabase
        </footer>
      </div>
    </div>
  );
}
