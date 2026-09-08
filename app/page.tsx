"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, ChevronDown, ClipboardPlus, ExternalLink, FilePenLine, HelpCircle, LoaderCircle, MapPin, Plus, Search, Send, Trash2, X } from "lucide-react";

type MunicipioPermitido = { clave: string; nombre: string };
type Acceso = {
  correo: string;
  estado: { clave: string; nombre: string };
  municipios: MunicipioPermitido[];
};
type Vista = "menu" | "agregar" | "consultar" | "modificar" | "baja";
type PlantelConsulta = {
  plantelId?: string; municipio?: string; nombrePlantel?: string; direccion?: string;
  latitud?: string; longitud?: string; codigoPostal?: string; linkGoogleMaps?: string;
  aulasDidacticas?: string | number; capacidadPorAula?: string | number;
  capacidadInstalada?: string | number; computadoras?: string | number;
  agua?: boolean | null; luz?: boolean | null; internet?: boolean | null; drenaje?: boolean | null;
  equipoComputo?: boolean | null; laboratorio?: boolean | null; banos?: boolean | null;
  espacioAdministrativo?: boolean | null; movilidad?: string; horario?: string;
  activo?: boolean; fechaActualizacion?: string; motivoActual?: string;
  estadoRevision?: string; versionActual?: string | number;
};

type Plantel = {
  id: string; nombre: string; direccion: string; latitud: string; longitud: string;
  linkGoogleMaps: string; aulasDidacticas: string; capacidadPorAula: string;
  computadoras: string; codigoPostal: string; capacidadInstalada: string;
  banos: boolean | null; espacioAdministrativo: boolean | null;
  agua: boolean | null; luz: boolean | null; internet: boolean | null;
  drenaje: boolean | null; equipoComputo: boolean | null; laboratorio: boolean | null;
  movilidad: string; horario: string;
};

const nuevoPlantel = (): Plantel => ({
  id: crypto.randomUUID(), nombre: "", direccion: "", latitud: "", longitud: "",
  linkGoogleMaps: "", aulasDidacticas: "", capacidadPorAula: "", computadoras: "",
  codigoPostal: "", capacidadInstalada: "",
  banos: null, espacioAdministrativo: null,
  agua: null, luz: null, internet: null, drenaje: null, equipoComputo: null,
  laboratorio: null, movilidad: "", horario: "",
});

const PASOS = ["Responsable", "Municipios", "Planteles", "Revisión"];

const respuestaSiNo = (valor: boolean | null) => valor === true ? "Sí" : valor === false ? "No" : "Sin respuesta";
const mostrarValor = (valor: string) => valor.trim() || "Pendiente de completar";
const numeroOpcional = (valor: string) => valor.trim() === "" ? null : Number(valor);

const coordenadaValida = (valor: string, minimo: number, maximo: number) => {
  if (!valor.trim()) return false;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= minimo && numero <= maximo;
};

const errorEnlaceGoogleMaps = (valor: string) => {
  const enlace = valor.trim();
  if (!enlace) return "Falta pegar el enlace de Google Maps.";
  if (enlace.length > 255) return "El enlace es demasiado largo. En Google Maps seleccione Compartir y después Copiar vínculo.";
  try {
    const url = new URL(enlace);
    if (url.protocol !== "https:") return "El enlace debe comenzar con https://";
    const host = url.hostname.toLowerCase();
    const esGoogleMaps = host === "maps.app.goo.gl" || host === "goo.gl" || /^(www\.|maps\.)?google\.[a-z.]+$/.test(host);
    const rutaGoogleMaps = host.startsWith("maps.") || host === "maps.app.goo.gl" || host === "goo.gl" || url.pathname.includes("/maps");
    if (!esGoogleMaps || !rutaGoogleMaps) return "Pegue un enlace obtenido desde Google Maps, no el domicilio del plantel.";
    return "";
  } catch {
    return "Pegue el enlace completo de Google Maps; debe comenzar con https://";
  }
};

