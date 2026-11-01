"use client";

import {
  ExternalLink,
  KeyRound,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

function Contenido({ perfil, alNavegar }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-950/30">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-bold tracking-tight">InventaVen</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--texto-tenue)]">
            Administración
          </p>
        </div>
      </div>

      <div className="mx-4 mb-4 rounded-xl border border-[var(--borde)] bg-[var(--superficie-2)] px-3 py-2.5">
        <p className="flex items-center gap-1.5 truncate text-xs font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          {perfil?.nombreNegocio || "Administrador"}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-[var(--texto-suave)]">
          {perfil?.correo || "Cuenta administrativa"}
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        <button
          type="button"
          onClick={alNavegar}
          className="flex w-full items-center gap-3 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-medium text-white shadow-sm"
        >
          <Users className="h-[18px] w-[18px]" />
          <span className="flex-1 text-left">Usuarios y licencias</span>
        </button>
        <a
          href={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--texto-suave)] transition hover:bg-[var(--superficie-2)] hover:text-[var(--texto)]"
        >
          <ExternalLink className="h-[18px] w-[18px]" />
          <span className="flex-1">App de usuario</span>
        </a>
      </nav>

      <div className="m-3 rounded-2xl border border-[var(--borde)] bg-[var(--superficie-2)] p-3.5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-emerald-500" />
          <p className="text-xs font-semibold">Control de licencias</p>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--texto-suave)]">
          Los cambios se aplican de inmediato en la cuenta del negocio.
        </p>
      </div>
    </div>
  );
}

export default function BarraLateralAdmin({ abierto, onCerrar, perfil }) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[var(--borde)] bg-[var(--superficie)] lg:block">
        <Contenido perfil={perfil} />
      </aside>

      {abierto ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={onCerrar}
            aria-label="Cerrar menú"
          />
          <aside className="deslizar-entrada absolute inset-y-0 left-0 w-[84vw] max-w-xs border-r border-[var(--borde)] bg-[var(--superficie)] shadow-2xl">
            <button
              type="button"
              onClick={onCerrar}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--texto-suave)] hover:bg-[var(--superficie-3)]"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
            <Contenido perfil={perfil} alNavegar={onCerrar} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
