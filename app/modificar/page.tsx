"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink, LoaderCircle, Send } from "lucide-react";

type Plantel = {
  plantelId?: string;
  municipio?: string;
  nombrePlantel?: string;
  direccion?: string;
  latitud?: string;
  longitud?: string;
  codigoPostal?: string;
  linkGoogleMaps?: string;
  aulasDidacticas?: string | number;
  capacidadPorAula?: string | number;
  capacidadInstalada?: string | number;
  computadoras?: string | number;
  agua?: boolean | null;
  luz?: boolean | null;
  internet?: boolean | null;
  drenaje?: boolean | null;
  equipoComputo?: boolean | null;
  laboratorio?: boolean | null;
  banos?: boolean | null;
  espacioAdministrativo?: boolean | null;
  movilidad?: string;
  horario?: string;
};

type FormularioPlantel = {
  nombrePlantel: string;
  direccionPlantel: string;
  latitud: string;
  longitud: string;
  codigoPostal: string;
  linkGoogleMaps: string;
  aulasDidacticas: string;
  capacidadPorAula: string;
  capacidadInstalada: string;
  computadoras: string;
  agua: boolean | null;
  luz: boolean | null;
  internet: boolean | null;
  drenaje: boolean | null;
  equipoComputo: boolean | null;
  laboratorio: boolean | null;
  banos: boolean | null;
  espacioAdministrativo: boolean | null;
  movilidad: string;
  horario: string;
};

const vacio: FormularioPlantel = {
  nombrePlantel: "",
  direccionPlantel: "",
  latitud: "",
  longitud: "",
  codigoPostal: "",
  linkGoogleMaps: "",
  aulasDidacticas: "",
  capacidadPorAula: "",
  capacidadInstalada: "",
  computadoras: "",
  agua: null,
  luz: null,
  internet: null,
  drenaje: null,
  equipoComputo: null,
  laboratorio: null,
  banos: null,
  espacioAdministrativo: null,
  movilidad: "",
  horario: "",
};

const texto = (valor: unknown) => valor === null || valor === undefined ? "" : String(valor);
const numeroOpcional = (valor: string) => valor.trim() === "" ? null : Number(valor);

const coordenadaValida = (valor: string, minimo: number, maximo: number) => {
  if (!valor.trim()) return true;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= minimo && numero <= maximo;
};

const errorEnlaceGoogleMaps = (valor: string) => {
  const enlace = valor.trim();
  if (!enlace) return "";
  if (enlace.length > 255) return "El enlace es demasiado largo. Use Compartir → Copiar vínculo en Google Maps.";
  try {
    const url = new URL(enlace);
    if (url.protocol !== "https:") return "El enlace debe comenzar con https://";
    const host = url.hostname.toLowerCase();
    const esGoogleMaps = host === "maps.app.goo.gl" || host === "goo.gl" || /^(www\.|maps\.)?google\.[a-z.]+$/.test(host);
    const rutaGoogleMaps = host.startsWith("maps.") || host === "maps.app.goo.gl" || host === "goo.gl" || url.pathname.includes("/maps");
    if (!esGoogleMaps || !rutaGoogleMaps) return "Pegue un enlace obtenido desde Google Maps.";
    return "";
  } catch {
    return "Pegue el enlace completo de Google Maps.";
  }
};

