"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  KeyRound,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import Tarjeta from "@/components/ui/Tarjeta";
import Boton from "@/components/ui/Boton";
import Entrada from "@/components/ui/Entrada";
import Selector from "@/components/ui/Selector";
import Etiqueta from "@/components/ui/Etiqueta";
import EstadoVacio from "@/components/ui/EstadoVacio";
import ModalLicencia from "@/components/modules/admin/ModalLicencia";
import { listarUsuariosAdmin } from "@/lib/api/admin";
import { formatearFecha, formatearNumero } from "@/lib/utilidades/formato";

function Indicador({ Icono, etiqueta, valor, detalle, tono = "verde" }) {
  const tonos = {
    verde: "bg-[var(--primario-suave)] text-[var(--primario-fuerte)]",
    azul: "bg-[var(--info-suave)] text-[var(--info)]",
    ambar: "bg-[var(--advertencia-suave)] text-[var(--advertencia)]",
    rojo: "bg-[var(--peligro-suave)] text-[var(--peligro)]",
  };
  return (
    <Tarjeta className="flex items-center gap-3 p-4">
      <span className={["flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tonos[tono]].join(" ")}>
        <Icono className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--texto-suave)]">
          {etiqueta}
        </p>
        <p className="truncate text-lg font-bold tracking-tight">{valor}</p>
        <p className="truncate text-[10px] text-[var(--texto-tenue)]">{detalle}</p>
      </div>
    </Tarjeta>
  );
}

function estadoLicencia(usuario) {
  const dias = Number(usuario.diasLicencia) || 0;
  if (dias <= 0) {
    return { etiqueta: "Vencida", variante: "peligro", filtro: "vencidos" };
  }
  if (dias <= 7) {
    return { etiqueta: "Por vencer", variante: "advertencia", filtro: "porvencer" };
  }
  return { etiqueta: "Activa", variante: "exito", filtro: "activos" };
}

