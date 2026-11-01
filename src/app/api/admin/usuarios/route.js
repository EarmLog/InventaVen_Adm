import { NextResponse } from "next/server";
import { crearClienteServidor, extraerToken } from "@/lib/supabase/servidor";
import {
  calcularDiasRestantes,
  limpiarTexto,
  sumarDias,
} from "@/lib/utilidades/formato";

export const dynamic = "force-dynamic";

function normalizarPerfil(perfil, correoAdmin) {
  const esAdmin =
    perfil.rol === "administrador" ||
    (correoAdmin && String(perfil.correo || "").toLowerCase() === correoAdmin);
  return {
    id: perfil.id,
    correo: perfil.correo,
    nombreNegocio: perfil.nombre_negocio,
    telefono: perfil.telefono || "",
    rol: esAdmin ? "administrador" : perfil.rol,
    fechaVencimiento: perfil.fecha_vencimiento,
    ultimoAcceso: perfil.ultimo_acceso,
    creadoEn: perfil.creado_en,
    diasLicencia: Math.max(0, calcularDiasRestantes(perfil.fecha_vencimiento)),
  };
}

async function requerirAdministrador(request) {
  const token = extraerToken(request);
  if (!token) throw new Error("No hay una sesión activa.");
  const cliente = crearClienteServidor();
  const { data: auth, error } = await cliente.auth.getUser(token);
  if (error || !auth?.user) throw new Error("La sesión no es válida o expiró.");

  const { data: perfil, error: errorPerfil } = await cliente
    .from("perfiles")
    .select("*")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (errorPerfil) throw errorPerfil;

  const correoAdmin = String(process.env.ADMIN_EMAIL || "").toLowerCase();
  const autorizado =
    perfil?.rol === "administrador" ||
    (correoAdmin &&
      String(perfil?.correo || auth.user.email).toLowerCase() === correoAdmin);

  if (!autorizado) throw new Error("Esta cuenta no tiene permisos de administración.");
  return { cliente, perfil, correoAdmin };
}

export async function GET(request) {
  try {
    const { cliente, correoAdmin } = await requerirAdministrador(request);
    const { data, error } = await cliente
      .from("perfiles")
      .select("*")
      .order("creado_en", { ascending: false });
    if (error) throw error;

    return NextResponse.json({
      usuarios: (data || []).map((perfil) => normalizarPerfil(perfil, correoAdmin)),
    });
  } catch (error) {
    const estado = /permisos|sesión/.test(error.message) ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status: estado });
  }
}

export async function PATCH(request) {
  try {
    const { cliente, correoAdmin } = await requerirAdministrador(request);
    const cuerpo = await request.json();
    const id = limpiarTexto(cuerpo.id, 64);
    if (!id) {
      return NextResponse.json(
        { error: "Debes indicar el usuario a actualizar." },
        { status: 400 }
      );
    }

    const { data: actual, error: errorActual } = await cliente
      .from("perfiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (errorActual) throw errorActual;
    if (!actual) {
      return NextResponse.json({ error: "El usuario no existe." }, { status: 404 });
    }

    const accion = limpiarTexto(cuerpo.accion, 20) || "extender";
    let fechaVencimiento = "";

    if (accion === "extender") {
      const dias = Math.min(3650, Math.max(1, Number(cuerpo.dias) || 30));
      const vencimientoActual = new Date(actual.fecha_vencimiento);
      const base =
        Number.isFinite(vencimientoActual.getTime()) && vencimientoActual > new Date()
          ? vencimientoActual
          : new Date();
      fechaVencimiento = sumarDias(base, dias);
    } else if (accion === "fijar") {
      const valor = limpiarTexto(cuerpo.fechaVencimiento, 40);
      if (!valor) {
        return NextResponse.json(
          { error: "Selecciona una fecha de vencimiento." },
          { status: 400 }
        );
      }
      const fecha = /^\d{4}-\d{2}-\d{2}$/.test(valor)
        ? new Date(`${valor}T23:59:59.000Z`)
        : new Date(valor);
      if (!Number.isFinite(fecha.getTime())) {
        return NextResponse.json(
          { error: "La fecha de vencimiento no es válida." },
          { status: 400 }
        );
      }
      fechaVencimiento = fecha.toISOString();
    } else if (accion === "revocar") {
      fechaVencimiento = new Date(Date.now() - 60_000).toISOString();
    } else {
      return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
    }

    const { data: actualizado, error: errorUpdate } = await cliente
      .from("perfiles")
      .update({ fecha_vencimiento: fechaVencimiento })
      .eq("id", id)
      .select("*")
      .single();
    if (errorUpdate) throw errorUpdate;

    return NextResponse.json({
      usuario: normalizarPerfil(actualizado, correoAdmin),
    });
  } catch (error) {
    const estado = /permisos|sesión/.test(error.message) ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status: estado });
  }
}
