"use client";

import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Boton from "@/components/ui/Boton";
import Campo from "@/components/ui/Campo";
import Entrada from "@/components/ui/Entrada";
import Etiqueta from "@/components/ui/Etiqueta";
import Alerta from "@/components/ui/Alerta";
import {
  eliminarUsuarioAdmin,
  restablecerClaveAdmin,
} from "@/lib/api/admin";
import { generarClaveTemporal } from "@/lib/seguridad/claves";
import { validarContrasena } from "@/lib/seguridad/contrasena";
import { formatearFecha } from "@/lib/utilidades/formato";

export default function ModalSeguridadUsuario({
  abierto,
  usuario,
  onCerrar,
  onEliminado,
}) {
  const [contrasena, setContrasena] = useState("");
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!abierto || !usuario) return;
    setContrasena("");
    setResultado(null);
    setError("");
    setConfirmarEliminar(false);
    setCopiado(false);
  }, [abierto, usuario]);

  if (!usuario) return null;

  const esAdministrador = usuario.rol === "administrador";

  async function restablecer() {
    setError("");
    if (contrasena) {
      const errorClave = validarContrasena(contrasena);
      if (errorClave) return setError(errorClave);
    }
    setProcesando(true);
    try {
      const datos = await restablecerClaveAdmin({
        id: usuario.id,
        contrasena,
      });
      setResultado(datos);
      setContrasena("");
      toast.success("Contraseña restablecida.");
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  async function eliminar() {
    setError("");
    setProcesando(true);
    try {
      await eliminarUsuarioAdmin(usuario.id);
      toast.success("Usuario eliminado.");
      onEliminado?.(usuario.id);
      onCerrar?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  async function copiar() {
    if (!resultado?.claveTemporal) return;
    try {
      await navigator.clipboard.writeText(
        `Correo: ${usuario.correo}\nContraseña temporal: ${resultado.claveTemporal}`
      );
      setCopiado(true);
      toast.success("Credenciales copiadas.");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("No se pudieron copiar las credenciales.");
    }
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Seguridad del usuario"
      descripcion={`${usuario.nombreNegocio} · ${usuario.correo}`}
      ancho="md"
      bloqueado={procesando}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar} disabled={procesando}>
            Cerrar
          </Boton>
          <Boton onClick={restablecer} cargando={procesando}>
            <KeyRound className="h-4 w-4" />
            Restablecer contraseña
          </Boton>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <Alerta tipo="error">{error}</Alerta> : null}

        <div className="flex items-start justify-between gap-3 rounded-xl border border-[var(--borde)] bg-[var(--superficie-2)] p-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--texto-suave)]">
              Datos de la cuenta
            </p>
            <p className="mt-1 truncate text-sm font-bold">{usuario.nombreNegocio}</p>
            <p className="truncate text-[11px] text-[var(--texto-suave)]">
              {usuario.correo}
            </p>
            {usuario.telefono ? (
              <p className="text-[11px] text-[var(--texto-tenue)]">{usuario.telefono}</p>
            ) : null}
            {usuario.rif ? (
              <p className="text-[11px] text-[var(--texto-tenue)]">
                RIF: {usuario.rif}
              </p>
            ) : null}
            <p className="mt-1 text-[10px] text-[var(--texto-tenue)]">
              Vence: {formatearFecha(usuario.fechaVencimiento)}
            </p>
          </div>
          <Etiqueta variante={esAdministrador ? "info" : "neutra"}>
            {esAdministrador ? "Administrador" : "Usuario"}
          </Etiqueta>
        </div>

        <div className="rounded-xl border border-[var(--borde)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--texto-suave)]">
            Restablecer contraseña
          </p>
          <p className="mt-1 text-[11px] text-[var(--texto-tenue)]">
            Escribe una nueva contraseña o genera una temporal. El usuario no
            necesitará confirmar el correo.
          </p>
          <div className="mt-3 space-y-2">
            <Campo
              etiqueta="Nueva contraseña"
              ayuda="Mínimo 8 caracteres, sin espacios. Déjala vacía para generar una."
            >
              <div className="flex gap-2">
                <Entrada
                  type="text"
                  value={contrasena}
                  onChange={(evento) => setContrasena(evento.target.value)}
                  placeholder="Contraseña temporal"
                  autoComplete="new-password"
                />
                <Boton
                  variante="secundario"
                  onClick={() => setContrasena(generarClaveTemporal())}
                  disabled={procesando}
                >
                  Generar
                </Boton>
              </div>
            </Campo>
          </div>

          {resultado?.claveTemporal ? (
            <div className="mt-3 rounded-lg border border-[var(--primario)]/30 bg-[var(--primario-suave)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--primario-fuerte)]">
                Contraseña temporal
              </p>
              <p className="mt-1 break-all font-mono text-sm font-bold text-[var(--primario-fuerte)]">
                {resultado.claveTemporal}
              </p>
              <Boton variante="secundario" tamano="sm" className="mt-2" onClick={copiar}>
                {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiado ? "Copiada" : "Copiar credenciales"}
              </Boton>
            </div>
          ) : resultado ? (
            <p className="mt-3 text-[11px] text-[var(--primario-fuerte)]">
              La contraseña fue actualizada correctamente.
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-[var(--peligro)]/25 bg-[var(--peligro-suave)]/60 p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[var(--peligro)]" />
            <p className="text-xs font-semibold text-[var(--peligro)]">Eliminar cuenta</p>
          </div>
          {esAdministrador ? (
            <p className="mt-2 text-[11px] text-[var(--texto-suave)]">
              Las cuentas administradoras están protegidas y no se pueden eliminar
              desde este panel.
            </p>
          ) : confirmarEliminar ? (
            <div className="mt-2 space-y-2">
              <p className="text-[11px] text-[var(--texto-suave)]">
                Esta acción elimina el acceso y el perfil del usuario de forma
                permanente. No se puede deshacer.
              </p>
              <div className="flex gap-2">
                <Boton
                  variante="peligro"
                  tamano="sm"
                  onClick={eliminar}
                  cargando={procesando}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Confirmar eliminación
                </Boton>
                <Boton
                  variante="secundario"
                  tamano="sm"
                  onClick={() => setConfirmarEliminar(false)}
                  disabled={procesando}
                >
                  Cancelar
                </Boton>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmarEliminar(true)}
              className="mt-2 text-[11px] font-semibold text-[var(--peligro)] underline-offset-2 hover:underline"
            >
              Eliminar este usuario permanentemente
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
