"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import Boton from "@/components/ui/Boton";
import Campo from "@/components/ui/Campo";
import Entrada from "@/components/ui/Entrada";
import Alerta from "@/components/ui/Alerta";
import Modal from "@/components/ui/Modal";
import Captcha from "@/components/modules/auth/Captcha";
import { useSesion } from "@/context/SesionContext";

export default function PaginaLoginAdmin() {
  const { sesion, iniciarSesion } = useSesion();
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [captchaTicket, setCaptchaTicket] = useState("");
  const [versionCaptcha, setVersionCaptcha] = useState(0);
  const [mostrarModalCaptcha, setMostrarModalCaptcha] = useState(false);

  useEffect(() => {
    if (sesion) router.replace("/panel");
  }, [sesion, router]);

  async function realizarLogin(ticketUsar) {
    const ticket = ticketUsar || captchaTicket;
    if (!ticket) return;
    setCargando(true);
    setError("");
    try {
      await iniciarSesion({ correo, contrasena, captcha: ticket });
      toast.success("Acceso administrativo concedido.");
      router.replace("/panel");
    } catch (err) {
      setError(err.message);
      setCaptchaTicket("");
      setVersionCaptcha((valor) => valor + 1);
    } finally {
      setCargando(false);
    }
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError("");
    if (!correo.trim() || !contrasena) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    if (!captchaTicket) {
      setMostrarModalCaptcha(true);
      return;
    }
    await realizarLogin(captchaTicket);
  }

  return (
    <div className="animar-entrada">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
        <ShieldCheck className="h-3.5 w-3.5" />
        Acceso administrativo
      </span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--texto)]">
        Inicia sesión
      </h1>
      <p className="mt-2 text-sm text-[var(--texto-suave)]">
        Solo la cuenta administradora puede acceder a esta consola.
      </p>

      <form onSubmit={enviar} className="mt-8 space-y-4">
        {error ? <Alerta tipo="error">{error}</Alerta> : null}

        <Campo etiqueta="Correo del administrador" requerido>
          <Entrada
            type="email"
            value={correo}
            onChange={(evento) => setCorreo(evento.target.value)}
            placeholder="admin@inventaven.com"
            autoComplete="email"
            required
          />
        </Campo>

        <Campo etiqueta="Contraseña" requerido>
          <div className="relative">
            <Entrada
              type={verClave ? "text" : "password"}
              value={contrasena}
              onChange={(evento) => setContrasena(evento.target.value)}
              placeholder="Tu contraseña"
              className="pr-10"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setVerClave((valor) => !valor)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--texto-suave)] hover:bg-[var(--superficie-3)]"
              aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {verClave ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Campo>

        <Boton type="submit" cargando={cargando} className="w-full" tamano="lg">
          Entrar a la consola
          <ArrowRight className="h-4 w-4" />
        </Boton>
      </form>

      <Modal
        abierto={mostrarModalCaptcha}
        onCerrar={() => setMostrarModalCaptcha(false)}
        titulo="Verificación de seguridad"
        descripcion="Resuelve la verificación para continuar con tu acceso administrativo."
        ancho="sm"
      >
        <Captcha
          key={versionCaptcha}
          onTicket={async (ticket) => {
            if (ticket) {
              setCaptchaTicket(ticket);
              setMostrarModalCaptcha(false);
              await realizarLogin(ticket);
            }
          }}
          disabled={cargando}
        />
      </Modal>

      <p className="mt-8 text-center text-[11px] leading-relaxed text-[var(--texto-tenue)]">
        Los inicios de sesión no autorizados son rechazados automáticamente.
      </p>
    </div>
  );
}
