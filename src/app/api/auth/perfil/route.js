import { NextResponse } from "next/server";
import { crearClienteServidor, extraerToken } from "@/lib/supabase/servidor";
import { calcularDiasRestantes } from "@/lib/utilidades/formato";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const token = extraerToken(request);
    if (!token) {
      return NextResponse.json({ error: "No hay una sesión activa." }, { status: 401 });
    }
    const cliente = crearClienteServidor();
    const { data, error } = await cliente.auth.getUser(token);
    if (error || !data?.user) {
      return NextResponse.json(
        { error: "La sesión no es válida o expiró." },
        { status: 401 }
      );
    }

    const { data: perfil, error: errorPerfil } = await cliente
      .from("perfiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();
    if (errorPerfil) throw errorPerfil;

    const correoAdmin = String(process.env.ADMIN_EMAIL || "").toLowerCase();
    const esAdmin =
      perfil?.rol === "administrador" ||
      (correoAdmin && String(perfil?.correo || data.user.email).toLowerCase() === correoAdmin);

    if (!perfil || !esAdmin) {
      return NextResponse.json(
        { error: "Esta cuenta no tiene permisos de administración." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      perfil: {
        id: perfil.id,
        correo: perfil.correo,
        nombreNegocio: perfil.nombre_negocio,
        telefono: perfil.telefono || "",
        rol: perfil.rol,
        fechaVencimiento: perfil.fecha_vencimiento,
        ultimoAcceso: perfil.ultimo_acceso,
        creadoEn: perfil.creado_en,
        diasLicencia: Math.max(0, calcularDiasRestantes(perfil.fecha_vencimiento)),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo verificar la cuenta.", detalle: error.message },
      { status: 500 }
    );
  }
}
