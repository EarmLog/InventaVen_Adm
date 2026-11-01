"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const TemaContext = createContext(null);
const CLAVE_LOCAL = "inventaven-admin-tema";

function aplicarTema(tema) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", tema === "oscuro");
  document.documentElement.style.colorScheme = tema === "oscuro" ? "dark" : "light";
}

export function ProveedorTema({ children }) {
  const [tema, setTema] = useState("claro");

  useEffect(() => {
    const guardado = window.localStorage.getItem(CLAVE_LOCAL) || "claro";
    const normalizado = guardado === "oscuro" ? "oscuro" : "claro";
    setTema(normalizado);
    aplicarTema(normalizado);
  }, []);

  const cambiarTema = useCallback((nuevoTema) => {
    const normalizado = nuevoTema === "oscuro" ? "oscuro" : "claro";
    setTema(normalizado);
    aplicarTema(normalizado);
    window.localStorage.setItem(CLAVE_LOCAL, normalizado);
  }, []);

  const alternarTema = useCallback(() => {
    cambiarTema(tema === "oscuro" ? "claro" : "oscuro");
  }, [cambiarTema, tema]);

  return (
    <TemaContext.Provider value={{ tema, cambiarTema, alternarTema }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema() {
  const contexto = useContext(TemaContext);
  if (!contexto) throw new Error("useTema debe usarse dentro de ProveedorTema.");
  return contexto;
}
