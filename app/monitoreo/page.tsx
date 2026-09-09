"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Building2, LoaderCircle, MapPin, ShieldCheck, X } from "lucide-react";

type Plantel = {
  plantelId?: string;
  estado?: string;
  municipio?: string;
  nombre?: string;
  nombrePlantel?: string;
  direccion?: string;
  latitud?: string;
  longitud?: string;
  codigoPostal?: string;
  linkGoogleMaps?: string;
  aulasDidacticas?: string | number | null;
  capacidadPorAula?: string | number | null;
  capacidadInstalada?: string | number | null;
  computadoras?: string | number | null;
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
  activo?: boolean;
};

type CampoCalidad = { clave: keyof Plantel; etiqueta: string };

const CAMPOS: CampoCalidad[] = [
  { clave: "nombre", etiqueta: "Nombre del plantel" },
  { clave: "municipio", etiqueta: "Municipio" },
  { clave: "direccion", etiqueta: "Dirección" },
  { clave: "latitud", etiqueta: "Latitud" },
  { clave: "longitud", etiqueta: "Longitud" },
  { clave: "codigoPostal", etiqueta: "Código Postal" },
  { clave: "linkGoogleMaps", etiqueta: "Enlace de Google Maps" },
  { clave: "aulasDidacticas", etiqueta: "Aulas didácticas" },
  { clave: "capacidadPorAula", etiqueta: "Capacidad por aula" },
  { clave: "capacidadInstalada", etiqueta: "Capacidad instalada" },
  { clave: "computadoras", etiqueta: "Computadoras" },
  { clave: "agua", etiqueta: "Agua" },
  { clave: "luz", etiqueta: "Luz" },
  { clave: "internet", etiqueta: "Internet" },
  { clave: "drenaje", etiqueta: "Drenaje" },
  { clave: "equipoComputo", etiqueta: "Aulas de cómputo" },
  { clave: "laboratorio", etiqueta: "Laboratorio" },
  { clave: "banos", etiqueta: "Baños" },
  { clave: "espacioAdministrativo", etiqueta: "Espacio administrativo" },
  { clave: "movilidad", etiqueta: "Movilidad" },
  { clave: "horario", etiqueta: "Horario" },
];

const estaVacio = (valor: unknown) => {
  if (valor === null || valor === undefined) return true;
  if (typeof valor === "string") return valor.trim() === "";
  return false;
};

const faltantesDe = (plantel: Plantel) =>
  CAMPOS.filter((campo) => estaVacio(plantel[campo.clave]));

const porcentajeFaltante = (planteles: Plantel[]) => {
  if (!planteles.length) return 0;
  const total = planteles.length * CAMPOS.length;
  const faltantes = planteles.reduce((suma, plantel) => suma + faltantesDe(plantel).length, 0);
  return (faltantes / total) * 100;
};

const semaforo = (porcentaje: number) =>
  porcentaje > 30 ? "#b42318" : porcentaje >= 10 ? "#d97706" : "#15803d";

const LeyendaSemaforo = () => (
  <div
    aria-label="Significado de los colores del semáforo"
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "10px 20px",
      alignItems: "center",
      padding: "14px 18px",
      marginTop: 16,
      border: "1px solid rgba(79, 35, 48, .12)",
      borderRadius: 14,
      background: "rgba(255,255,255,.72)",
      fontSize: 14,
    }}
  >
    <strong style={{ marginRight: 2 }}>Semáforo de información faltante:</strong>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <i style={{ width: 12, height: 12, borderRadius: 999, background: "#15803d", display: "inline-block" }} />
      Verde: menos de 10%
    </span>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <i style={{ width: 12, height: 12, borderRadius: 999, background: "#d97706", display: "inline-block" }} />
      Naranja: 10% a 30%
    </span>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <i style={{ width: 12, height: 12, borderRadius: 999, background: "#b42318", display: "inline-block" }} />
      Rojo: más de 30%
    </span>
  </div>
);

