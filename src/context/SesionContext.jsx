"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { obtenerClienteSupabase } from "@/lib/supabase/cliente";
import { solicitarPerfilAdmin, traducirErrorAuth } from "@/lib/api/auth";

const SesionContext = createContext(null);

export function ProveedorSesion({ children }) {
  const [sesion, setSesion] = useState(undefined);
  const [perfil, setPerfil] = useState(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(false);
  const [errorAcceso, setErrorAcceso] = useState("");
  const montado = useRef(true);
  const perfilEnCurso = useRef(false);

  const cargarPerfil = useCallback(async (sesionActual) => {
    if (!sesionActual?.access_token) {
      if (montado.current) setPerfil(null);
      return null;
    }
    if (perfilEnCurso.current) return null;
    perfilEnCurso.current = true;
    if (montado.current) setCargandoPerfil(true);
    try {
      const datos = await solicitarPerfilAdmin(sesionActual.access_token);
      if (montado.current) {
        setPerfil(datos);
        setErrorAcceso("");
      }
      return datos;
    } catch (error) {
      if (montado.current) {
        setPerfil(null);
        setErrorAcceso(error.message);
      }
      if (/permisos|no es válida|no hay una sesión/i.test(error.message)) {
        await obtenerClienteSupabase().auth.signOut();
        if (montado.current) setSesion(null);
      }
      return null;
    } finally {
      perfilEnCurso.current = false;
      if (montado.current) setCargandoPerfil(false);
    }
  }, []);

  useEffect(() => {
    montado.current = true;
    const supabase = obtenerClienteSupabase();

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!montado.current) return;
        setSesion(data.session ?? null);
        if (data.session) cargarPerfil(data.session);
      })
      .catch(() => {
        if (montado.current) setSesion(null);
      });

    const { data: escucha } = supabase.auth.onAuthStateChange((evento, nuevaSesion) => {
      if (!montado.current) return;
      setSesion(nuevaSesion ?? null);
      if (nuevaSesion) {
        if (evento !== "TOKEN_REFRESHED") cargarPerfil(nuevaSesion);
      } else {
        setPerfil(null);
      }
    });

    return () => {
      montado.current = false;
      escucha?.subscription?.unsubscribe();
    };
  }, [cargarPerfil]);

  useEffect(() => {
    if (!sesion) return undefined;
    const intervalo = window.setInterval(() => {
      obtenerClienteSupabase()
        .auth.getSession()
        .then(({ data }) => {
          if (data.session) cargarPerfil(data.session);
        });
    }, 60_000);
    return () => window.clearInterval(intervalo);
  }, [sesion, cargarPerfil]);

  const iniciarSesion = useCallback(async ({ correo, contrasena, captcha }) => {
    const respuesta = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, contrasena, captcha }),
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok || !datos.sesion) {
      throw new Error(datos.error || "No se pudo iniciar sesión.");
    }

    const supabase = obtenerClienteSupabase();
    const { error } = await supabase.auth.setSession({
      access_token: datos.sesion.access_token,
      refresh_token: datos.sesion.refresh_token,
    });
    if (error) throw new Error(traducirErrorAuth(error));

    try {
      const perfilAdmin = await solicitarPerfilAdmin(datos.sesion.access_token);
      setPerfil(perfilAdmin);
      return perfilAdmin;
    } catch (errorPerfil) {
      await supabase.auth.signOut();
      throw new Error(errorPerfil.message);
    }
  }, []);

  const cerrarSesion = useCallback(async () => {
    await obtenerClienteSupabase().auth.signOut();
    setPerfil(null);
    setSesion(null);
    setErrorAcceso("");
  }, []);

  const refrescarPerfil = useCallback(async () => {
    const { data } = await obtenerClienteSupabase().auth.getSession();
    if (data.session) return cargarPerfil(data.session);
    return null;
  }, [cargarPerfil]);

  return (
    <SesionContext.Provider
      value={{
        sesion,
        perfil,
        cargandoPerfil,
        errorAcceso,
        esAdmin: perfil?.rol === "administrador",
        iniciarSesion,
        cerrarSesion,
        refrescarPerfil,
      }}
    >
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion() {
  const contexto = useContext(SesionContext);
  if (!contexto) throw new Error("useSesion debe usarse dentro de ProveedorSesion.");
  return contexto;
}
