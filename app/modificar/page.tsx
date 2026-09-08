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
  nombrePlantel: "", direccionPlantel: "", latitud: "", longitud: "", codigoPostal: "", linkGoogleMaps: "",
  aulasDidacticas: "", capacidadPorAula: "", capacidadInstalada: "", computadoras: "", agua: null, luz: null,
  internet: null, drenaje: null, equipoComputo: null, laboratorio: null, banos: null, espacioAdministrativo: null,
  movilidad: "", horario: "",
};

const texto = (valor: unknown) => valor === null || valor === undefined ? "" : String(valor);
const numeroOpcional = (valor: string) => valor.trim() === "" ? null : Number(valor);
const textoComparable = (valor: unknown) => texto(valor).trim();
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
  } catch { return "Pegue el enlace completo de Google Maps."; }
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
        const response = await fetch("/api/planteles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
        const data = await response.json();
        if (!response.ok || !data?.valido) throw new Error(data?.mensaje || "No fue posible consultar los planteles.");
        setPlanteles(Array.isArray(data.planteles) ? data.planteles : []);
      } catch (error) { setMensaje(error instanceof Error ? error.message : "No fue posible cargar los planteles."); }
      finally { setCargando(false); }
    };
    if (token) cargar(); else { setMensaje("El enlace no contiene un token válido."); setCargando(false); }
  }, [token]);

  const seleccionarPlantel = (id: string) => {
    setPlantelId(id); setMensaje(""); setMostrarErrores(false);
    const plantel = planteles.find((item) => item.plantelId === id);
    if (!plantel) { setFormulario(vacio); return; }
    setFormulario({
      nombrePlantel: texto(plantel.nombrePlantel), direccionPlantel: texto(plantel.direccion), latitud: texto(plantel.latitud), longitud: texto(plantel.longitud), codigoPostal: texto(plantel.codigoPostal), linkGoogleMaps: texto(plantel.linkGoogleMaps), aulasDidacticas: texto(plantel.aulasDidacticas), capacidadPorAula: texto(plantel.capacidadPorAula), capacidadInstalada: texto(plantel.capacidadInstalada), computadoras: texto(plantel.computadoras), agua: plantel.agua ?? null, luz: plantel.luz ?? null, internet: plantel.internet ?? null, drenaje: plantel.drenaje ?? null, equipoComputo: plantel.equipoComputo ?? null, laboratorio: plantel.laboratorio ?? null, banos: plantel.banos ?? null, espacioAdministrativo: plantel.espacioAdministrativo ?? null, movilidad: texto(plantel.movilidad), horario: texto(plantel.horario),
    });
  };
  const actualizar = <K extends keyof FormularioPlantel>(campo: K, valor: FormularioPlantel[K]) => setFormulario((actual) => ({ ...actual, [campo]: valor }));
  const obtenerCamposModificados = () => {
    if (!plantelSeleccionado) return [] as string[];
    const cambios: string[] = [];
    const compararTexto = (actual: unknown, nuevo: unknown, etiqueta: string) => { if (textoComparable(actual) !== textoComparable(nuevo)) cambios.push(etiqueta); };
    const compararBooleano = (actual: boolean | null | undefined, nuevo: boolean | null, etiqueta: string) => { if ((actual ?? null) !== nuevo) cambios.push(etiqueta); };
    compararTexto(plantelSeleccionado.nombrePlantel, formulario.nombrePlantel, "Nombre del plantel"); compararTexto(plantelSeleccionado.direccion, formulario.direccionPlantel, "Dirección del plantel"); compararTexto(plantelSeleccionado.latitud, formulario.latitud, "Latitud"); compararTexto(plantelSeleccionado.longitud, formulario.longitud, "Longitud"); compararTexto(plantelSeleccionado.codigoPostal, formulario.codigoPostal, "Código Postal"); compararTexto(plantelSeleccionado.linkGoogleMaps, formulario.linkGoogleMaps, "Enlace de Google Maps"); compararTexto(plantelSeleccionado.aulasDidacticas, formulario.aulasDidacticas, "Aulas didácticas"); compararTexto(plantelSeleccionado.capacidadPorAula, formulario.capacidadPorAula, "Capacidad por aula"); compararTexto(plantelSeleccionado.capacidadInstalada, formulario.capacidadInstalada, "Capacidad instalada"); compararTexto(plantelSeleccionado.computadoras, formulario.computadoras, "Computadoras"); compararBooleano(plantelSeleccionado.agua, formulario.agua, "Agua"); compararBooleano(plantelSeleccionado.luz, formulario.luz, "Luz"); compararBooleano(plantelSeleccionado.internet, formulario.internet, "Internet"); compararBooleano(plantelSeleccionado.drenaje, formulario.drenaje, "Drenaje"); compararBooleano(plantelSeleccionado.equipoComputo, formulario.equipoComputo, "Aulas de cómputo"); compararBooleano(plantelSeleccionado.laboratorio, formulario.laboratorio, "Laboratorio"); compararBooleano(plantelSeleccionado.banos, formulario.banos, "Baños"); compararBooleano(plantelSeleccionado.espacioAdministrativo, formulario.espacioAdministrativo, "Espacio administrativo"); compararTexto(plantelSeleccionado.movilidad, formulario.movilidad, "Movilidad"); compararTexto(plantelSeleccionado.horario, formulario.horario, "Horario");
    return cambios;
  };

  const enviar = async () => {
    if (!plantelId) { setMensaje("Seleccione el plantel que desea actualizar."); return; }
    setMostrarErrores(true);
    if (!coordenadaValida(formulario.latitud, -90, 90)) { setMensaje("Revise la latitud antes de enviar la solicitud."); return; }
    if (!coordenadaValida(formulario.longitud, -180, 180)) { setMensaje("Revise la longitud antes de enviar la solicitud."); return; }
    if (formulario.codigoPostal.trim() && !/^[0-9]{5}$/.test(formulario.codigoPostal)) { setMensaje("El Código Postal debe contener 5 dígitos."); return; }
    if (errorEnlaceGoogleMaps(formulario.linkGoogleMaps)) { setMensaje(errorEnlaceGoogleMaps(formulario.linkGoogleMaps)); return; }
    const camposModificados = obtenerCamposModificados();
    if (camposModificados.length === 0) { setMensaje("No se detectaron cambios en la información del plantel."); return; }
    setEnviando(true); setMensaje("");
    try {
      const response = await fetch("/api/modificacion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, tipoSolicitud: "Modificacion", plantelId, municipio: plantelSeleccionado?.municipio ?? "", nombrePlantel: formulario.nombrePlantel, direccionPlantel: formulario.direccionPlantel, latitud: formulario.latitud, longitud: formulario.longitud, codigoPostal: formulario.codigoPostal, linkGoogleMaps: formulario.linkGoogleMaps, aulasDidacticas: numeroOpcional(formulario.aulasDidacticas), capacidadPorAula: numeroOpcional(formulario.capacidadPorAula), capacidadInstalada: numeroOpcional(formulario.capacidadInstalada), computadoras: numeroOpcional(formulario.computadoras), agua: formulario.agua, luz: formulario.luz, internet: formulario.internet, drenaje: formulario.drenaje, equipoComputo: formulario.equipoComputo, laboratorio: formulario.laboratorio, banos: formulario.banos, espacioAdministrativo: formulario.espacioAdministrativo, movilidad: formulario.movilidad, horario: formulario.horario, motivo: "Actualización de datos del plantel", camposModificados: camposModificados.join(", "), fechaSolicitud: new Date().toISOString() }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.mensaje || "No fue posible enviar la solicitud.");
      setEnviado(true);
    } catch (error) { setMensaje(error instanceof Error ? error.message : "No fue posible enviar la solicitud."); }
    finally { setEnviando(false); }
  };

  if (enviado) return (
    <main className="app-shell flex min-h-screen items-center justify-center p-5"><section className="glass-card max-w-xl text-center"><div className="success-icon"><CheckCircle2 size={38} /></div><p className="eyebrow">Solicitud enviada</p><h1>Modificación registrada</h1><p className="lead">Tus datos se han registrado correctamente.</p><button className="secondary-button success-return" onClick={() => window.location.href = `/?token=${encodeURIComponent(token)}`}>Volver al menú</button></section></main>
  );

  return (
    <main className="app-shell min-h-screen px-4 py-8 md:px-8"><div className="mx-auto max-w-5xl"><header className="brand-header"><div className="brand-mark"><span className="dgb-logo" role="img" aria-label="DGB" /></div><div><p className="eyebrow">Dirección General de Bachillerato</p><h1>SOLICITUD DE MODIFICACIÓN</h1></div></header><section className="form-card"><div className="panel"><p className="eyebrow">Actualizar información</p><h2>Seleccione el plantel</h2><p className="section-copy">Elija un plantel registrado. Sus datos actuales se cargarán automáticamente para que pueda modificar únicamente lo necesario.</p>
    {cargando ? <div className="consultation-state"><LoaderCircle className="loading-icon" size={34} /><p>Consultando planteles…</p></div> : <><label>Plantel <b>*</b><select value={plantelId} onChange={(e) => seleccionarPlantel(e.target.value)}><option value="">Seleccione un plantel</option>{planteles.map((plantel, i) => <option key={plantel.plantelId || i} value={plantel.plantelId || ""}>{plantel.municipio || "Sin municipio"} — {plantel.nombrePlantel || plantel.plantelId || "Sin nombre"}</option>)}</select></label>
    {plantelId && <article className="plant-card"><div className="plant-card-header"><h3>Datos del plantel</h3><span>{plantelSeleccionado?.municipio || ""}</span></div><div className="form-grid"><label>Nombre del plantel<input value={formulario.nombrePlantel} onChange={(e) => actualizar("nombrePlantel", e.target.value)} /></label><label>Dirección del plantel<input value={formulario.direccionPlantel} onChange={(e) => actualizar("direccionPlantel", e.target.value)} /></label><label>Latitud<input value={formulario.latitud} onChange={(e) => actualizar("latitud", e.target.value)} />{mostrarErrores && !coordenadaValida(formulario.latitud, -90, 90) && <small className="field-error">Ingrese una latitud entre -90 y 90.</small>}</label><label>Longitud<input value={formulario.longitud} onChange={(e) => actualizar("longitud", e.target.value)} />{mostrarErrores && !coordenadaValida(formulario.longitud, -180, 180) && <small className="field-error">Ingrese una longitud entre -180 y 180.</small>}</label><label>Código Postal<input value={formulario.codigoPostal} maxLength={5} onChange={(e) => actualizar("codigoPostal", e.target.value.replace(/\D/g, ""))} />{mostrarErrores && formulario.codigoPostal.trim() !== "" && !/^[0-9]{5}$/.test(formulario.codigoPostal) && <small className="field-error">Debe contener 5 dígitos.</small>}</label><label>Enlace de Google Maps<input value={formulario.linkGoogleMaps} onChange={(e) => actualizar("linkGoogleMaps", e.target.value)} />{formulario.linkGoogleMaps && !errorEnlaceGoogleMaps(formulario.linkGoogleMaps) && <a className="inline-link" href={formulario.linkGoogleMaps} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Abrir mapa</a>}{mostrarErrores && errorEnlaceGoogleMaps(formulario.linkGoogleMaps) && <small className="field-error">{errorEnlaceGoogleMaps(formulario.linkGoogleMaps)}</small>}</label><label>Aulas didácticas<input type="number" min="0" value={formulario.aulasDidacticas} onChange={(e) => actualizar("aulasDidacticas", e.target.value)} /></label><label>Capacidad por aula<input type="number" min="0" value={formulario.capacidadPorAula} onChange={(e) => actualizar("capacidadPorAula", e.target.value)} /></label><label>Capacidad instalada<input type="number" min="0" value={formulario.capacidadInstalada} onChange={(e) => actualizar("capacidadInstalada", e.target.value)} /></label><label>Computadoras<input type="number" min="0" value={formulario.computadoras} onChange={(e) => actualizar("computadoras", e.target.value)} /></label><label>Movilidad<input value={formulario.movilidad} onChange={(e) => actualizar("movilidad", e.target.value)} /></label><label>Horario<input value={formulario.horario} onChange={(e) => actualizar("horario", e.target.value)} /></label></div><div className="switch-grid">{([['agua','Agua'],['luz','Luz'],['internet','Internet'],['drenaje','Drenaje'],['equipoComputo','Aulas de cómputo'],['laboratorio','Laboratorio'],['banos','Baños'],['espacioAdministrativo','Espacio administrativo']] as const).map(([campo, etiqueta]) => (<fieldset className="boolean-field" key={campo}><legend>{etiqueta} <span className="optional-label">Opcional</span></legend><div className="yes-no-options"><button type="button" className={formulario[campo] === true ? "selected" : ""} aria-pressed={formulario[campo] === true} onClick={() => actualizar(campo, true)}>Sí</button><button type="button" className={formulario[campo] === false ? "selected" : ""} aria-pressed={formulario[campo] === false} onClick={() => actualizar(campo, false)}>No</button></div></fieldset>))}</div></article>}
    {mensaje && <p className="status-message">{mensaje}</p>}<div className="action-row"><button className="secondary-button" onClick={() => window.location.href = `/?token=${encodeURIComponent(token)}`}><ArrowLeft size={18} /> Volver</button><button className="primary-button" onClick={enviar} disabled={enviando || cargando || !plantelId}>{enviando ? <><LoaderCircle className="loading-icon" size={18} /> Enviando...</> : <><Send size={18} /> Registrar modificación</>}</button></div></>}</div></section></div></main>
  );
}