export default function MonitoreoPage() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [planteles, setPlanteles] = useState<Plantel[]>([]);
  const [correo, setCorreo] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Nacional");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token")?.trim() ?? "";
    if (!token) {
      setError("Este enlace no contiene una clave de acceso válida.");
      setCargando(false);
      return;
    }

    const cargar = async () => {
      try {
        const accesoResponse = await fetch("/api/access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const acceso = await accesoResponse.json();
        if (!accesoResponse.ok || !acceso?.valido) throw new Error(acceso?.mensaje || "El enlace no es válido.");
        if (acceso?.puedeVerMonitoreo !== true) throw new Error("Este enlace no tiene permiso para consultar el avance nacional.");
        setCorreo(acceso.correo || "Acceso de monitoreo");

        const response = await fetch("/api/monitoreo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (!response.ok || !data?.valido) throw new Error(data?.mensaje || "No fue posible consultar el avance.");
        setPlanteles(Array.isArray(data.planteles) ? data.planteles.filter((p: Plantel) => p.activo !== false) : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No fue posible abrir el avance de la información.");
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, []);

  const estados = useMemo(() => {
    return Array.from(new Set(planteles.map((p) => p.estado?.trim()).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "es"));
  }, [planteles]);

  const visibles = useMemo(() =>
    estadoFiltro === "Nacional" ? planteles : planteles.filter((p) => p.estado === estadoFiltro),
  [planteles, estadoFiltro]);

  const faltanteGeneral = porcentajeFaltante(visibles);
  const completos = visibles.filter((p) => faltantesDe(p).length === 0).length;
  const porcentajeCompletos = visibles.length ? (completos / visibles.length) * 100 : 0;

  const rankingEstados = useMemo(() => {
    const grupos = new Map<string, Plantel[]>();
    planteles.forEach((p) => {
      const estado = p.estado?.trim() || "Sin estado";
      grupos.set(estado, [...(grupos.get(estado) || []), p]);
    });
    return Array.from(grupos.entries())
      .map(([estado, lista]) => ({ estado, porcentaje: porcentajeFaltante(lista), total: lista.length }))
      .sort((a, b) => b.porcentaje - a.porcentaje);
  }, [planteles]);

  const rankingCampos = useMemo(() => CAMPOS.map((campo) => {
    const faltantes = visibles.filter((p) => estaVacio(p[campo.clave])).length;
    return {
      campo: campo.etiqueta,
      faltantes,
      porcentaje: visibles.length ? (faltantes / visibles.length) * 100 : 0,
    };
  }).sort((a, b) => b.porcentaje - a.porcentaje), [visibles]);

  const detallePlanteles = useMemo(() => visibles.map((plantel) => {
    const faltantes = faltantesDe(plantel);
    const completitud = ((CAMPOS.length - faltantes.length) / CAMPOS.length) * 100;
    return { plantel, faltantes, completitud };
  }).sort((a, b) => a.completitud - b.completitud), [visibles]);

  const volver = () => {
    const token = new URLSearchParams(window.location.search).get("token");
    window.location.href = token ? `/?token=${encodeURIComponent(token)}` : "/";
  };

  if (cargando) return (
    <main className="app-shell flex min-h-screen items-center justify-center p-5">
      <section className="glass-card access-state"><LoaderCircle className="loading-icon" size={42} /><p className="eyebrow">Avance de la información</p><h1>Cargando monitoreo</h1></section>
    </main>
  );

  if (error) return (
    <main className="app-shell flex min-h-screen items-center justify-center p-5">
      <section className="glass-card access-state"><div className="access-error"><X size={34} /></div><p className="eyebrow">Avance no disponible</p><h1>No fue posible ingresar</h1><p className="lead">{error}</p><button className="secondary-button" onClick={volver}><ArrowLeft size={17} /> Volver al portal</button></section>
    </main>
  );

  return (
    <main className="app-shell min-h-screen px-5 py-8 md:px-10 lg:px-14">
      <div className="mx-auto" style={{ maxWidth: 1420 }}>
        <header className="brand-header"><div className="brand-mark"><span className="dgb-logo" role="img" aria-label="DGB" /></div><div><p className="eyebrow">Dirección General de Bachillerato</p><h1>AVANCE DE LA INFORMACIÓN PLS</h1></div></header>
        <section className="form-card" style={{ padding: "clamp(24px, 3vw, 42px)" }}>
          <div className="portal-welcome" style={{ gap: 28 }}>
            <div><p className="eyebrow">Monitoreo nacional</p><h2>Completitud de la información</h2><p className="section-copy">Identifique estados, planteles y campos que requieren actualización.</p></div>
            <div className="access-summary"><span>{correo}</span><strong>Acceso nacional</strong></div>
          </div>

          <div style={{display:"flex",gap:12,alignItems:"end",flexWrap:"wrap",margin:"30px 0 28px"}}>
            <label style={{display:"grid",gap:7,minWidth:260}}><strong>Vista</strong><select value={estadoFiltro} onChange={(e)=>setEstadoFiltro(e.target.value)}><option>Nacional</option>{estados.map((estado)=><option key={estado}>{estado}</option>)}</select></label>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:18,marginBottom:30}}>
            <article className="review-plant" style={{padding:20}}><Building2 size={22}/><strong style={{fontSize:28}}>{visibles.length}</strong><span>Planteles activos</span></article>
            <article className="review-plant" style={{padding:20}}><BarChart3 size={22}/><strong style={{fontSize:28}}>{(100-faltanteGeneral).toFixed(1)}%</strong><span>Completitud general</span></article>
            <article className="review-plant" style={{padding:20}}><ShieldCheck size={22}/><strong style={{fontSize:28}}>{porcentajeCompletos.toFixed(1)}%</strong><span>Planteles 100% completos</span></article>
            <article className="review-plant" style={{padding:20}}><MapPin size={22}/><strong style={{fontSize:28,color:semaforo(faltanteGeneral)}}>{faltanteGeneral.toFixed(1)}%</strong><span>Información faltante</span></article>
          </div>

          <LeyendaSemaforo />

          {estadoFiltro === "Nacional" && <section className="panel" style={{marginTop:30,marginBottom:30,padding:"28px 30px"}}><p className="eyebrow">Semáforo nacional</p><h2>Estados con mayor información faltante</h2><div style={{display:"grid",gap:12,marginTop:20}}>{rankingEstados.map((item)=><button key={item.estado} type="button" onClick={()=>setEstadoFiltro(item.estado)} style={{display:"grid",gridTemplateColumns:"minmax(170px,1fr) 3fr 90px",gap:14,alignItems:"center",textAlign:"left",padding:"14px 16px",border:"1px solid rgba(0,0,0,.1)",borderRadius:12,background:"white"}}><strong>{item.estado}</strong><span style={{height:12,background:"#eee",borderRadius:999,overflow:"hidden"}}><span style={{display:"block",height:"100%",width:`${Math.min(item.porcentaje,100)}%`,background:semaforo(item.porcentaje)}} /></span><strong style={{color:semaforo(item.porcentaje)}}>{item.porcentaje.toFixed(1)}%</strong></button>)}</div></section>}

          <section className="panel" style={{marginTop:30,marginBottom:30,padding:"28px 30px"}}><p className="eyebrow">Campos prioritarios</p><h2>Información que más hace falta</h2><div style={{display:"grid",gap:12,marginTop:22}}>{rankingCampos.slice(0,10).map((item)=><div key={item.campo} style={{display:"grid",gridTemplateColumns:"minmax(210px,1fr) 3fr 78px",gap:14,alignItems:"center"}}><strong>{item.campo}</strong><span style={{height:10,background:"#eee",borderRadius:999,overflow:"hidden"}}><span style={{display:"block",height:"100%",width:`${Math.min(item.porcentaje,100)}%`,background:semaforo(item.porcentaje)}} /></span><span style={{textAlign:"right"}}>{item.porcentaje.toFixed(1)}%</span></div>)}</div></section>

          <section className="panel" style={{padding:"28px 30px"}}><p className="eyebrow">Detalle por plantel</p><h2>Planteles con información faltante</h2><div style={{overflow:"auto",maxHeight:560,marginTop:20}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={{textAlign:"left",padding:12}}>Estado</th><th style={{textAlign:"left",padding:12}}>Municipio</th><th style={{textAlign:"left",padding:12}}>Plantel</th><th style={{textAlign:"left",padding:12}}>Completitud</th><th style={{textAlign:"left",padding:12}}>Campos faltantes</th></tr></thead><tbody>{detallePlanteles.filter((x)=>x.faltantes.length>0).map(({plantel,faltantes,completitud},i)=><tr key={plantel.plantelId || i} style={{borderTop:"1px solid rgba(0,0,0,.08)"}}><td style={{padding:12}}>{plantel.estado || "Pendiente"}</td><td style={{padding:12}}>{plantel.municipio || "Pendiente"}</td><td style={{padding:12}}><strong>{plantel.nombre || plantel.nombrePlantel || "Sin nombre"}</strong></td><td style={{padding:12}}><strong style={{color:semaforo(100-completitud)}}>{completitud.toFixed(1)}%</strong></td><td style={{padding:12}}>{faltantes.map((f)=>f.etiqueta).join(", ")}</td></tr>)}</tbody></table></div></section>

          <footer className="form-actions" style={{marginTop:30}}><button type="button" className="secondary-button" onClick={volver}><ArrowLeft size={17}/> Volver al menú</button></footer>
        </section>
      </div>
    </main>
  );
}