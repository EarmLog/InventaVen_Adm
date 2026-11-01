export function traducirErrorAuth(error) {
  const mensaje = String(error?.message || "").toLowerCase();
  if (!mensaje) return "Ocurrió un error inesperado. Intenta de nuevo.";
  if (mensaje.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (mensaje.includes("email not confirmed")) {
    return "Debes confirmar tu correo antes de iniciar sesión.";
  }
  if (mensaje.includes("rate limit")) {
    return "Demasiados intentos. Espera unos minutos e intenta de nuevo.";
  }
  return error?.message || "Ocurrió un error inesperado. Intenta de nuevo.";
}

export async function solicitarPerfilAdmin(token) {
  const respuesta = await fetch("/api/auth/perfil", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(datos.error || "No se pudo verificar la cuenta.");
  }
  return datos.perfil;
}
