"use client";

import { useEffect, useState } from "react";
import { CalendarClock, KeyRound, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Boton from "@/components/ui/Boton";
import Campo from "@/components/ui/Campo";
import Entrada from "@/components/ui/Entrada";
import Etiqueta from "@/components/ui/Etiqueta";
import Alerta from "@/components/ui/Alerta";
import { actualizarLicenciaAdmin } from "@/lib/api/admin";
import { fechaParaInput, formatearFecha } from "@/lib/utilidades/formato";

const OPCIONES = [15, 30, 90, 365];

export default function ModalLicencia({ abierto, usuario, onCerrar, onActualizado }) {
  const [modo, setModo] = useState("extender");
  const [dias, setDias] = useState(30);
  const [fecha, setFecha] = useState(fechaParaInput());
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [confirmarRevocar, setConfirmarRevocar] = useState(false);

  useEffect(() => {
    if (!abierto || !usuario) return;
    setModo("extender");
    setDias(30);
    setFecha(
      usuario.fechaVencimiento
        ? fechaParaInput(new Date(usuario.fechaVencimiento))
        : fechaParaInput()
    );
    setError("");
    setConfirmarRevocar(false);
  }, [abierto, usuario]);

  if (!usuario) return null;

  const activa = Number(usuario.diasLicencia) > 0;

  async function guardar(accionPersonalizada = null) {
    setError("");
    setProcesando(true);
    try {
      const payload = accionPersonalizada
        ? { id: usuario.id, accion: accionPersonalizada }
        : modo === "fijar"
          ? { id: usuario.id, accion: "fijar", fechaVencimiento: fecha }
          : { id: usuario.id, accion: "extender", dias };
      const actualizado = await actualizarLicenciaAdmin(payload);
      toast.success(
        accionPersonalizada === "revocar"
          ? "Licencia revocada. La cuenta quedó vencida."
          : `Licencia actualizada hasta ${formatearFecha(actualizado.fechaVencimiento, {
              year: "numeric",
              month: "long",
              day: "2-digit",
            })}.`
      );
      onActualizado?.(actualizado);
      onCerrar?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Gestionar licencia"
      descripcion={`${usuario.nombreNegocio} · ${usuario.correo}`}
      ancho="md"
      bloqueado={procesando}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar} disabled={procesando}>
            Cancelar
          </Boton>
          <Boton onClick={() => guardar()} cargando={procesando}>
            <KeyRound className="h-4 w-4" />
            Guardar licencia
          </Boton>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <Alerta tipo="error">{error}</Alerta> : null}

        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--borde)] bg-[var(--superficie-2)] p-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--texto-suave)]">
              Licencia actual
            </p>
            <p className="mt-1 text-sm font-bold">
              {formatearFecha(usuario.fechaVencimiento, {
                year: "numeric",
                month: "long",
                day: "2-digit",
              })}
            </p>
            <p className="text-[10px] text-[var(--texto-tenue)]">
              Último acceso:{" "}
              {usuario.ultimoAcceso ? formatearFecha(usuario.ultimoAcceso) : "nunca"}
            </p>
          </div>
          <Etiqueta variante={activa ? "exito" : "peligro"}>
            {activa ? `${usuario.diasLicencia} días` : "Vencida"}
          </Etiqueta>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setModo("extender")}
            className={[
              "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition",
              modo === "extender"
                ? "border-[var(--primario)] bg-[var(--primario-suave)] text-[var(--primario-fuerte)]"
                : "border-[var(--borde)] hover:bg-[var(--superficie-2)]",
            ].join(" ")}
          >
            <CalendarClock className="h-4 w-4" />
            Extender días
          </button>
          <button
            type="button"
            onClick={() => setModo("fijar")}
            className={[
              "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition",
              modo === "fijar"
                ? "border-[var(--primario)] bg-[var(--primario-suave)] text-[var(--primario-fuerte)]"
                : "border-[var(--borde)] hover:bg-[var(--superficie-2)]",
            ].join(" ")}
          >
            <CalendarClock className="h-4 w-4" />
            Fijar fecha
          </button>
        </div>

        {modo === "extender" ? (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--texto-suave)]">
              Días a sumar desde el vencimiento actual (o desde hoy si ya venció)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {OPCIONES.map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => setDias(opcion)}
                  className={[
                    "rounded-xl border px-2 py-2.5 text-xs font-bold transition",
                    dias === opcion
                      ? "border-[var(--primario)] bg-[var(--primario-suave)] text-[var(--primario-fuerte)]"
                      : "border-[var(--borde)] hover:bg-[var(--superficie-2)]",
                  ].join(" ")}
                >
                  +{opcion}
                </button>
              ))}
            </div>
            <div className="mt-2">
              <Campo etiqueta="Días personalizados">
                <Entrada
                  type="number"
                  min="1"
                  max="3650"
                  value={dias}
                  onChange={(evento) => setDias(Number(evento.target.value) || 1)}
                />
              </Campo>
            </div>
          </div>
        ) : (
          <Campo etiqueta="Nueva fecha de vencimiento" requerido>
            <Entrada
              type="date"
              value={fecha}
              onChange={(evento) => setFecha(evento.target.value)}
            />
          </Campo>
        )}

        <div className="rounded-xl border border-[var(--peligro)]/25 bg-[var(--peligro-suave)]/60 p-3">
          <div className="flex items-center gap-2">
            <ShieldOff className="h-4 w-4 text-[var(--peligro)]" />
            <p className="text-xs font-semibold text-[var(--peligro)]">Revocar acceso</p>
          </div>
          {confirmarRevocar ? (
            <div className="mt-2 space-y-2">
              <p className="text-[11px] text-[var(--texto-suave)]">
                La licencia quedará vencida inmediatamente. La app seguirá funcionando,
                pero sin días de licencia.
              </p>
              <div className="flex gap-2">
                <Boton
                  variante="peligro"
                  tamano="sm"
                  onClick={() => guardar("revocar")}
                  cargando={procesando}
                >
                  Confirmar revocación
                </Boton>
                <Boton
                  variante="secundario"
                  tamano="sm"
                  onClick={() => setConfirmarRevocar(false)}
                  disabled={procesando}
                >
                  Cancelar
                </Boton>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmarRevocar(true)}
              className="mt-2 text-[11px] font-semibold text-[var(--peligro)] underline-offset-2 hover:underline"
            >
              Marcar esta licencia como vencida
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