export default function PaginaPanelAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [seleccionado, setSeleccionado] = useState(null);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    setError("");
    try {
      const datos = await listarUsuariosAdmin();
      setUsuarios(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const resumen = useMemo(() => {
    const activos = usuarios.filter((usuario) => Number(usuario.diasLicencia) > 7).length;
    const porVencer = usuarios.filter((usuario) => {
      const dias = Number(usuario.diasLicencia) || 0;
      return dias > 0 && dias <= 7;
    }).length;
    const vencidos = usuarios.filter((usuario) => Number(usuario.diasLicencia) <= 0).length;
    return { activos, porVencer, vencidos };
  }, [usuarios]);

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return usuarios.filter((usuario) => {
      const coincideBusqueda =
        !termino ||
        String(usuario.nombreNegocio || "").toLowerCase().includes(termino) ||
        String(usuario.correo || "").toLowerCase().includes(termino) ||
        String(usuario.telefono || "").toLowerCase().includes(termino);
      const estado = estadoLicencia(usuario);
      const coincideFiltro = filtro === "todos" || estado.filtro === filtro;
      return coincideBusqueda && coincideFiltro;
    });
  }, [usuarios, busqueda, filtro]);

  function actualizado(usuarioActualizado) {
    setUsuarios((anterior) =>
      anterior.map((usuario) =>
        usuario.id === usuarioActualizado.id ? usuarioActualizado : usuario
      )
    );
    setSeleccionado(null);
  }

  async function refrescar() {
    await cargar(true);
    toast.success("Lista de usuarios actualizada.");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios y licencias</h1>
          <p className="mt-1 text-sm text-[var(--texto-suave)]">
            Administra el vencimiento de cada negocio registrado en InventaVen.
          </p>
        </div>
        <Boton variante="secundario" onClick={refrescar} cargando={cargando}>
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Boton>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          Icono={Users}
          etiqueta="Usuarios registrados"
          valor={formatearNumero(usuarios.length)}
          detalle="Cuentas con perfil en InventaVen"
        />
        <Indicador
          Icono={UserCheck}
          etiqueta="Licencias activas"
          valor={formatearNumero(resumen.activos)}
          detalle="Más de 7 días de vigencia"
          tono="azul"
        />
        <Indicador
          Icono={AlertTriangle}
          etiqueta="Por vencer"
          valor={formatearNumero(resumen.porVencer)}
          detalle="Vencen en los próximos 7 días"
          tono="ambar"
        />
        <Indicador
          Icono={ShieldX}
          etiqueta="Licencias vencidas"
          valor={formatearNumero(resumen.vencidos)}
          detalle="Requieren renovación"
          tono="rojo"
        />
      </div>

      {error ? (
        <div className="flex flex-col gap-2 rounded-xl border border-[var(--peligro)]/25 bg-[var(--peligro-suave)] px-4 py-3 text-xs text-[var(--peligro)] sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <Boton variante="peligroSuave" tamano="sm" onClick={() => cargar()}>
            Reintentar
          </Boton>
        </div>
      ) : null}

      <Tarjeta className="p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-[1.5fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--texto-tenue)]" />
            <Entrada
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar por negocio, correo o teléfono..."
              className="pl-9"
            />
          </div>
          <Selector value={filtro} onChange={(evento) => setFiltro(evento.target.value)}>
            <option value="todos">Todas las licencias</option>
            <option value="activos">Activas</option>
            <option value="porvencer">Por vencer (7 días)</option>
            <option value="vencidos">Vencidas</option>
          </Selector>
        </div>
        <p className="mt-3 border-t border-[var(--borde)] pt-3 text-[11px] text-[var(--texto-suave)]">
          Mostrando {filtrados.length} de {usuarios.length} usuarios.
        </p>
      </Tarjeta>

      {cargando && usuarios.length === 0 ? (
        <Tarjeta>
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--texto-suave)]">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Cargando usuarios...
          </div>
        </Tarjeta>
      ) : usuarios.length === 0 ? (
        <Tarjeta>
          <EstadoVacio
            icono={Users}
            titulo="No hay usuarios registrados"
            descripcion="Cuando un negocio cree su cuenta en InventaVen aparecerá aquí."
          />
        </Tarjeta>
      ) : filtrados.length === 0 ? (
        <Tarjeta>
          <EstadoVacio
            icono={Search}
            titulo="Sin resultados"
            descripcion="Prueba con otro término o cambia el filtro de licencias."
          />
        </Tarjeta>
      ) : (
        <>
          <Tarjeta className="hidden overflow-hidden p-0 md:block">
            <div className="overflow-x-auto">
              <table className="tabla-base min-w-[900px]">
                <thead>
                  <tr>
                    <th>Negocio</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Vencimiento</th>
                    <th>Días</th>
                    <th>Último acceso</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((usuario) => {
                    const estado = estadoLicencia(usuario);
                    return (
                      <tr key={usuario.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--superficie-3)] text-[11px] font-bold text-[var(--texto-suave)]">
                              {String(usuario.nombreNegocio || usuario.correo || "N")
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="max-w-[220px] truncate text-xs font-semibold">
                                {usuario.nombreNegocio || "Sin nombre"}
                              </p>
                              <p className="max-w-[220px] truncate text-[10px] text-[var(--texto-suave)]">
                                {usuario.correo}
                              </p>
                              {usuario.telefono ? (
                                <p className="text-[10px] text-[var(--texto-tenue)]">
                                  {usuario.telefono}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td>
                          <Etiqueta
                            variante={usuario.rol === "administrador" ? "info" : "neutra"}
                          >
                            {usuario.rol === "administrador" ? "Administrador" : "Usuario"}
                          </Etiqueta>
                        </td>
                        <td>
                          <Etiqueta variante={estado.variante}>{estado.etiqueta}</Etiqueta>
                        </td>
                        <td className="text-xs">{formatearFecha(usuario.fechaVencimiento)}</td>
                        <td>
                          <span
                            className={[
                              "text-xs font-bold",
                              Number(usuario.diasLicencia) <= 0
                                ? "text-[var(--peligro)]"
                                : Number(usuario.diasLicencia) <= 7
                                  ? "text-[var(--advertencia)]"
                                  : "text-[var(--primario-fuerte)]",
                            ].join(" ")}
                          >
                            {formatearNumero(usuario.diasLicencia)}
                          </span>
                        </td>
                        <td className="text-[10px] text-[var(--texto-suave)]">
                          {usuario.ultimoAcceso
                            ? formatearFecha(usuario.ultimoAcceso, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Nunca"}
                        </td>
                        <td>
                          <div className="flex justify-end">
                            <Boton
                              variante="secundario"
                              tamano="sm"
                              onClick={() => setSeleccionado(usuario)}
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              Gestionar
                            </Boton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Tarjeta>

          <div className="space-y-2 md:hidden">
            {filtrados.map((usuario) => {
              const estado = estadoLicencia(usuario);
              return (
                <Tarjeta key={usuario.id} className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--superficie-3)] text-[11px] font-bold text-[var(--texto-suave)]">
                        {String(usuario.nombreNegocio || usuario.correo || "N")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {usuario.nombreNegocio || "Sin nombre"}
                        </p>
                        <p className="truncate text-[10px] text-[var(--texto-suave)]">
                          {usuario.correo}
                        </p>
                      </div>
                    </div>
                    <Etiqueta variante={estado.variante}>{estado.etiqueta}</Etiqueta>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg bg-[var(--superficie-2)] px-2.5 py-2">
                      <p className="text-[9px] uppercase text-[var(--texto-tenue)]">
                        Vencimiento
                      </p>
                      <p className="font-semibold">
                        {formatearFecha(usuario.fechaVencimiento)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[var(--superficie-2)] px-2.5 py-2">
                      <p className="text-[9px] uppercase text-[var(--texto-tenue)]">
                        Días restantes
                      </p>
                      <p className="font-semibold">{formatearNumero(usuario.diasLicencia)}</p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-[10px] text-[var(--texto-tenue)]">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {usuario.ultimoAcceso
                        ? formatearFecha(usuario.ultimoAcceso)
                        : "Sin acceso"}
                    </span>
                    <Boton
                      variante="exitoSuave"
                      tamano="sm"
                      onClick={() => setSeleccionado(usuario)}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Gestionar
                    </Boton>
                  </div>
                </Tarjeta>
              );
            })}
          </div>
        </>
      )}

      <div className="flex items-center gap-2 rounded-xl border border-[var(--borde)] bg-[var(--superficie-2)] px-3 py-2.5 text-[10px] text-[var(--texto-suave)]">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--primario)]" />
        Solo los perfiles con rol administrador o el correo configurado pueden consultar
        y modificar licencias.
      </div>

      <ModalLicencia
        abierto={Boolean(seleccionado)}
        usuario={seleccionado}
        onCerrar={() => setSeleccionado(null)}
        onActualizado={actualizado}
      />
    </div>
  );
}