export default function Home() {
  const [acceso, setAcceso] = useState<Acceso | null>(null);
  const [cargandoAcceso, setCargandoAcceso] = useState(true);
  const [errorAcceso, setErrorAcceso] = useState("");
  const [vista, setVista] = useState<Vista>("menu");
  const [paso, setPaso] = useState(0);
  const [nombreResponsable, setNombreResponsable] = useState("");
  const [correoResponsable, setCorreoResponsable] = useState("");
  const [estado, setEstado] = useState("");
  const [busquedaMunicipio, setBusquedaMunicipio] = useState("");
  const [planteles, setPlanteles] = useState<Record<string, Plantel[]>>({});
  const [municipioActivo, setMunicipioActivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [finalizado, setFinalizado] = useState(false);
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [plantelesConsulta, setPlantelesConsulta] = useState<PlantelConsulta[]>([]);
  const [cargandoConsulta, setCargandoConsulta] = useState(false);
  const [errorConsulta, setErrorConsulta] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token")?.trim() ?? "";
    if (!token) {
      setErrorAcceso("Este enlace no contiene una clave de acceso válida.");
      setCargandoAcceso(false);
      return;
    }
    const validar = async () => {
      try {
        const response = await fetch("/api/access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (!response.ok || !data?.valido) throw new Error(data?.mensaje || "El enlace no es válido.");
        setAcceso({ correo: data.correo, estado: data.estado, municipios: data.municipios ?? [] });
        setCorreoResponsable(data.correo);
        setEstado(data.estado.clave);
      } catch (error) {
        setErrorAcceso(error instanceof Error ? error.message : "No fue posible validar el enlace.");
      } finally {
        setCargandoAcceso(false);
      }
    };
    validar();
  }, []);

  useEffect(() => {
    if (vista !== "consultar" || !acceso) return;
    const consultar = async () => {
      setCargandoConsulta(true);
      setErrorConsulta("");
      try {
        const token = new URLSearchParams(window.location.search).get("token");
        const response = await fetch("/api/planteles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (!response.ok || !data?.valido) throw new Error(data?.mensaje || "No fue posible consultar los planteles.");
        setPlantelesConsulta(Array.isArray(data.planteles) ? data.planteles : []);
      } catch (error) {
        setErrorConsulta(error instanceof Error ? error.message : "No fue posible consultar los planteles.");
      } finally {
        setCargandoConsulta(false);
      }
    };
    consultar();
  }, [vista, acceso]);

  const opcionesMunicipios = useMemo(() => acceso?.municipios.map((item) => item.nombre) ?? [], [acceso]);
  const claveMunicipio = useMemo(
    () => new Map(acceso?.municipios.map((item) => [item.nombre, item.clave]) ?? []),
    [acceso],
  );
  const municipios = useMemo(() => Object.keys(planteles), [planteles]);
  const municipiosFiltrados = useMemo(() => {
    const consulta = busquedaMunicipio.trim().toLocaleLowerCase("es-MX");
    if (!consulta) return opcionesMunicipios;
    return opcionesMunicipios.filter((municipio) =>
      municipio.toLocaleLowerCase("es-MX").includes(consulta),
    );
  }, [busquedaMunicipio, opcionesMunicipios]);
  const cantidadPlanteles = Object.values(planteles).reduce((total, lista) => total + lista.length, 0);
  const consultaPorMunicipio = useMemo(() => plantelesConsulta.reduce<Record<string, PlantelConsulta[]>>((grupos, plantel) => {
    const municipio = plantel.municipio?.trim() || "Municipio pendiente";
    (grupos[municipio] ??= []).push(plantel);
    return grupos;
  }, {}), [plantelesConsulta]);

  const alternarMunicipio = (municipio: string) => {
    setPlanteles((actuales) => {
      const copia = { ...actuales };
      if (Object.hasOwn(copia, municipio)) delete copia[municipio];
      else copia[municipio] = [nuevoPlantel()];
      return copia;
    });
  };

  const actualizarPlantel = <K extends keyof Plantel>(municipio: string, id: string, campo: K, valor: Plantel[K]) => {
    setPlanteles((actuales) => ({
      ...actuales,
      [municipio]: actuales[municipio].map((plantel) => plantel.id === id ? { ...plantel, [campo]: valor } : plantel),
    }));
  };

  const agregarPlantel = (municipio: string) => setPlanteles((actuales) => ({
    ...actuales, [municipio]: [...(actuales[municipio] ?? []), nuevoPlantel()],
  }));

  const eliminarPlantel = (municipio: string, id: string) => setPlanteles((actuales) => ({
    ...actuales, [municipio]: actuales[municipio].filter((plantel) => plantel.id !== id),
  }));

  const plantelCompleto = (plantel: Plantel) => Boolean(
    (!plantel.latitud.trim() || coordenadaValida(plantel.latitud, -90, 90)) &&
    (!plantel.longitud.trim() || coordenadaValida(plantel.longitud, -180, 180)) &&
    (!plantel.codigoPostal.trim() || /^[0-9]{5}$/.test(plantel.codigoPostal)) &&
    (!plantel.linkGoogleMaps.trim() || !errorEnlaceGoogleMaps(plantel.linkGoogleMaps))
  );

  const municipioCompleto = (municipio: string) =>
    Boolean(planteles[municipio]?.length > 0 && planteles[municipio].every(plantelCompleto));

  const puedeContinuar = () => {
    if (paso === 0) return nombreResponsable.trim() && correoResponsable.includes("@");
    if (paso === 1) return estado && municipios.length > 0;
    if (paso === 2) return municipioActivo && municipioCompleto(municipioActivo);
    return true;
  };

  const avanzar = () => {
    setMensaje("");
    setMostrarErrores(true);
    if (!puedeContinuar()) {
      setMensaje("Revise los campos señalados antes de continuar.");
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }
    setMostrarErrores(false);
    if (paso === 1) {
      if (!municipioActivo) setMunicipioActivo(municipios[0]);
      setPaso(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (paso === 2) {
      const indiceActual = municipios.indexOf(municipioActivo);
      if (indiceActual < municipios.length - 1) {
        setMunicipioActivo(municipios[indiceActual + 1]);
        setMostrarErrores(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const municipioIncompleto = municipios.find((municipio) => !municipioCompleto(municipio));
      if (municipioIncompleto) {
        setMunicipioActivo(municipioIncompleto);
        setMostrarErrores(true);
        setMensaje(`Complete la información de ${municipioIncompleto} antes de revisar el registro.`);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }
    setPaso((actual) => Math.min(actual + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const enviar = async () => {
    if (paso !== 3) return;
    setEnviando(true); setMensaje("");
    try {
      const respuesta = await fetch("/api/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreResponsable, correoResponsable,
          token: new URLSearchParams(window.location.search).get("token"),
          tipoSolicitud: "Alta",
          estado: acceso?.estado,
          municipios: municipios.map((municipio) => ({
            clave: claveMunicipio.get(municipio),
            nombre: municipio,
            planteles: planteles[municipio].map((plantel) => ({
              nombrePlantel: plantel.nombre,
              direccionPlantel: plantel.direccion,
              latitud: plantel.latitud,
              longitud: plantel.longitud,
              codigoPostal: plantel.codigoPostal,
              linkGoogleMaps: plantel.linkGoogleMaps,
              aulasDidacticas: numeroOpcional(plantel.aulasDidacticas),
              capacidadPorAula: numeroOpcional(plantel.capacidadPorAula),
              capacidadInstalada: numeroOpcional(plantel.capacidadInstalada),
              computadoras: numeroOpcional(plantel.computadoras),
              agua: plantel.agua,
              luz: plantel.luz,
              internet: plantel.internet,
              drenaje: plantel.drenaje,
              equipoComputo: plantel.equipoComputo,
              laboratorio: plantel.laboratorio,
              banos: plantel.banos,
              espacioAdministrativo: plantel.espacioAdministrativo,
              movilidad: plantel.movilidad,
              horario: plantel.horario,
            })),
          })),
          fechaRegistro: new Date().toISOString(),
        }),
      });
      if (!respuesta.ok) throw new Error("No se pudo enviar el registro. La conexión aún no está configurada.");
      setFinalizado(true);
    } catch (error) { setMensaje(error instanceof Error ? error.message : "Ocurrió un error inesperado."); }
    finally { setEnviando(false); }
  };

  const editarMunicipio = (municipio: string) => {
    setMunicipioActivo(municipio);
    setMostrarErrores(false);
    setMensaje("");
    setPaso(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const volverAlMenu = () => {
    setVista("menu");
    setPaso(0);
    setMensaje("");
    setMostrarErrores(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (cargandoAcceso) return (
    <main className="app-shell flex min-h-screen items-center justify-center p-5">
      <section className="glass-card access-state" aria-live="polite">
        <LoaderCircle className="loading-icon" size={42} />
        <p className="eyebrow">Portal de planteles PLS</p>
        <h1>Validando acceso</h1>
        <p className="lead">Estamos comprobando su enlace seguro.</p>
      </section>
    </main>
  );

  if (!acceso) return (
    <main className="app-shell flex min-h-screen items-center justify-center p-5">
      <section className="glass-card access-state">
        <div className="access-error"><X size={34} /></div>
        <p className="eyebrow">Acceso no disponible</p>
        <h1>No fue posible ingresar</h1>
        <p className="lead">{errorAcceso}</p>
        <p className="access-help">Solicite a la Dirección General de Bachillerato un nuevo enlace de acceso.</p>
      </section>
    </main>
  );

  if (vista === "menu") return (
    <main className="app-shell min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="brand-header">
          <div className="brand-mark"><span className="dgb-logo" role="img" aria-label="DGB" /></div>
          <div><p className="eyebrow">Dirección General de Bachillerato</p><h1>GESTIÓN DE PLANTELES PLS</h1></div>
        </header>
        <section className="form-card portal-menu">
          <div className="portal-welcome">
            <div>
              <p className="eyebrow">Acceso autorizado</p>
              <h2>¿Qué desea realizar?</h2>
              <p className="section-copy">Seleccione una operación para los planteles de <strong>{acceso.estado.nombre}</strong>.</p>
            </div>
            <div className="access-summary"><span>{acceso.correo}</span><strong>{acceso.estado.nombre}</strong></div>
          </div>
          <div className="operation-grid">
            <button type="button" onClick={() => setVista("agregar")}><span><ClipboardPlus /></span><strong>Agregar plantel(es)</strong><small>Registre uno o varios planteles para revisión.</small><ArrowRight /></button>
            <button type="button" onClick={() => setVista("consultar")}><span><Search /></span><strong>Consultar plantel(es)</strong><small>Revise los planteles registrados en su estado.</small><ArrowRight /></button>
            <button type="button" onClick={() => setVista("modificar")}><span><FilePenLine /></span><strong>Solicitar modificación</strong><small>Proponga cambios sobre un plantel vigente.</small><ArrowRight /></button>
            <button type="button" onClick={() => setVista("baja")}><span><Trash2 /></span><strong>Solicitar baja</strong><small>Solicite una baja definitiva, por Etapa 2 u otro motivo.</small><ArrowRight /></button>
          </div>
        </section>
      </div>
    </main>
  );

  if (vista === "consultar") return (
    <main className="app-shell min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="brand-header">
          <div className="brand-mark"><span className="dgb-logo" role="img" aria-label="DGB" /></div>
          <div><p className="eyebrow">Dirección General de Bachillerato</p><h1>CONSULTA DE PLANTELES PLS</h1></div>
        </header>
        <section className="form-card consultation-view">
          <div className="portal-welcome">
            <div><p className="eyebrow">Información registrada</p><h2>Planteles de {acceso.estado.nombre}</h2><p className="section-copy">Esta pantalla es únicamente de consulta. Los datos pendientes pueden completarse mediante una solicitud de modificación.</p></div>
            <div className="access-summary"><span>{acceso.correo}</span><strong>{plantelesConsulta.length} plantel(es)</strong></div>
          </div>
          {cargandoConsulta && <div className="consultation-state"><LoaderCircle className="loading-icon" size={34} /><p>Consultando planteles…</p></div>}
          {!cargandoConsulta && errorConsulta && <div className="error-message" role="alert">{errorConsulta}</div>}
          {!cargandoConsulta && !errorConsulta && plantelesConsulta.length === 0 && <div className="consultation-state"><Building2 size={40} /><h3>Aún no hay planteles registrados</h3><p>Cuando se aprueben o registren planteles para este estado, aparecerán aquí.</p></div>}
          {!cargandoConsulta && !errorConsulta && Object.entries(consultaPorMunicipio).map(([municipio, lista]) => <details className="review-municipality" key={municipio} open>
            <summary><span><MapPin size={18} /><strong>{municipio}</strong></span><span>{lista.length} plantel(es) <ChevronDown size={18} /></span></summary>
            <div className="review-municipality-body">{lista.map((plantel, indice) => <article className="review-plant" key={plantel.plantelId || `${municipio}-${indice}`}>
              <div className="consultation-title"><h3>Plantel {indice + 1}: {plantel.nombrePlantel?.trim() || "Sin nombre"}</h3><span>{plantel.estadoRevision || "Pendiente de revisión"}</span></div>
              <dl className="review-data-grid">
                <div><dt>PlantelID</dt><dd>{plantel.plantelId || "Pendiente"}</dd></div>
                <div><dt>Activo</dt><dd>{plantel.activo === true ? "Sí" : plantel.activo === false ? "No" : "Pendiente de completar"}</dd></div>
                <div className="wide"><dt>Dirección</dt><dd>{String(plantel.direccion ?? "").trim() || "Pendiente de completar"}</dd></div>
                <div><dt>Latitud</dt><dd>{String(plantel.latitud ?? "").trim() || "Pendiente de completar"}</dd></div>
                <div><dt>Longitud</dt><dd>{String(plantel.longitud ?? "").trim() || "Pendiente de completar"}</dd></div>
                <div><dt>Código Postal</dt><dd>{String(plantel.codigoPostal ?? "").trim() || "Pendiente de completar"}</dd></div>
                <div><dt>Aulas didácticas</dt><dd>{plantel.aulasDidacticas ?? "Pendiente de completar"}</dd></div>
                <div><dt>Capacidad por aula</dt><dd>{plantel.capacidadPorAula ?? "Pendiente de completar"}</dd></div>
                <div><dt>Capacidad instalada</dt><dd>{plantel.capacidadInstalada ?? "Pendiente de completar"}</dd></div>
                <div><dt>Computadoras</dt><dd>{plantel.computadoras ?? "Pendiente de completar"}</dd></div>
                <div><dt>Agua</dt><dd>{respuestaSiNo(plantel.agua ?? null)}</dd></div><div><dt>Luz</dt><dd>{respuestaSiNo(plantel.luz ?? null)}</dd></div>
                <div><dt>Internet</dt><dd>{respuestaSiNo(plantel.internet ?? null)}</dd></div><div><dt>Drenaje</dt><dd>{respuestaSiNo(plantel.drenaje ?? null)}</dd></div>
                <div><dt>Aulas de cómputo</dt><dd>{respuestaSiNo(plantel.equipoComputo ?? null)}</dd></div><div><dt>Laboratorio</dt><dd>{respuestaSiNo(plantel.laboratorio ?? null)}</dd></div>
                <div><dt>Baños</dt><dd>{respuestaSiNo(plantel.banos ?? null)}</dd></div><div><dt>Espacio administrativo</dt><dd>{respuestaSiNo(plantel.espacioAdministrativo ?? null)}</dd></div>
                <div><dt>Movilidad</dt><dd>{String(plantel.movilidad ?? "").trim() || "Pendiente de completar"}</dd></div><div><dt>Horario</dt><dd>{String(plantel.horario ?? "").trim() || "Pendiente de completar"}</dd></div>
                <div><dt>Última actualización</dt><dd>{plantel.fechaActualizacion ? new Date(plantel.fechaActualizacion).toLocaleString("es-MX") : "Sin actualización"}</dd></div>
                <div><dt>Versión</dt><dd>{plantel.versionActual ?? "Pendiente"}</dd></div>
                <div className="wide"><dt>Motivo actual</dt><dd>{plantel.motivoActual?.trim() || "Sin motivo registrado"}</dd></div>
                <div className="wide"><dt>Enlace de Google Maps</dt><dd>{plantel.linkGoogleMaps?.trim() ? <a href={plantel.linkGoogleMaps} target="_blank" rel="noopener noreferrer">Abrir ubicación <ExternalLink size={14} /></a> : "Pendiente de completar"}</dd></div>
              </dl>
            </article>)}</div>
          </details>)}
          <footer className="form-actions"><button type="button" className="secondary-button" onClick={volverAlMenu}><ArrowLeft size={17} /> Volver al menú</button></footer>
        </section>
      </div>
    </main>
  );

  if (vista !== "agregar") return (
    <main className="app-shell min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="brand-header">
          <div className="brand-mark"><span className="dgb-logo" role="img" aria-label="DGB" /></div>
          <div><p className="eyebrow">Dirección General de Bachillerato</p><h1>GESTIÓN DE PLANTELES PLS</h1></div>
        </header>
        <section className="glass-card pending-view">
          <Building2 size={42} />
          <p className="eyebrow">{vista === "modificar" ? "Solicitud de modificación" : "Solicitud de baja"}</p>
          <h2>La sección está lista para conectarse</h2>
          <p className="lead">En el siguiente paso enlazaremos esta operación con la base vigente de planteles.</p>
          <button type="button" className="secondary-button" onClick={volverAlMenu}><ArrowLeft size={17} /> Volver al menú</button>
        </section>
      </div>
    </main>
  );

  if (finalizado) return (
    <main className="app-shell flex min-h-screen items-center justify-center p-5">
      <section className="glass-card max-w-xl text-center">
        <div className="success-icon"><CheckCircle2 size={38} /></div>
        <p className="eyebrow">Registro concluido</p><h1>¡Muchas gracias!</h1>
        <p className="lead">La solicitud de alta fue enviada correctamente y quedó pendiente de revisión.</p>
        <div className="folio-box">Planteles registrados: <strong>{cantidadPlanteles}</strong></div>
        <button type="button" className="secondary-button success-return" onClick={volverAlMenu}>Volver al menú</button>
      </section>
    </main>
  );

  return (
    <main className="app-shell min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="brand-header">
          <div className="brand-mark"><span className="dgb-logo" role="img" aria-label="DGB" /></div>
          <div><p className="eyebrow">Dirección General de Bachillerato</p><h1>ALTA DE PLANTELES PLS</h1></div>
        </header>
        <section className="form-card">
          <nav className="steps" aria-label="Progreso del formulario">
            {PASOS.map((nombre, indice) => <div className={`step ${indice === paso ? "active" : ""} ${indice < paso ? "done" : ""}`} key={nombre}><span>{indice < paso ? <Check size={15} /> : indice + 1}</span><small>{nombre}</small></div>)}
          </nav>
          <form className={mostrarErrores ? "show-validation" : ""} onSubmit={(event) => event.preventDefault()} noValidate>
            {paso === 0 && <section className="panel narrow-panel">
              <p className="eyebrow">Paso 1 de 4</p><h2>Datos de la persona responsable</h2>
              <p className="section-copy">El correo y el estado provienen de su enlace autorizado.</p>
              <label>Nombre completo <b>*</b><input required aria-invalid={mostrarErrores && !nombreResponsable.trim()} value={nombreResponsable} onChange={(e) => setNombreResponsable(e.target.value)} placeholder="Ej. Juan Torres" autoComplete="name" /><span className="field-error">Falta capturar el nombre completo.</span></label>
              <label>Correo autorizado<input readOnly type="email" value={correoResponsable} autoComplete="email" className="locked-field" /></label>
            </section>}

            {paso === 1 && <section className="panel">
              <p className="eyebrow">Paso 2 de 4</p><h2>Seleccione los municipios</h2>
              <div className="two-columns">
                <label>Estado autorizado<input readOnly value={acceso.estado.nombre} className="locked-field" /></label>
                <div><span className="field-title">Municipios seleccionados</span><div tabIndex={-1} aria-invalid={mostrarErrores && municipios.length === 0} className={`selection-summary ${municipios.length === 0 ? "empty" : ""}`}>{municipios.length === 0 ? "0 seleccionados" : `${municipios.length} seleccionado${municipios.length === 1 ? "" : "s"}`}</div>{mostrarErrores && municipios.length === 0 && <span className="field-error visible">Seleccione al menos un municipio.</span>}</div>
              </div>
              {estado && <>
                <div className="municipality-toolbar">
                  <div className="municipality-search"><Search size={17} /><input value={busquedaMunicipio} onChange={(e) => setBusquedaMunicipio(e.target.value)} placeholder="Buscar municipio…" aria-label="Buscar municipio" /></div>
                  <span>Mostrando {municipiosFiltrados.length} de {opcionesMunicipios.length}</span>
                </div>
                <div className="municipality-grid">{municipiosFiltrados.map((municipio) => <button type="button" key={municipio} aria-pressed={municipios.includes(municipio)} onClick={() => alternarMunicipio(municipio)} className={municipios.includes(municipio) ? "selected" : ""}><span className="check-box">{municipios.includes(municipio) && <Check size={14} />}</span>{municipio}</button>)}</div>
                {municipios.length > 0 && <div className="selected-municipalities"><span>Selección actual:</span>{municipios.map((municipio) => <button type="button" key={municipio} onClick={() => alternarMunicipio(municipio)} aria-label={`Quitar ${municipio}`}>{municipio}<X size={14} /></button>)}</div>}
              </>}
            </section>}

            {paso === 2 && <section className="panel">
              <p className="eyebrow">Paso 3 de 4</p><h2>Capture los planteles</h2>
              <p className="section-copy">Puede agregar más de un plantel en cada municipio. Al continuar avanzará al siguiente municipio seleccionado.</p>
              <p className="municipality-progress">Municipio {municipios.indexOf(municipioActivo) + 1} de {municipios.length}</p>
              <div className="municipality-tabs">{municipios.map((municipio) => <button type="button" key={municipio} className={municipioActivo === municipio ? "active" : ""} onClick={() => setMunicipioActivo(municipio)}><MapPin size={15} /> {municipio} <small>{planteles[municipio]?.length ?? 0}</small></button>)}</div>
              {municipioActivo && planteles[municipioActivo]?.map((plantel, indice) => <article className="plant-card" key={plantel.id}>
                <div className="plant-card-header"><h3>Plantel {indice + 1} en {municipioActivo}</h3>{planteles[municipioActivo].length > 1 && <button type="button" className="icon-danger" onClick={() => eliminarPlantel(municipioActivo, plantel.id)} aria-label="Eliminar plantel"><Trash2 size={17} /></button>}</div>
                <div className="field-grid">
                  <label>Nombre del plantel <span className="optional-label">Opcional</span><input value={plantel.nombre} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "nombre", e.target.value)} /></label>
                  <label>Dirección del plantel <span className="optional-label">Opcional</span><input value={plantel.direccion} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "direccion", e.target.value)} /></label>
                  <label>Latitud <span className="optional-label">Opcional</span><input type="number" min={-90} max={90} step="any" aria-invalid={mostrarErrores && Boolean(plantel.latitud.trim()) && !coordenadaValida(plantel.latitud, -90, 90)} value={plantel.latitud} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "latitud", e.target.value)} placeholder="Ej. 19.432608" /><span className="field-error">Capture una latitud entre -90 y 90.</span></label>
                  <label>Longitud <span className="optional-label">Opcional</span><input type="number" min={-180} max={180} step="any" aria-invalid={mostrarErrores && Boolean(plantel.longitud.trim()) && !coordenadaValida(plantel.longitud, -180, 180)} value={plantel.longitud} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "longitud", e.target.value)} placeholder="Ej. -99.133209" /><span className="field-error">Capture una longitud entre -180 y 180.</span></label>
                  <label>Código Postal <span className="optional-label">Opcional</span><input inputMode="numeric" maxLength={5} pattern="[0-9]{5}" aria-invalid={mostrarErrores && Boolean(plantel.codigoPostal.trim()) && !/^[0-9]{5}$/.test(plantel.codigoPostal)} value={plantel.codigoPostal} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "codigoPostal", e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="Ej. 06000" /><span className="field-error">Capture un Código Postal de 5 dígitos.</span></label>
                  <div className="wide maps-field">
                    <label>Enlace de Google Maps <span className="optional-label">Opcional</span>
                      <span className="field-help">Pegue el vínculo que obtiene al seleccionar <strong>Compartir</strong> en Google Maps; no escriba el domicilio.</span>
                      <input type="url" aria-invalid={mostrarErrores && Boolean(plantel.linkGoogleMaps.trim()) && Boolean(errorEnlaceGoogleMaps(plantel.linkGoogleMaps))} value={plantel.linkGoogleMaps} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "linkGoogleMaps", e.target.value)} onBlur={(e) => actualizarPlantel(municipioActivo, plantel.id, "linkGoogleMaps", e.target.value.trim())} placeholder="Ej. https://maps.app.goo.gl/..." />
                      {mostrarErrores && plantel.linkGoogleMaps.trim() && errorEnlaceGoogleMaps(plantel.linkGoogleMaps) && <span className="field-error visible">{errorEnlaceGoogleMaps(plantel.linkGoogleMaps)}</span>}
                    </label>
                    <div className="maps-tools">
                      <details className="maps-guide">
                        <summary>
                          <span className="maps-guide-icon"><HelpCircle size={21} /></span>
                          <span><strong>¿Cómo obtener el enlace?</strong><small>Consulte la guía con imágenes</small></span>
                          <ChevronDown className="maps-guide-chevron" size={20} />
                        </summary>
                        <div className="maps-guide-body">
                          <p className="maps-guide-intro">Siga estos pasos para obtener el vínculo correcto del plantel:</p>
                          <ol className="maps-guide-steps">
                            <li>
                              <span className="step-number">1</span>
                              <div><h4>Abra Google Maps</h4><p>Ingrese a <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer">google.com/maps</a>.</p></div>
                            </li>
                            <li>
                              <span className="step-number">2</span>
                              <div><h4>Busque el plantel</h4><p>Escriba la dirección o el nombre del plantel en el buscador.</p><Image src="/guia-google-maps-buscar.png" alt="Buscador de Google Maps señalado con una flecha" width={528} height={322} /></div>
                            </li>
                            <li>
                              <span className="step-number">3</span>
                              <div><h4>Seleccione Compartir</h4><p>En la ficha del plantel, presione el botón <strong>Compartir</strong>.</p><Image src="/guia-google-maps-compartir.png" alt="Botón Compartir en la ficha de un plantel de Google Maps" width={420} height={522} /></div>
                            </li>
                            <li>
                              <span className="step-number">4</span>
                              <div><h4>Copie y pegue el vínculo</h4><p>Seleccione <strong>Copiar vínculo</strong> y péguelo en el campo de arriba.</p><Image src="/guia-google-maps-copiar.png" alt="Opción Copiar vínculo en Google Maps" width={576} height={466} /></div>
                            </li>
                          </ol>
                        </div>
                      </details>
                      {!errorEnlaceGoogleMaps(plantel.linkGoogleMaps) && <a className="verify-link" href={plantel.linkGoogleMaps.trim()} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /> Verificar enlace</a>}
                    </div>
                  </div>
                  <label>Aulas didácticas <span className="optional-label">Opcional</span><input type="number" min="0" value={plantel.aulasDidacticas} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "aulasDidacticas", e.target.value)} placeholder="Ej. 12" /></label>
                  <label>Capacidad por aula <span className="optional-label">Opcional</span><input type="number" min="0" value={plantel.capacidadPorAula} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "capacidadPorAula", e.target.value)} placeholder="Ej. 30" /></label>
                  <label>Capacidad instalada <span className="optional-label">Opcional</span><input type="number" min="0" step="1" value={plantel.capacidadInstalada} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "capacidadInstalada", e.target.value)} placeholder="Ej. 450" /></label>
                  <label>Computadoras <span className="optional-label">Opcional</span><input type="number" min="0" value={plantel.computadoras} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "computadoras", e.target.value)} placeholder="Ej. 25" /></label>
                  <label>Movilidad <span className="optional-label">Opcional</span><input value={plantel.movilidad} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "movilidad", e.target.value)} placeholder="Ej. transporte público" /></label>
                  <label>Horario <span className="optional-label">Opcional</span><input value={plantel.horario} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "horario", e.target.value)} placeholder="Ej. 08:00 a 18:00" /></label>
                </div>
                <div className="switch-grid">{([['agua','Agua'],['luz','Luz'],['internet','Internet'],['drenaje','Drenaje'],['equipoComputo','Aulas de cómputo'],['laboratorio','Laboratorio'],['banos','Baños'],['espacioAdministrativo','Espacio administrativo']] as const).map(([campo, etiqueta]) => <fieldset className="boolean-field" key={campo}><legend>{etiqueta} <span className="optional-label">Opcional</span></legend><div className="yes-no-options"><button type="button" className={plantel[campo] === true ? "selected" : ""} aria-pressed={plantel[campo] === true} onClick={() => actualizarPlantel(municipioActivo, plantel.id, campo, true)}>Sí</button><button type="button" className={plantel[campo] === false ? "selected" : ""} aria-pressed={plantel[campo] === false} onClick={() => actualizarPlantel(municipioActivo, plantel.id, campo, false)}>No</button></div></fieldset>)}</div>
              </article>)}
              {municipioActivo && <button type="button" className="add-button" onClick={() => agregarPlantel(municipioActivo)}><Plus size={17} /> Agregar otro plantel en {municipioActivo}</button>}
            </section>}

            {paso === 3 && <section className="panel">
              <p className="eyebrow">Paso 4 de 4</p><h2>Revisión del registro</h2>
              <p className="section-copy">Verifique toda la información antes de enviarla. Despliegue cada municipio para consultar sus planteles o regresar a modificarlos.</p>
              <div className="review-contact"><strong>{nombreResponsable}</strong><span>{correoResponsable}</span><span>{acceso.estado.nombre}</span></div>
              <div className="review-list">{municipios.map((municipio) => <details className="review-municipality" key={municipio}>
                <summary><span><MapPin size={18} /><strong>{municipio}</strong></span><span>{planteles[municipio]?.length ?? 0} plantel(es) <ChevronDown size={18} /></span></summary>
                <div className="review-municipality-body">
                  {planteles[municipio]?.map((plantel, indice) => <article className="review-plant" key={plantel.id}>
                    <h3>Plantel {indice + 1}: {plantel.nombre.trim() || "Sin nombre"}</h3>
                    <dl className="review-data-grid">
                      <div className="wide"><dt>Dirección</dt><dd>{mostrarValor(plantel.direccion)}</dd></div>
                      <div><dt>Latitud</dt><dd>{mostrarValor(plantel.latitud)}</dd></div>
                      <div><dt>Longitud</dt><dd>{mostrarValor(plantel.longitud)}</dd></div>
                      <div><dt>Código Postal</dt><dd>{mostrarValor(plantel.codigoPostal)}</dd></div>
                      <div><dt>Aulas didácticas</dt><dd>{mostrarValor(plantel.aulasDidacticas)}</dd></div>
                      <div><dt>Capacidad por aula</dt><dd>{mostrarValor(plantel.capacidadPorAula)}</dd></div>
                      <div><dt>Capacidad instalada</dt><dd>{mostrarValor(plantel.capacidadInstalada)}</dd></div>
                      <div><dt>Computadoras</dt><dd>{mostrarValor(plantel.computadoras)}</dd></div>
                      <div><dt>Movilidad</dt><dd>{mostrarValor(plantel.movilidad)}</dd></div>
                      <div><dt>Horario</dt><dd>{mostrarValor(plantel.horario)}</dd></div>
                      <div><dt>Agua</dt><dd>{respuestaSiNo(plantel.agua)}</dd></div>
                      <div><dt>Luz</dt><dd>{respuestaSiNo(plantel.luz)}</dd></div>
                      <div><dt>Internet</dt><dd>{respuestaSiNo(plantel.internet)}</dd></div>
                      <div><dt>Drenaje</dt><dd>{respuestaSiNo(plantel.drenaje)}</dd></div>
                      <div><dt>Aulas de cómputo</dt><dd>{respuestaSiNo(plantel.equipoComputo)}</dd></div>
                      <div><dt>Laboratorio</dt><dd>{respuestaSiNo(plantel.laboratorio)}</dd></div>
                      <div><dt>Baños</dt><dd>{respuestaSiNo(plantel.banos)}</dd></div>
                      <div><dt>Espacio administrativo</dt><dd>{respuestaSiNo(plantel.espacioAdministrativo)}</dd></div>
                      <div className="wide"><dt>Enlace de Google Maps</dt><dd>{plantel.linkGoogleMaps.trim() ? <a href={plantel.linkGoogleMaps} target="_blank" rel="noopener noreferrer">Abrir ubicación <ExternalLink size={14} /></a> : "Pendiente de completar"}</dd></div>
                    </dl>
                  </article>)}
                  <button type="button" className="edit-municipality-button" onClick={() => editarMunicipio(municipio)}>Editar planteles de {municipio}</button>
                </div>
              </details>)}</div>
              <div className="review-total">Total de planteles <strong>{cantidadPlanteles}</strong></div>
            </section>}

            {mensaje && <div className="error-message" role="alert">{mensaje}</div>}
            <footer className="form-actions">
              {paso > 0 ? <button type="button" className="secondary-button" onClick={() => setPaso((actual) => actual - 1)}><ArrowLeft size={17} /> Regresar</button> : <button type="button" className="secondary-button" onClick={volverAlMenu}><ArrowLeft size={17} /> Menú principal</button>}
              <div className="spacer" />
              {paso < 3 ? <button key="continuar" type="button" className="primary-button" onClick={avanzar}>{paso === 2 ? (municipios.indexOf(municipioActivo) < municipios.length - 1 ? "Siguiente municipio" : "Revisar registro") : "Continuar"} <ArrowRight size={17} /></button> : <button key="enviar" type="button" className="primary-button" onClick={enviar} disabled={enviando}>{enviando ? "Enviando…" : <><Send size={17} /> Enviar registro</>}</button>}
            </footer>
          </form>
        </section>
      </div>
    </main>
  );
}
