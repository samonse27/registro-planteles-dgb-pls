"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Building2, LoaderCircle, MapPin, ShieldCheck, X } from "lucide-react";

type Plantel = {
  plantelId?: string;
  estado?: string;
  municipio?: string;
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
  { clave: "nombrePlantel", etiqueta: "Nombre del plantel" },
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
        if (acceso?.puedeVerMonitoreo !== true) throw new Error("Este enlace no tiene permiso para consultar el monitoreo nacional.");
        setCorreo(acceso.correo || "Acceso de monitoreo");

        const response = await fetch("/api/monitoreo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (!response.ok || !data?.valido) throw new Error(data?.mensaje || "No fue posible consultar el monitoreo.");
        setPlanteles(Array.isArray(data.planteles) ? data.planteles.filter((p: Plantel) => p.activo !== false) : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No fue posible abrir el monitoreo.");
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
      <section className="glass-card access-state"><LoaderCircle className="loading-icon" size={42} /><p className="eyebrow">Calidad de la información</p><h1>Cargando monitoreo</h1></section>
    </main>
  );

  if (error) return (
    <main className="app-shell flex min-h-screen items-center justify-center p-5">
      <section className="glass-card access-state"><div className="access-error"><X size={34} /></div><p className="eyebrow">Monitoreo no disponible</p><h1>No fue posible ingresar</h1><p className="lead">{error}</p><button className="secondary-button" onClick={volver}><ArrowLeft size={17} /> Volver al portal</button></section>
    </main>
  );

  return (
    <main className="app-shell min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="brand-header"><div className="brand-mark"><span className="dgb-logo" role="img" aria-label="DGB" /></div><div><p className="eyebrow">Dirección General de Bachillerato</p><h1>CALIDAD DE LA INFORMACIÓN PLS</h1></div></header>
        <section className="form-card">
          <div className="portal-welcome">
            <div><p className="eyebrow">Monitoreo nacional</p><h2>Completitud de la información</h2><p className="section-copy">Identifique estados, planteles y campos que requieren actualización.</p></div>
            <div className="access-summary"><span>{correo}</span><strong>Acceso nacional</strong></div>
          </div>

          <div style={{display:"flex",gap:12,alignItems:"end",flexWrap:"wrap",margin:"24px 0"}}>
            <label style={{display:"grid",gap:7,minWidth:260}}><strong>Vista</strong><select value={estadoFiltro} onChange={(e)=>setEstadoFiltro(e.target.value)}><option>Nacional</option>{estados.map((estado)=><option key={estado}>{estado}</option>)}</select></label>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,marginBottom:28}}>
            <article className="review-plant"><Building2 size={22}/><strong style={{fontSize:28}}>{visibles.length}</strong><span>Planteles activos</span></article>
            <article className="review-plant"><BarChart3 size={22}/><strong style={{fontSize:28}}>{(100-faltanteGeneral).toFixed(1)}%</strong><span>Completitud general</span></article>
            <article className="review-plant"><ShieldCheck size={22}/><strong style={{fontSize:28}}>{porcentajeCompletos.toFixed(1)}%</strong><span>Planteles 100% completos</span></article>
            <article className="review-plant"><MapPin size={22}/><strong style={{fontSize:28,color:semaforo(faltanteGeneral)}}>{faltanteGeneral.toFixed(1)}%</strong><span>Información faltante</span></article>
          </div>

          {estadoFiltro === "Nacional" && <section className="panel" style={{marginBottom:24}}><p className="eyebrow">Semáforo nacional</p><h2>Estados con mayor información faltante</h2><div style={{display:"grid",gap:10,marginTop:18}}>{rankingEstados.map((item)=><button key={item.estado} type="button" onClick={()=>setEstadoFiltro(item.estado)} style={{display:"grid",gridTemplateColumns:"minmax(150px,1fr) 3fr 90px",gap:12,alignItems:"center",textAlign:"left",padding:12,border:"1px solid rgba(0,0,0,.1)",borderRadius:12,background:"white"}}><strong>{item.estado}</strong><span style={{height:12,background:"#eee",borderRadius:999,overflow:"hidden"}}><span style={{display:"block",height:"100%",width:`${Math.min(item.porcentaje,100)}%`,background:semaforo(item.porcentaje)}} /></span><strong style={{color:semaforo(item.porcentaje)}}>{item.porcentaje.toFixed(1)}%</strong></button>)}</div></section>}

          <section className="panel" style={{marginBottom:24}}><p className="eyebrow">Campos prioritarios</p><h2>Información que más hace falta</h2><div style={{display:"grid",gap:10,marginTop:18}}>{rankingCampos.slice(0,10).map((item)=><div key={item.campo} style={{display:"grid",gridTemplateColumns:"minmax(180px,1fr) 3fr 90px",gap:12,alignItems:"center"}}><strong>{item.campo}</strong><span style={{height:10,background:"#eee",borderRadius:999,overflow:"hidden"}}><span style={{display:"block",height:"100%",width:`${Math.min(item.porcentaje,100)}%`,background:semaforo(item.porcentaje)}} /></span><span>{item.porcentaje.toFixed(1)}%</span></div>)}</div></section>

          <section className="panel"><p className="eyebrow">Detalle por plantel</p><h2>Planteles con información faltante</h2><div style={{overflowX:"auto",marginTop:18}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={{textAlign:"left",padding:10}}>Estado</th><th style={{textAlign:"left",padding:10}}>Municipio</th><th style={{textAlign:"left",padding:10}}>Plantel</th><th style={{textAlign:"left",padding:10}}>Completitud</th><th style={{textAlign:"left",padding:10}}>Campos faltantes</th></tr></thead><tbody>{detallePlanteles.filter((x)=>x.faltantes.length>0).map(({plantel,faltantes,completitud},i)=><tr key={plantel.plantelId || i} style={{borderTop:"1px solid rgba(0,0,0,.08)"}}><td style={{padding:10}}>{plantel.estado || "Pendiente"}</td><td style={{padding:10}}>{plantel.municipio || "Pendiente"}</td><td style={{padding:10}}><strong>{plantel.nombrePlantel || "Sin nombre"}</strong></td><td style={{padding:10}}><strong style={{color:semaforo(100-completitud)}}>{completitud.toFixed(1)}%</strong></td><td style={{padding:10}}>{faltantes.map((f)=>f.etiqueta).join(", ")}</td></tr>)}</tbody></table></div></section>

          <footer className="form-actions"><button type="button" className="secondary-button" onClick={volver}><ArrowLeft size={17}/> Volver al menú</button></footer>
        </section>
      </div>
    </main>
  );
}
