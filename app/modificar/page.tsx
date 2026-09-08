"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, LoaderCircle, Send } from "lucide-react";

type Plantel = { plantelId?: string; municipio?: string; nombrePlantel?: string };

export default function ModificarPage() {
  const [planteles, setPlanteles] = useState<Plantel[]>([]);
  const [plantelId, setPlantelId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [enviado, setEnviado] = useState(false);

  const token = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("token") ?? "";

  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await fetch("/api/planteles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (!response.ok || !data?.valido) throw new Error(data?.mensaje || "No fue posible consultar los planteles.");
        setPlanteles(Array.isArray(data.planteles) ? data.planteles : []);
      } catch (error) {
        setMensaje(error instanceof Error ? error.message : "No fue posible cargar los planteles.");
      } finally {
        setCargando(false);
      }
    };
    if (token) cargar(); else { setMensaje("El enlace no contiene un token válido."); setCargando(false); }
  }, [token]);

  const enviar = async () => {
    if (!plantelId || !motivo.trim()) { setMensaje("Seleccione un plantel y explique qué información necesita modificar."); return; }
    const plantel = planteles.find((item) => item.plantelId === plantelId);
    setEnviando(true); setMensaje("");
    try {
      const response = await fetch("/api/modificacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          tipoSolicitud: "Modificacion",
          plantelId,
          municipio: plantel?.municipio ?? "",
          nombrePlantel: plantel?.nombrePlantel ?? "",
          motivo: motivo.trim(),
          fechaSolicitud: new Date().toISOString(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.mensaje || "No fue posible enviar la solicitud.");
      setEnviado(true);
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No fue posible enviar la solicitud.");
    } finally { setEnviando(false); }
  };

  if (enviado) return <main className="app-shell flex min-h-screen items-center justify-center p-5"><section className="glass-card max-w-xl text-center"><div className="success-icon"><CheckCircle2 size={38} /></div><p className="eyebrow">Solicitud enviada</p><h1>Modificación registrada</h1><p className="lead">La solicitud quedó enviada para su revisión. El plantel original no fue modificado directamente.</p><button className="secondary-button success-return" onClick={() => window.location.href = `/?token=${encodeURIComponent(token)}`}>Volver al menú</button></section></main>;

  return <main className="app-shell min-h-screen px-4 py-8 md:px-8"><div className="mx-auto max-w-4xl"><header className="brand-header"><div className="brand-mark"><span className="dgb-logo" role="img" aria-label="DGB" /></div><div><p className="eyebrow">Dirección General de Bachillerato</p><h1>SOLICITUD DE MODIFICACIÓN</h1></div></header><section className="form-card"><div className="panel narrow-panel"><p className="eyebrow">Actualizar información</p><h2>Seleccione el plantel</h2><p className="section-copy">Elija un plantel registrado y describa claramente qué información requiere actualizar. La base vigente no se modifica hasta que la solicitud sea revisada.</p>{cargando ? <div className="consultation-state"><LoaderCircle className="loading-icon" size={34} /><p>Consultando planteles…</p></div> : <><label>Plantel <b>*</b><select value={plantelId} onChange={(e) => setPlantelId(e.target.value)}><option value="">Seleccione un plantel</option>{planteles.map((plantel, i) => <option key={plantel.plantelId || i} value={plantel.plantelId || ""}>{plantel.municipio || "Sin municipio"} — {plantel.nombrePlantel || plantel.plantelId || "Sin nombre"}</option>)}</select></label><label>Información que desea modificar <b>*</b><textarea rows={7} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. Cambiar la dirección del plantel a..., actualizar la capacidad instalada a..., etc." /></label>{mensaje && <div className="error-message" role="alert">{mensaje}</div>}<footer className="form-actions"><button type="button" className="secondary-button" onClick={() => window.location.href = `/?token=${encodeURIComponent(token)}`}><ArrowLeft size={17} /> Volver al menú</button><div className="spacer"/><button type="button" className="primary-button" disabled={enviando} onClick={enviar}>{enviando ? "Enviando…" : <><Send size={17}/> Enviar solicitud</>}</button></footer></>}</div></section></div></main>;
}
