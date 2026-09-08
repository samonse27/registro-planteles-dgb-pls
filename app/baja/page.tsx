"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, LoaderCircle, ShieldAlert, Trash2 } from "lucide-react";

type Plantel = {
  plantelId?: string;
  municipio?: string;
  nombrePlantel?: string;
  direccion?: string;
  codigoPostal?: string;
  activo?: boolean;
};

type MotivoBaja = "" | "Etapa 2" | "Baja definitiva" | "Otro";

export default function BajaPage() {
  const [planteles, setPlanteles] = useState<Plantel[]>([]);
  const [plantelId, setPlantelId] = useState("");
  const [motivo, setMotivo] = useState<MotivoBaja>("");
  const [otroMotivo, setOtroMotivo] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const token = typeof window === "undefined"
    ? ""
    : new URLSearchParams(window.location.search).get("token") ?? "";

  const plantelesActivos = useMemo(
    () => planteles.filter((plantel) => plantel.activo !== false),
    [planteles],
  );

  const plantelSeleccionado = useMemo(
    () => plantelesActivos.find((plantel) => plantel.plantelId === plantelId),
    [plantelesActivos, plantelId],
  );

  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await fetch("/api/planteles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (!response.ok || !data?.valido) {
          throw new Error(data?.mensaje || "No fue posible consultar los planteles.");
        }
        setPlanteles(Array.isArray(data.planteles) ? data.planteles : []);
      } catch (error) {
        setMensaje(error instanceof Error ? error.message : "No fue posible cargar los planteles.");
      } finally {
        setCargando(false);
      }
    };

    if (token) cargar();
    else {
      setMensaje("El enlace no contiene un token válido.");
      setCargando(false);
    }
  }, [token]);

  const seleccionarPlantel = (id: string) => {
    setPlantelId(id);
    setMotivo("");
    setOtroMotivo("");
    setConfirmado(false);
    setMostrarConfirmacion(false);
    setMensaje("");
  };

  const motivoCompleto = motivo && (motivo !== "Otro" || otroMotivo.trim());
  const puedeContinuar = Boolean(plantelSeleccionado && motivoCompleto && confirmado);

  const continuar = () => {
    if (!puedeContinuar) {
      setMensaje("Seleccione el plantel, indique el motivo y confirme la baja antes de continuar.");
      return;
    }
    setMensaje("");
    setMostrarConfirmacion(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const simulacionBaja = () => {
    setMensaje("La pantalla de baja quedó lista. En el siguiente paso conectaremos esta confirmación con Power Automate; todavía no se ha dado de baja ningún plantel.");
  };

  return (
    <main className="app-shell min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="brand-header">
          <div className="brand-mark"><span className="dgb-logo" role="img" aria-label="DGB" /></div>
          <div>
            <p className="eyebrow">Dirección General de Bachillerato</p>
            <h1>SOLICITUD DE BAJA</h1>
          </div>
        </header>

        <section className="form-card">
          <div className="panel">
            <div className="mb-7 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-950">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-700">
                  <ShieldAlert size={21} />
                </span>
                <div>
                  <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.12em] text-red-700">Acción sensible</p>
                  <h2 className="!m-0 !text-xl">Revise cuidadosamente el plantel seleccionado</h2>
                  <p className="mt-2 mb-0 leading-6 text-red-900/80">
                    La baja marcará el plantel como inactivo. El registro se conservará para mantener su historial.
                  </p>
                </div>
              </div>
            </div>

            <p className="eyebrow">Baja de plantel</p>
            <h2>Seleccione el plantel</h2>
            <p className="section-copy">Solo se muestran planteles vigentes. Al seleccionar uno, se resaltará en rojo para identificar claramente el registro que se dará de baja.</p>

            {cargando ? (
              <div className="consultation-state">
                <LoaderCircle className="loading-icon" size={34} />
                <p>Consultando planteles…</p>
              </div>
            ) : (
              <>
                <label>
                  Plantel <b>*</b>
                  <select value={plantelId} onChange={(e) => seleccionarPlantel(e.target.value)}>
                    <option value="">Seleccione un plantel</option>
                    {plantelesActivos.map((plantel, indice) => (
                      <option key={plantel.plantelId || indice} value={plantel.plantelId || ""}>
                        {plantel.municipio || "Sin municipio"} — {plantel.nombrePlantel || plantel.plantelId || "Sin nombre"}
                      </option>
                    ))}
                  </select>
                </label>

                {plantelSeleccionado && (
                  <article className="mt-6 rounded-2xl border-2 border-red-300 bg-red-50 p-5 shadow-[0_10px_30px_rgba(185,28,28,0.08)]">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.12em] text-red-700">Plantel seleccionado para baja</p>
                        <h3 className="m-0 text-xl font-bold text-red-950">{plantelSeleccionado.nombrePlantel?.trim() || "Sin nombre"}</h3>
                      </div>
                      <span className="rounded-full bg-red-700 px-3 py-1.5 text-xs font-extrabold text-white">SE DARÁ DE BAJA</span>
                    </div>

                    <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-red-200 bg-white/70 p-3"><dt className="text-xs font-bold uppercase tracking-wide text-red-700">Municipio</dt><dd className="mt-1 text-sm font-semibold text-red-950">{plantelSeleccionado.municipio || "Pendiente"}</dd></div>
                      <div className="rounded-xl border border-red-200 bg-white/70 p-3"><dt className="text-xs font-bold uppercase tracking-wide text-red-700">PlantelID</dt><dd className="mt-1 break-all text-sm font-semibold text-red-950">{plantelSeleccionado.plantelId || "Pendiente"}</dd></div>
                      <div className="rounded-xl border border-red-200 bg-white/70 p-3 md:col-span-2"><dt className="text-xs font-bold uppercase tracking-wide text-red-700">Dirección</dt><dd className="mt-1 text-sm font-semibold text-red-950">{plantelSeleccionado.direccion?.trim() || "Pendiente de completar"}</dd></div>
                      <div className="rounded-xl border border-red-200 bg-white/70 p-3"><dt className="text-xs font-bold uppercase tracking-wide text-red-700">Código Postal</dt><dd className="mt-1 text-sm font-semibold text-red-950">{plantelSeleccionado.codigoPostal?.trim() || "Pendiente"}</dd></div>
                      <div className="rounded-xl border border-red-200 bg-white/70 p-3"><dt className="text-xs font-bold uppercase tracking-wide text-red-700">Estado actual</dt><dd className="mt-1 text-sm font-bold text-red-950">Activo</dd></div>
                    </dl>
                  </article>
                )}

                {plantelSeleccionado && (
                  <div className="mt-7 grid gap-5">
                    <label>
                      Motivo de baja <b>*</b>
                      <select value={motivo} onChange={(e) => { setMotivo(e.target.value as MotivoBaja); setOtroMotivo(""); setMostrarConfirmacion(false); }}>
                        <option value="">Seleccione un motivo</option>
                        <option value="Etapa 2">Etapa 2</option>
                        <option value="Baja definitiva">Baja definitiva</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </label>

                    {motivo === "Otro" && (
                      <label>
                        Especifique el motivo <b>*</b>
                        <input value={otroMotivo} onChange={(e) => { setOtroMotivo(e.target.value); setMostrarConfirmacion(false); }} placeholder="Describa brevemente el motivo de la baja" />
                      </label>
                    )}

                    <button
                      type="button"
                      onClick={() => { setConfirmado((actual) => !actual); setMostrarConfirmacion(false); }}
                      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${confirmado ? "border-red-500 bg-red-50" : "border-[#dec3cd] bg-white hover:border-red-300"}`}
                      aria-pressed={confirmado}
                    >
                      <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border ${confirmado ? "border-red-700 bg-red-700 text-white" : "border-[#caa9b5] bg-white text-transparent"}`}><Check size={15} /></span>
                      <span>
                        <strong className="block text-sm text-[#56303e]">Confirmo que revisé el plantel seleccionado</strong>
                        <small className="mt-1 block leading-5 text-[#765966]">Entiendo que esta acción cambiará el plantel a inactivo y quedará registrada en el historial.</small>
                      </span>
                    </button>
                  </div>
                )}

                {mensaje && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800" role="alert">{mensaje}</div>}

                <div className="mt-9 flex items-center gap-3">
                  <button className="secondary-button" onClick={() => window.location.href = `/?token=${encodeURIComponent(token)}`}><ArrowLeft size={18} /> Volver</button>
                  <button className="ml-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-0 bg-red-700 px-5 py-2.5 font-bold text-white shadow-[0_7px_18px_rgba(185,28,28,0.2)] transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50" onClick={continuar} disabled={!plantelSeleccionado}>
                    <AlertTriangle size={18} /> Continuar a confirmación
                  </button>
                </div>

                {mostrarConfirmacion && plantelSeleccionado && (
                  <section className="mt-8 rounded-2xl border-2 border-red-500 bg-white p-6">
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-100 text-red-700"><Trash2 size={22} /></span>
                      <div>
                        <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.12em] text-red-700">Confirmación final</p>
                        <h3 className="m-0 text-xl font-bold text-red-950">Está por dar de baja este plantel</h3>
                      </div>
                    </div>
                    <div className="mt-5 rounded-xl bg-red-50 p-4 text-red-950">
                      <strong className="block">{plantelSeleccionado.nombrePlantel?.trim() || "Sin nombre"}</strong>
                      <span className="mt-1 block text-sm">{plantelSeleccionado.municipio || "Sin municipio"}</span>
                      <span className="mt-1 block text-sm"><b>Motivo:</b> {motivo === "Otro" ? otroMotivo.trim() : motivo}</span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[#765966]">Esta confirmación todavía no ejecuta la baja mientras configuramos el flujo de Power Automate.</p>
                    <div className="mt-5 flex justify-end">
                      <button type="button" onClick={simulacionBaja} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-0 bg-red-700 px-5 py-2.5 font-bold text-white hover:bg-red-800"><Trash2 size={18} /> Confirmar baja</button>
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
