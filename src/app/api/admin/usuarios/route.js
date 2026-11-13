import { NextResponse } from "next/server";
import { crearClienteServidor, extraerToken } from "@/lib/supabase/servidor";
import {
  calcularDiasRestantes,
  limpiarTexto,
  sumarDias,
} from "@/lib/utilidades/formato";
import { validarContrasena } from "@/lib/seguridad/contrasena";
import { generarClaveTemporal } from "@/lib/seguridad/claves";
import {
  componerNombreNegocio,
  esSufijoLegalValido,
  esTipoCuentaValido,
  limpiarRif,
  limpiarTelefono,
  normalizarCorreo,
  validarCorreo,
  validarNombreCuenta,
  validarRifVe,
  validarTelefonoVe,
} from "@/lib/seguridad/validaciones";

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
    tipoCuenta: perfil.tipo_cuenta || "personal",
    negocioRegistrado: Boolean(perfil.negocio_registrado),
    sufijoLegal: perfil.sufijo_legal || "",
    rif: perfil.rif || "",
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
  return {
    cliente,
    perfil,
    correoAdmin,
    usuarioAutenticado: auth.user,
  };
}

async function buscarUsuarioAuthPorCorreo(cliente, correo) {
  for (let pagina = 1; pagina <= 10; pagina += 1) {
    const { data, error } = await cliente.auth.admin.listUsers({
      page: pagina,
      perPage: 1000,
    });
    if (error) throw error;
    const usuarios = data?.users || [];
    const encontrado = usuarios.find(
      (usuario) => String(usuario.email || "").toLowerCase() === correo
    );
    if (encontrado) return encontrado;
    if (usuarios.length < 1000) break;
  }
  return null;
}

function esCuentaProtegida(perfil, correoAdmin, usuarioAutenticado) {
  if (!perfil) return false;
  if (usuarioAutenticado?.id && perfil.id === usuarioAutenticado.id) return true;
  if (perfil.rol === "administrador") return true;
  if (
    correoAdmin &&
    String(perfil.correo || "").toLowerCase() === correoAdmin
  ) {
    return true;
  }
  return false;
}

