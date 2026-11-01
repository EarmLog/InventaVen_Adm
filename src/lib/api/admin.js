import { obtenerClienteSupabase } from "@/lib/supabase/cliente";

async function obtenerToken() {
  const { data } = await obtenerClienteSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("La sesión expiró. Inicia sesión nuevamente.");
  return token;
}

async function solicitar(ruta, opciones = {}) {
  const token = await obtenerToken();
  const respuesta = await fetch(ruta, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(opciones.headers || {}),
    },
    cache: "no-store",
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(datos.error || "No se pudo completar la operación.");
  }
  return datos;
}

export async function listarUsuariosAdmin() {
  const datos = await solicitar("/api/admin/usuarios");
  return datos.usuarios || [];
}

export async function actualizarLicenciaAdmin(payload) {
  const datos = await solicitar("/api/admin/usuarios", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return datos.usuario;
}
