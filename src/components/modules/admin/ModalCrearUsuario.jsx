"use client";

import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, UserPlus } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Boton from "@/components/ui/Boton";
import Campo from "@/components/ui/Campo";
import Entrada from "@/components/ui/Entrada";
import Selector from "@/components/ui/Selector";
import Interruptor from "@/components/ui/Interruptor";
import Alerta from "@/components/ui/Alerta";
import { crearUsuarioAdmin } from "@/lib/api/admin";
import { generarClaveTemporal } from "@/lib/seguridad/claves";
import { validarContrasena } from "@/lib/seguridad/contrasena";
import {
  limpiarRif,
  limpiarTelefono,
  validarCorreo,
  validarNombreCuenta,
  validarRifVe,
  validarTelefonoVe,
} from "@/lib/seguridad/validaciones";
import {
  SUFIJOS_LEGALES_VE,
  TIPOS_CUENTA,
} from "@/lib/utilidades/constantes";

const FORMULARIO_INICIAL = {
  nombreNegocio: "",
  correo: "",
  telefono: "",
  tipoCuenta: "micronegocio",
  negocioRegistrado: true,
  sufijoLegal: "C.A.",
  rif: "",
  dias: 30,
  contrasena: "",
};

export default function ModalCrearUsuario({ abierto, onCerrar, onCreado }) {
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setFormulario(FORMULARIO_INICIAL);
    setError("");
    setResultado(null);
    setCopiado(false);
  }, [abierto]);

  function actualizar(campo, valor) {
    setFormulario((anterior) => {
      const siguiente = { ...anterior, [campo]: valor };
      if (campo === "tipoCuenta") {
        if (valor === "personal") {
          siguiente.negocioRegistrado = false;
          siguiente.sufijoLegal = "";
          siguiente.rif = "";
        } else if (valor === "empresa") {
          siguiente.negocioRegistrado = true;
        }
      }
      if (campo === "negocioRegistrado" && !valor) {
        siguiente.sufijoLegal = "";
      }
      return siguiente;
    });
  }

  async function crear(evento) {
    evento.preventDefault();
    setError("");

    const errorNombre = validarNombreCuenta(formulario.nombreNegocio);
    if (errorNombre) return setError(errorNombre);
    const errorCorreo = validarCorreo(formulario.correo);
    if (errorCorreo) return setError(errorCorreo);
    const errorTelefono = validarTelefonoVe(formulario.telefono);
    if (errorTelefono) return setError(errorTelefono);
    const errorRif = validarRifVe(formulario.rif);
    if (errorRif) return setError(errorRif);
    if (formulario.negocioRegistrado && !formulario.sufijoLegal) {
      return setError("Selecciona el sufijo legal del negocio.");
    }
    if (formulario.contrasena) {
      const errorClave = validarContrasena(formulario.contrasena);
      if (errorClave) return setError(errorClave);
    }

    setProcesando(true);
    try {
      const datos = await crearUsuarioAdmin({
        ...formulario,
        correo: formulario.correo.trim().toLowerCase(),
        telefono: limpiarTelefono(formulario.telefono),
        rif: limpiarRif(formulario.rif),
      });
      setResultado(datos);
      onCreado?.(datos.usuario);
      toast.success("Usuario creado correctamente.");
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  async function copiar() {
    const lineas = [
      `Correo: ${resultado?.usuario?.correo || formulario.correo}`,
      resultado?.claveTemporal
        ? `Contraseña temporal: ${resultado.claveTemporal}`
        : "La contraseña fue definida manualmente.",
    ];
    try {
      await navigator.clipboard.writeText(lineas.join("\n"));
      setCopiado(true);
      toast.success("Credenciales copiadas.");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("No se pudieron copiar las credenciales.");
    }
  }

  const pieResultado = (
    <>
      <Boton variante="secundario" onClick={copiar}>
        {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copiado ? "Copiado" : "Copiar credenciales"}
      </Boton>
      <Boton onClick={onCerrar}>Listo</Boton>
    </>
  );

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={resultado ? "Cuenta creada" : "Crear usuario"}
      descripcion={
        resultado
          ? "Comparte estas credenciales con el negocio."
          : "Registra una cuenta manualmente y define sus datos fiscales."
      }
      ancho="lg"
      bloqueado={procesando}
      pie={
        resultado ? (
          pieResultado
        ) : (
          <>
            <Boton variante="secundario" onClick={onCerrar} disabled={procesando}>
              Cancelar
            </Boton>
            <Boton type="submit" form="form-crear-usuario" cargando={procesando}>
              <UserPlus className="h-4 w-4" />
              Crear usuario
            </Boton>
          </>
        )
      }
    >
      {resultado ? (
        <div className="space-y-3">
          <Alerta tipo="exito">
            La cuenta quedó creada y puede iniciar sesión de inmediato.
          </Alerta>
          <div className="rounded-xl border border-[var(--borde)] bg-[var(--superficie-2)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--texto-suave)]">
              Correo
            </p>
            <p className="mt-1 break-all font-mono text-sm">
              {resultado.usuario?.correo || formulario.correo}
            </p>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--texto-suave)]">
              {resultado.claveTemporal ? "Contraseña temporal" : "Contraseña"}
            </p>
            <p className="mt-1 flex items-center gap-2 break-all font-mono text-sm">
              <KeyRound className="h-4 w-4 shrink-0 text-[var(--primario)]" />
              {resultado.claveTemporal || "Definida manualmente"}
            </p>
            {resultado.reparado ? (
              <p className="mt-3 text-[11px] text-[var(--advertencia)]">
                Se reparó el acceso de un usuario que existía en autenticación sin
                perfil.
              </p>
            ) : null}
          </div>
          <p className="text-[11px] text-[var(--texto-tenue)]">
            Por seguridad, la contraseña temporal solo se muestra una vez. La
            licencia inicial es de {formulario.dias} días.
          </p>
        </div>
      ) : (
        <form id="form-crear-usuario" onSubmit={crear} className="space-y-3">
          {error ? <Alerta tipo="error">{error}</Alerta> : null}

          <Campo etiqueta="Nombre del negocio o cuenta" requerido>
            <Entrada
              value={formulario.nombreNegocio}
              onChange={(evento) => actualizar("nombreNegocio", evento.target.value)}
              placeholder="Ej. Abastos La Esquina"
              maxLength={140}
            />
          </Campo>

          <div className="grid gap-3 sm:grid-cols-2">
            <Campo etiqueta="Correo electrónico" requerido>
              <Entrada
                type="email"
                value={formulario.correo}
                onChange={(evento) => actualizar("correo", evento.target.value)}
                placeholder="correo@ejemplo.com"
                autoComplete="off"
              />
            </Campo>
            <Campo etiqueta="Teléfono" ayuda="Ej. 04121234567">
              <Entrada
                inputMode="numeric"
                value={formulario.telefono}
                onChange={(evento) =>
                  actualizar("telefono", limpiarTelefono(evento.target.value))
                }
                placeholder="04121234567"
                maxLength={13}
              />
            </Campo>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Campo etiqueta="Tipo de cuenta" requerido>
              <Selector
                value={formulario.tipoCuenta}
                onChange={(evento) => actualizar("tipoCuenta", evento.target.value)}
              >
                {TIPOS_CUENTA.map((tipo) => (
                  <option key={tipo.valor} value={tipo.valor}>
                    {tipo.etiqueta}
                  </option>
                ))}
              </Selector>
            </Campo>
            <Campo etiqueta="Días de licencia" requerido>
              <Entrada
                type="number"
                min="1"
                max="3650"
                value={formulario.dias}
                onChange={(evento) =>
                  actualizar("dias", Number(evento.target.value) || 1)
                }
              />
            </Campo>
          </div>

          <div className="rounded-xl border border-[var(--borde)] bg-[var(--superficie-2)] p-3.5">
            <Interruptor
              activo={formulario.negocioRegistrado}
              onCambio={(valor) => actualizar("negocioRegistrado", valor)}
              etiqueta="Negocio registrado"
              descripcion="Actívalo si la cuenta tiene RIF y sufijo legal."
              disabled={formulario.tipoCuenta === "personal"}
            />
            {formulario.negocioRegistrado ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Campo etiqueta="Sufijo legal" requerido>
                  <Selector
                    value={formulario.sufijoLegal}
                    onChange={(evento) =>
                      actualizar("sufijoLegal", evento.target.value)
                    }
                  >
                    <option value="">Selecciona un sufijo</option>
                    {SUFIJOS_LEGALES_VE.map((sufijo) => (
                      <option key={sufijo.valor} value={sufijo.valor}>
                        {sufijo.etiqueta}
                      </option>
                    ))}
                  </Selector>
                </Campo>
                <Campo etiqueta="RIF" ayuda="Formato J-12345678-9">
                  <Entrada
                    value={formulario.rif}
                    onChange={(evento) =>
                      actualizar("rif", limpiarRif(evento.target.value))
                    }
                    placeholder="J-12345678-9"
                    maxLength={12}
                  />
                </Campo>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-[var(--borde)] p-3.5">
            <Campo
              etiqueta="Contraseña"
              ayuda="Opcional. Si la dejas vacía se generará una temporal."
            >
              <div className="flex gap-2">
                <Entrada
                  type="text"
                  value={formulario.contrasena}
                  onChange={(evento) =>
                    actualizar("contrasena", evento.target.value)
                  }
                  placeholder="Mínimo 8 caracteres, sin espacios"
                  autoComplete="new-password"
                />
                <Boton
                  variante="secundario"
                  onClick={() => actualizar("contrasena", generarClaveTemporal())}
                  disabled={procesando}
                >
                  Generar
                </Boton>
              </div>
            </Campo>
          </div>
        </form>
      )}
    </Modal>
  );
}