function validarNuevoUsuario(cuerpo) {
  const correo = normalizarCorreo(cuerpo.correo);
  const errorCorreo = validarCorreo(correo);
  if (errorCorreo) return { error: errorCorreo };

  const errorNombre = validarNombreCuenta(cuerpo.nombreNegocio);
  if (errorNombre) return { error: errorNombre };

  const tipoCuenta = String(cuerpo.tipoCuenta || "micronegocio");
  if (!esTipoCuentaValido(tipoCuenta)) {
    return { error: "El tipo de cuenta no es válido." };
  }

  let negocioRegistrado = Boolean(cuerpo.negocioRegistrado);
  if (tipoCuenta === "empresa") negocioRegistrado = true;
  if (tipoCuenta === "personal") negocioRegistrado = false;

  const sufijoLegal = negocioRegistrado
    ? String(cuerpo.sufijoLegal || "")
    : "";
  if (sufijoLegal && !esSufijoLegalValido(sufijoLegal)) {
    return { error: "El sufijo legal no es válido." };
  }
  if (negocioRegistrado && !sufijoLegal) {
    return { error: "Selecciona el sufijo legal del negocio." };
  }

  const telefono = limpiarTelefono(cuerpo.telefono);
  const errorTelefono = validarTelefonoVe(telefono);
  if (errorTelefono) return { error: errorTelefono };

  const rif = tipoCuenta === "personal" ? "" : limpiarRif(cuerpo.rif);
  const errorRif = validarRifVe(rif, { obligatorio: false });
  if (errorRif) return { error: errorRif };

  const contrasena = String(cuerpo.contrasena || "");
  if (contrasena) {
    const errorClave = validarContrasena(contrasena);
    if (errorClave) return { error: errorClave };
  }

  const dias = Math.min(3650, Math.max(1, Number(cuerpo.dias) || 30));
  const nombreCompleto = componerNombreNegocio(
    cuerpo.nombreNegocio,
    sufijoLegal
  );

  return {
    datos: {
      correo,
      nombreCompleto,
      telefono,
      tipoCuenta,
      negocioRegistrado,
      sufijoLegal,
      rif,
      contrasena,
      dias,
    },
  };
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

export async function POST(request) {
  try {
    const { cliente, correoAdmin } = await requerirAdministrador(request);
    const cuerpo = await request.json();
    const validacion = validarNuevoUsuario(cuerpo);
    if (validacion.error) {
      return NextResponse.json({ error: validacion.error }, { status: 400 });
    }

    const {
      correo,
      nombreCompleto,
      telefono,
      tipoCuenta,
      negocioRegistrado,
      sufijoLegal,
      rif,
      contrasena,
      dias,
    } = validacion.datos;

    const claveUsada = contrasena || generarClaveTemporal();
    const claveGenerada = !contrasena;
    const metadatos = {
      nombre_negocio: nombreCompleto,
      nombre: nombreCompleto,
      telefono: telefono || "",
      tipo_cuenta: tipoCuenta,
      negocio_registrado: negocioRegistrado,
      sufijo_legal: sufijoLegal || "",
      rif: rif || "",
      onboardingVisto: false,
    };

    let usuarioAuth = null;
    let reparado = false;

    const { data: creadoAuth, error: errorAuth } =
      await cliente.auth.admin.createUser({
        email: correo,
        password: claveUsada,
        email_confirm: true,
        user_metadata: metadatos,
      });

    if (errorAuth) {
      const existente = await buscarUsuarioAuthPorCorreo(cliente, correo).catch(
        () => null
      );
      if (!existente) {
        const mensaje = String(errorAuth.message || "").toLowerCase();
        if (/already|registered|existe/.test(mensaje)) {
          return NextResponse.json(
            { error: "Ya existe una cuenta con ese correo electrónico." },
            { status: 409 }
          );
        }
        throw errorAuth;
      }

      const { data: perfilExistente, error: errorPerfilExistente } = await cliente
        .from("perfiles")
        .select("id")
        .eq("id", existente.id)
        .maybeSingle();
      if (errorPerfilExistente) throw errorPerfilExistente;
      if (perfilExistente) {
        return NextResponse.json(
          { error: "Ya existe una cuenta con ese correo electrónico." },
          { status: 409 }
        );
      }

      const { data: actualizado, error: errorReparacion } =
        await cliente.auth.admin.updateUserById(existente.id, {
          password: claveUsada,
          email_confirm: true,
          user_metadata: {
            ...(existente.user_metadata || {}),
            ...metadatos,
          },
        });
      if (errorReparacion) throw errorReparacion;
      usuarioAuth = actualizado.user;
      reparado = true;
    } else {
      usuarioAuth = creadoAuth.user;
    }

    if (!usuarioAuth?.id) {
      throw new Error("No se pudo crear el acceso del usuario.");
    }

    const nuevoPerfil = {
      id: usuarioAuth.id,
      correo,
      nombre_negocio: nombreCompleto,
      telefono: telefono || null,
      tipo_cuenta: tipoCuenta,
      negocio_registrado: negocioRegistrado,
      sufijo_legal: sufijoLegal || null,
      rif: rif || null,
      rol: "usuario",
      fecha_vencimiento: sumarDias(new Date(), dias).toISOString(),
      ultimo_acceso: null,
    };

    const { data: perfilCreado, error: errorPerfil } = await cliente
      .from("perfiles")
      .insert(nuevoPerfil)
      .select("*")
      .single();
    if (errorPerfil) {
      if (!reparado) {
        await cliente.auth.admin.deleteUser(usuarioAuth.id).catch(() => null);
      }
      throw errorPerfil;
    }

    return NextResponse.json(
      {
        usuario: normalizarPerfil(perfilCreado, correoAdmin),
        ...(claveGenerada ? { claveTemporal: claveUsada } : {}),
        reparado,
      },
      { status: 201 }
    );
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

    const accion = limpiarTexto(cuerpo.accion, 30) || "extender";

    if (accion === "restablecerClave") {
      const contrasena = String(cuerpo.contrasena || "");
      let claveUsada = contrasena;
      let claveGenerada = false;
      if (claveUsada) {
        const errorClave = validarContrasena(claveUsada);
        if (errorClave) {
          return NextResponse.json({ error: errorClave }, { status: 400 });
        }
      } else {
        claveUsada = generarClaveTemporal();
        claveGenerada = true;
      }

      const { error: errorClave } = await cliente.auth.admin.updateUserById(id, {
        password: claveUsada,
      });
      if (errorClave) throw errorClave;

      return NextResponse.json({
        usuario: normalizarPerfil(actual, correoAdmin),
        ...(claveGenerada ? { claveTemporal: claveUsada } : {}),
      });
    }

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

export async function DELETE(request) {
  try {
    const { cliente, correoAdmin, usuarioAutenticado } =
      await requerirAdministrador(request);
    const cuerpo = await request.json();
    const id = limpiarTexto(cuerpo.id, 64);
    if (!id) {
      return NextResponse.json(
        { error: "Debes indicar el usuario a eliminar." },
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

    if (esCuentaProtegida(actual, correoAdmin, usuarioAutenticado)) {
      return NextResponse.json(
        {
          error:
            "No puedes eliminar una cuenta administradora ni tu propia cuenta.",
        },
        { status: 400 }
      );
    }

    const { error: errorAuth } = await cliente.auth.admin.deleteUser(id);
    if (errorAuth && !/not found|user not found/i.test(errorAuth.message)) {
      throw errorAuth;
    }

    const { error: errorPerfil } = await cliente
      .from("perfiles")
      .delete()
      .eq("id", id);
    if (errorPerfil) throw errorPerfil;

    return NextResponse.json({ eliminado: true, id });
  } catch (error) {
    const estado = /permisos|sesión/.test(error.message) ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status: estado });
  }
}