export default function ModificarPage() {
  const [planteles, setPlanteles] = useState<Plantel[]>([]);
  const [plantelId, setPlantelId] = useState("");
  const [formulario, setFormulario] = useState<FormularioPlantel>(vacio);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [mostrarErrores, setMostrarErrores] = useState(false);

  const token = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("token") ?? "";
  const plantelSeleccionado = useMemo(() => planteles.find((item) => item.plantelId === plantelId), [planteles, plantelId]);

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
    if (token) cargar();
    else {
      setMensaje("El enlace no contiene un token válido.");
      setCargando(false);
    }
  }, [token]);

  const seleccionarPlantel = (id: string) => {
    setPlantelId(id);
    setMensaje("");
    setMostrarErrores(false);
    const plantel = planteles.find((item) => item.plantelId === id);
    if (!plantel) {
      setFormulario(vacio);
      return;
    }
    setFormulario({
      nombrePlantel: texto(plantel.nombrePlantel),
      direccionPlantel: texto(plantel.direccion),
      latitud: texto(plantel.latitud),
      longitud: texto(plantel.longitud),
      codigoPostal: texto(plantel.codigoPostal),
      linkGoogleMaps: texto(plantel.linkGoogleMaps),
      aulasDidacticas: texto(plantel.aulasDidacticas),
      capacidadPorAula: texto(plantel.capacidadPorAula),
      capacidadInstalada: texto(plantel.capacidadInstalada),
      computadoras: texto(plantel.computadoras),
      agua: plantel.agua ?? null,
      luz: plantel.luz ?? null,
      internet: plantel.internet ?? null,
      drenaje: plantel.drenaje ?? null,
      equipoComputo: plantel.equipoComputo ?? null,
      laboratorio: plantel.laboratorio ?? null,
      banos: plantel.banos ?? null,
      espacioAdministrativo: plantel.espacioAdministrativo ?? null,
      movilidad: texto(plantel.movilidad),
      horario: texto(plantel.horario),
    });
  };

  const actualizar = <K extends keyof FormularioPlantel>(campo: K, valor: FormularioPlantel[K]) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  };

  const enviar = async () => {
    if (!plantelId) {
      setMensaje("Seleccione el plantel que desea actualizar.");
      return;
    }

    setMostrarErrores(true);
    if (!coordenadaValida(formulario.latitud, -90, 90)) {
      setMensaje("Revise la latitud antes de enviar la solicitud.");
      return;
    }
    if (!coordenadaValida(formulario.longitud, -180, 180)) {
      setMensaje("Revise la longitud antes de enviar la solicitud.");
      return;
    }
    if (formulario.codigoPostal.trim() && !/^[0-9]{5}$/.test(formulario.codigoPostal)) {
      setMensaje("El Código Postal debe contener 5 dígitos.");
      return;
    }
    if (errorEnlaceGoogleMaps(formulario.linkGoogleMaps)) {
      setMensaje(errorEnlaceGoogleMaps(formulario.linkGoogleMaps));
      return;
    }

    setEnviando(true);
    setMensaje("");
    try {
      const response = await fetch("/api/modificacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          tipoSolicitud: "Modificacion",
          plantelId,
          municipio: plantelSeleccionado?.municipio ?? "",
          nombrePlantel: formulario.nombrePlantel,
          direccionPlantel: formulario.direccionPlantel,
          latitud: formulario.latitud,
          longitud: formulario.longitud,
          codigoPostal: formulario.codigoPostal,
          linkGoogleMaps: formulario.linkGoogleMaps,
          aulasDidacticas: numeroOpcional(formulario.aulasDidacticas),
          capacidadPorAula: numeroOpcional(formulario.capacidadPorAula),
          capacidadInstalada: numeroOpcional(formulario.capacidadInstalada),
          computadoras: numeroOpcional(formulario.computadoras),
          agua: formulario.agua,
          luz: formulario.luz,
          internet: formulario.internet,
          drenaje: formulario.drenaje,
          equipoComputo: formulario.equipoComputo,
          laboratorio: formulario.laboratorio,
          banos: formulario.banos,
          espacioAdministrativo: formulario.espacioAdministrativo,
          movilidad: formulario.movilidad,
          horario: formulario.horario,
          motivo: "Actualización de datos del plantel",
          fechaSolicitud: new Date().toISOString(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.mensaje || "No fue posible enviar la solicitud.");
      setEnviado(true);
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No fue posible enviar la solicitud.");
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) return (
    <main className="app-shell flex min-h-screen items-center justify-center p-5">
      <section className="glass-card max-w-xl text-center">
        <div className="success-icon"><CheckCircle2 size={38} /></div>
        <p className="eyebrow">Solicitud enviada</p>
        <h1>Modificación registrada</h1>
        <p className="lead">Los nuevos datos quedaron enviados para revisión. El plantel vigente no fue modificado directamente.</p>
        <button className="secondary-button success-return" onClick={() => window.location.href = `/?token=${encodeURIComponent(token)}`}>Volver al menú</button>
      </section>
    </main>
  );

  return (
    <main className="app-shell min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="brand-header">
          <div className="brand-mark"><span className="dgb-logo" role="img" aria-label="DGB" /></div>
          <div><p className="eyebrow">Dirección General de Bachillerato</p><h1>SOLICITUD DE MODIFICACIÓN</h1></div>
        </header>

        <section className="form-card">
          <div className="panel">
            <p className="eyebrow">Actualizar información</p>
            <h2>Seleccione el plantel</h2>
            <p className="section-copy">Elija un plantel registrado. Sus datos actuales se cargarán automáticamente para que pueda modificar únicamente lo necesario. La base vigente no se modifica hasta que la solicitud sea revisada.</p>

            {cargando ? (
              <div className="consultation-state"><LoaderCircle className="loading-icon" size={34} /><p>Consultando planteles…</p></div>
            ) : (
              <>
                <label>Plantel <b>*</b>
                  <select value={plantelId} onChange={(e) => seleccionarPlantel(e.target.value)}>
                    <option value="">Seleccione un plantel</option>
                    {planteles.map((plantel, i) => (
                      <option key={plantel.plantelId || i} value={plantel.plantelId || ""}>
                        {plantel.municipio || "Sin municipio"} — {plantel.nombrePlantel || plantel.plantelId || "Sin nombre"}
                      </option>
                    ))}
                  </select>
                </label>

                {plantelId && (
                  <article className="plant-card">
                    <div className="plant-card-header">
                      <h3>Datos del plantel</h3>
                      <span>{plantelSeleccionado?.municipio || ""}</span>
                    </div>

                    <div className="field-grid">
                      <label>Nombre del plantel <span className="optional-label">Opcional</span><input value={formulario.nombrePlantel} onChange={(e) => actualizar("nombrePlantel", e.target.value)} /></label>
                      <label>Dirección del plantel <span className="optional-label">Opcional</span><input value={formulario.direccionPlantel} onChange={(e) => actualizar("direccionPlantel", e.target.value)} /></label>
                      <label>Latitud <span className="optional-label">Opcional</span><input type="number" min={-90} max={90} step="any" aria-invalid={mostrarErrores && !coordenadaValida(formulario.latitud, -90, 90)} value={formulario.latitud} onChange={(e) => actualizar("latitud", e.target.value)} placeholder="Ej. 19.432608" /><span className="field-error">Capture una latitud entre -90 y 90.</span></label>
                      <label>Longitud <span className="optional-label">Opcional</span><input type="number" min={-180} max={180} step="any" aria-invalid={mostrarErrores && !coordenadaValida(formulario.longitud, -180, 180)} value={formulario.longitud} onChange={(e) => actualizar("longitud", e.target.value)} placeholder="Ej. -99.133209" /><span className="field-error">Capture una longitud entre -180 y 180.</span></label>
                      <label>Código Postal <span className="optional-label">Opcional</span><input inputMode="numeric" maxLength={5} aria-invalid={mostrarErrores && Boolean(formulario.codigoPostal.trim()) && !/^[0-9]{5}$/.test(formulario.codigoPostal)} value={formulario.codigoPostal} onChange={(e) => actualizar("codigoPostal", e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="Ej. 06000" /><span className="field-error">Capture un Código Postal de 5 dígitos.</span></label>
                      <div className="wide maps-field">
                        <label>Enlace de Google Maps <span className="optional-label">Opcional</span>
                          <span className="field-help">Pegue el vínculo obtenido desde Compartir en Google Maps.</span>
                          <input type="url" aria-invalid={mostrarErrores && Boolean(errorEnlaceGoogleMaps(formulario.linkGoogleMaps))} value={formulario.linkGoogleMaps} onChange={(e) => actualizar("linkGoogleMaps", e.target.value)} onBlur={(e) => actualizar("linkGoogleMaps", e.target.value.trim())} placeholder="Ej. https://maps.app.goo.gl/..." />
                          {mostrarErrores && errorEnlaceGoogleMaps(formulario.linkGoogleMaps) && <span className="field-error visible">{errorEnlaceGoogleMaps(formulario.linkGoogleMaps)}</span>}
                        </label>
                        {formulario.linkGoogleMaps.trim() && !errorEnlaceGoogleMaps(formulario.linkGoogleMaps) && <a className="verify-link" href={formulario.linkGoogleMaps.trim()} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /> Verificar enlace</a>}
                      </div>
                      <label>Aulas didácticas <span className="optional-label">Opcional</span><input type="number" min="0" value={formulario.aulasDidacticas} onChange={(e) => actualizar("aulasDidacticas", e.target.value)} placeholder="Ej. 12" /></label>
                      <label>Capacidad por aula <span className="optional-label">Opcional</span><input type="number" min="0" value={formulario.capacidadPorAula} onChange={(e) => actualizar("capacidadPorAula", e.target.value)} placeholder="Ej. 30" /></label>
                      <label>Capacidad instalada <span className="optional-label">Opcional</span><input type="number" min="0" step="1" value={formulario.capacidadInstalada} onChange={(e) => actualizar("capacidadInstalada", e.target.value)} placeholder="Ej. 450" /></label>
                      <label>Computadoras <span className="optional-label">Opcional</span><input type="number" min="0" value={formulario.computadoras} onChange={(e) => actualizar("computadoras", e.target.value)} placeholder="Ej. 25" /></label>
                      <label>Movilidad <span className="optional-label">Opcional</span><input value={formulario.movilidad} onChange={(e) => actualizar("movilidad", e.target.value)} placeholder="Ej. transporte público" /></label>
                      <label>Horario <span className="optional-label">Opcional</span><input value={formulario.horario} onChange={(e) => actualizar("horario", e.target.value)} placeholder="Ej. 08:00 a 18:00" /></label>
                    </div>

                    <div className="switch-grid">
                      {([['agua','Agua'],['luz','Luz'],['internet','Internet'],['drenaje','Drenaje'],['equipoComputo','Aulas de cómputo'],['laboratorio','Laboratorio'],['banos','Baños'],['espacioAdministrativo','Espacio administrativo']] as const).map(([campo, etiqueta]) => (
                        <fieldset className="boolean-field" key={campo}>
                          <legend>{etiqueta} <span className="optional-label">Opcional</span></legend>
                          <div className="yes-no-options">
                            <button type="button" className={formulario[campo] === true ? "selected" : ""} aria-pressed={formulario[campo] === true} onClick={() => actualizar(campo, true)}>Sí</button>
                            <button type="button" className={formulario[campo] === false ? "selected" : ""} aria-pressed={formulario[campo] === false} onClick={() => actualizar(campo, false)}>No</button>
                          </div>
                        </fieldset>
                      ))}
                    </div>
                  </article>
                )}

                {mensaje && <div className="error-message" role="alert">{mensaje}</div>}
                <footer className="form-actions">
                  <button type="button" className="secondary-button" onClick={() => window.location.href = `/?token=${encodeURIComponent(token)}`}><ArrowLeft size={17} /> Volver al menú</button>
                  <div className="spacer" />
                  <button type="button" className="primary-button" disabled={enviando || !plantelId} onClick={enviar}>{enviando ? "Enviando…" : <><Send size={17} /> Enviar solicitud</>}</button>
                </footer>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
