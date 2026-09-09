"use client";

import { useEffect } from "react";

type EstadoPermitido = { clave: string; nombre: string };

export default function ModificationBridge() {
  useEffect(() => {
    let puedeVerMonitoreo = false;
    let accesoNacional = false;
    let estadosNacionales: EstadoPermitido[] = [];
    let permitirConsultaNacional = false;
    let historialConsultaPreparado = false;

    const fetchOriginal = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await fetchOriginal(input, init);
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input instanceof Request ? input.url : "";
      if (!url.includes("/api/planteles") || !response.ok) return response;
      try {
        const data = await response.clone().json();
        const consultaEstado = new URLSearchParams(window.location.search).get("consultaEstado")?.trim() ?? "";
        if (!consultaEstado || consultaEstado === "todos" || !Array.isArray(data?.planteles)) return response;
        const plantelesFiltrados = data.planteles.filter((plantel: Record<string, unknown>) => String(plantel?.claveEstado ?? plantel?.ClaveEstado ?? "").trim() === consultaEstado);
        const headers = new Headers(response.headers);
        headers.delete("content-length");
        headers.set("Content-Type", "application/json; charset=utf-8");
        return new Response(JSON.stringify({ ...data, planteles: plantelesFiltrados, consultaEstado }), { status: response.status, statusText: response.statusText, headers });
      } catch { return response; }
    };

    const resaltarPendientes = () => {
      const esAlta = document.body.textContent?.includes("ALTA DE PLANTELES PLS");
      const esConsulta = document.body.textContent?.includes("CONSULTA DE PLANTELES PLS");
      if (!esAlta && !esConsulta) return;
      document.querySelectorAll<HTMLElement>(".review-data-grid dd").forEach((elemento) => {
        const texto = elemento.textContent?.trim().toLowerCase() ?? "";
        const pendiente = texto.startsWith("pendiente") || texto === "sin respuesta";
        const recuadro = elemento.parentElement as HTMLElement | null;
        if (pendiente) elemento.style.fontWeight = "800"; else elemento.style.removeProperty("font-weight");
        if (!esConsulta || !recuadro) return;
        if (pendiente) {
          recuadro.style.background = "#fff6dd";
          recuadro.style.borderColor = "rgba(165, 127, 44, 0.55)";
          recuadro.style.boxShadow = "inset 0 0 0 1px rgba(165, 127, 44, 0.08)";
        } else {
          recuadro.style.removeProperty("background"); recuadro.style.removeProperty("border-color"); recuadro.style.removeProperty("box-shadow");
        }
      });
    };

    const mejorarFormularioModificacion = () => {
      if (window.location.pathname !== "/modificar") return;
      document.querySelectorAll<HTMLInputElement>(".plant-card input").forEach((input) => {
        const vacio = input.value.trim() === "";
        input.style.background = vacio ? "#fff6dd" : "#ffffff";
        input.style.borderColor = vacio ? "rgba(165,127,44,.62)" : "";
        input.style.boxShadow = vacio ? "inset 0 0 0 1px rgba(165,127,44,.06)" : "";
        if (input.dataset.pendienteListener !== "true") {
          input.dataset.pendienteListener = "true";
          input.addEventListener("input", () => mejorarFormularioModificacion());
        }
      });
      document.querySelectorAll<HTMLElement>(".plant-card .boolean-field").forEach((campo) => {
        const seleccionado = campo.querySelector('button[aria-pressed="true"]');
        campo.style.background = seleccionado ? "" : "#fff6dd";
        campo.style.borderColor = seleccionado ? "" : "rgba(165,127,44,.62)";
      });
      document.querySelectorAll<HTMLElement>(".plant-card .field-error").forEach((error) => {
        error.style.color = "#9b1c16";
        error.style.fontSize = ".9rem";
        error.style.fontWeight = "800";
        error.style.lineHeight = "1.5";
        error.style.padding = "9px 11px";
        error.style.borderRadius = "9px";
        error.style.background = "#fff0ee";
        error.style.border = "1px solid rgba(180,35,24,.25)";
      });
      const labels = Array.from(document.querySelectorAll<HTMLLabelElement>(".plant-card label"));
      const mapsLabel = labels.find((label) => label.textContent?.includes("Enlace de Google Maps"));
      if (mapsLabel && !mapsLabel.querySelector('[data-maps-guide-modificacion="true"]')) {
        const guide = document.createElement("details");
        guide.dataset.mapsGuideModificacion = "true";
        guide.className = "maps-guide";
        guide.style.marginTop = "8px";
        guide.innerHTML = `<summary><span class="maps-guide-icon">?</span><span><strong>¿Cómo obtener el enlace correcto?</strong><small>Guía rápida de Google Maps</small></span></summary><div class="maps-guide-body"><p class="maps-guide-intro">Para evitar enlaces demasiado largos:</p><ol style="margin:0;padding-left:20px;color:#624452;line-height:1.7;font-size:.86rem;"><li>Abra el plantel en Google Maps.</li><li>Seleccione <strong>Compartir</strong>.</li><li>Elija <strong>Copiar vínculo</strong>.</li><li>Pegue aquí el vínculo copiado.</li></ol></div>`;
        mapsLabel.appendChild(guide);
      }
    };

    const prepararHistorialConsulta = () => {
      const enConsulta = document.body.textContent?.includes("CONSULTA DE PLANTELES PLS");
      if (!enConsulta || historialConsultaPreparado) return;
      historialConsultaPreparado = true;
      const actual = { ...(history.state ?? {}), plsConsulta: true };
      history.replaceState(actual, "", window.location.href);
      history.pushState({ ...actual, plsConsultaDetalle: true }, "", window.location.href);
    };

    const agregarSelectorEstadoNacional = () => {
      if (!accesoNacional || estadosNacionales.length === 0 || !document.body.textContent?.includes("Seleccione los municipios")) return;
      const contenedor = document.querySelector<HTMLElement>(".two-columns");
      const etiqueta = contenedor?.querySelector<HTMLLabelElement>("label");
      if (!etiqueta || etiqueta.dataset.selectorNacional === "true") return;
      const input = etiqueta.querySelector<HTMLInputElement>("input.locked-field");
      if (!input) return;
      etiqueta.dataset.selectorNacional = "true"; input.style.display = "none";
      const texto = Array.from(etiqueta.childNodes).find((nodo) => nodo.nodeType === Node.TEXT_NODE); if (texto) texto.textContent = "Estado ";
      const requerido = document.createElement("b"); requerido.textContent = "*"; etiqueta.insertBefore(requerido, input);
      const select = document.createElement("select"); select.setAttribute("aria-label", "Seleccione un estado"); select.style.width = "100%"; select.style.marginTop = "8px";
      const placeholder = document.createElement("option"); placeholder.value = ""; placeholder.textContent = "Seleccione un estado"; select.appendChild(placeholder);
      estadosNacionales.forEach((estado) => { const option = document.createElement("option"); option.value = estado.clave; option.textContent = estado.nombre; select.appendChild(option); });
      const params = new URLSearchParams(window.location.search); select.value = params.get("estado") ?? "";
      select.addEventListener("change", () => { const nuevosParams = new URLSearchParams(window.location.search); if (select.value) nuevosParams.set("estado", select.value); else nuevosParams.delete("estado"); window.location.href = `${window.location.pathname}?${nuevosParams.toString()}`; });
      etiqueta.appendChild(select);
    };

    const cerrarSelectorConsulta = () => document.querySelector<HTMLElement>('[data-selector-consulta-nacional="true"]')?.remove();
    const mostrarSelectorConsulta = () => {
      if (!accesoNacional || estadosNacionales.length === 0) return; cerrarSelectorConsulta();
      const overlay = document.createElement("div"); overlay.dataset.selectorConsultaNacional = "true"; Object.assign(overlay.style,{position:"fixed",inset:"0",zIndex:"9999",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",background:"rgba(20,25,32,.48)",backdropFilter:"blur(3px)"});
      const tarjeta=document.createElement("section"); Object.assign(tarjeta.style,{width:"min(560px,100%)",background:"#fff",borderRadius:"18px",padding:"30px",boxShadow:"0 24px 70px rgba(0,0,0,.22)",border:"1px solid rgba(115,64,81,.14)"});
      const eyebrow=document.createElement("p"); eyebrow.textContent="Consulta nacional"; Object.assign(eyebrow.style,{margin:"0 0 8px",fontSize:".78rem",fontWeight:"800",letterSpacing:".08em",textTransform:"uppercase",color:"#7e374d"});
      const titulo=document.createElement("h2"); titulo.textContent="Seleccione el estado que desea consultar"; Object.assign(titulo.style,{margin:"0 0 10px",fontSize:"1.55rem"});
      const ayuda=document.createElement("p"); ayuda.textContent="Puede consultar un estado específico o visualizar todos los planteles registrados a nivel nacional."; Object.assign(ayuda.style,{margin:"0 0 22px",color:"#5f6670",lineHeight:"1.55"});
      const select=document.createElement("select"); Object.assign(select.style,{width:"100%",minHeight:"48px",padding:"0 14px",border:"1px solid #cfd3d8",borderRadius:"10px",fontSize:"1rem",background:"#fff"});
      const placeholder=document.createElement("option"); placeholder.value=""; placeholder.textContent="Seleccione un estado"; select.appendChild(placeholder); const todos=document.createElement("option"); todos.value="todos"; todos.textContent="Todos los estados"; select.appendChild(todos);
      estadosNacionales.forEach((estado)=>{const option=document.createElement("option");option.value=estado.clave;option.textContent=estado.nombre;select.appendChild(option);}); select.value=new URLSearchParams(window.location.search).get("consultaEstado")??"";
      const error=document.createElement("p"); error.textContent="Seleccione una opción para continuar."; Object.assign(error.style,{display:"none",margin:"8px 0 0",color:"#a32222",fontSize:".9rem"});
      const acciones=document.createElement("div"); Object.assign(acciones.style,{display:"flex",justifyContent:"flex-end",gap:"10px",marginTop:"24px"}); const cancelar=document.createElement("button"); cancelar.type="button"; cancelar.textContent="Cancelar"; Object.assign(cancelar.style,{padding:"11px 18px",borderRadius:"10px",border:"1px solid #cfd3d8",background:"#fff",fontWeight:"700"}); cancelar.addEventListener("click",cerrarSelectorConsulta);
      const continuar=document.createElement("button"); continuar.type="button"; continuar.textContent="Continuar"; Object.assign(continuar.style,{padding:"11px 20px",borderRadius:"10px",border:"0",background:"#7e374d",color:"#fff",fontWeight:"800"}); continuar.addEventListener("click",()=>{if(!select.value){error.style.display="block";select.focus();return;}const nombre=select.options[select.selectedIndex]?.textContent?.trim()??"";const p=new URLSearchParams(window.location.search);p.set("consultaEstado",select.value);p.set("consultaNombre",nombre);p.set("abrirConsulta","1");window.location.href=`${window.location.pathname}?${p.toString()}`;});
      acciones.append(cancelar,continuar); tarjeta.append(eyebrow,titulo,ayuda,select,error,acciones); overlay.appendChild(tarjeta); overlay.addEventListener("click",e=>{if(e.target===overlay)cerrarSelectorConsulta();}); document.body.appendChild(overlay); select.focus();
    };

    const actualizarTituloConsultaNacional=()=>{if(!accesoNacional||!document.body.textContent?.includes("CONSULTA DE PLANTELES PLS"))return;const p=new URLSearchParams(window.location.search);const valor=p.get("consultaEstado")??"";if(!valor)return;const nombre=p.get("consultaNombre")?.trim()||(valor==="todos"?"Todos los estados":estadosNacionales.find(e=>e.clave===valor)?.nombre??"");const titulo=document.querySelector<HTMLElement>(".consultation-view .portal-welcome h2");if(titulo&&nombre)titulo.textContent=`Planteles de ${nombre}`;};
    const agregarMonitoreo=()=>{if(!puedeVerMonitoreo)return;const grid=document.querySelector<HTMLElement>(".operation-grid");if(!grid||grid.querySelector('[data-monitoreo="true"]'))return;const boton=document.createElement("button");boton.type="button";boton.dataset.monitoreo="true";boton.setAttribute("aria-label","Avance de información");Object.assign(boton.style,{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",gap:"8px",paddingRight:"64px",paddingLeft:"64px"});boton.innerHTML=`<span aria-hidden="true" style="margin:0 auto 2px;"><svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20V8"/></svg></span><strong style="align-self:center;font-size:1.08rem;line-height:1.25;">Avance de información</strong><small style="align-self:center;margin-top:0;max-width:520px;text-align:center;">Monitoree la completitud nacional por estado, plantel y campo.</small>`;grid.appendChild(boton);};
    const abrirConsultaPendiente=()=>{const p=new URLSearchParams(window.location.search);if(p.get("abrirConsulta")!=="1")return;const boton=Array.from(document.querySelectorAll<HTMLButtonElement>(".operation-grid button")).find(i=>i.textContent?.toLowerCase().includes("consultar plantel"));if(!boton)return;p.delete("abrirConsulta");window.history.replaceState({},"",`${window.location.pathname}?${p.toString()}`);permitirConsultaNacional=true;boton.click();};
    const prepararPermisoMonitoreo=async()=>{const token=new URLSearchParams(window.location.search).get("token")?.trim()??"";if(!token)return;try{const response=await fetch("/api/access",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})});const data=await response.json();puedeVerMonitoreo=response.ok&&data?.valido===true&&data?.puedeVerMonitoreo===true;accesoNacional=response.ok&&data?.valido===true&&data?.accesoNacional===true;estadosNacionales=Array.isArray(data?.estados)?data.estados:[];actualizarInterfaz();}catch{puedeVerMonitoreo=false;accesoNacional=false;estadosNacionales=[];}};
    const actualizarInterfaz=()=>{resaltarPendientes();mejorarFormularioModificacion();prepararHistorialConsulta();agregarMonitoreo();agregarSelectorEstadoNacional();actualizarTituloConsultaNacional();abrirConsultaPendiente();};
    const observador=new MutationObserver(actualizarInterfaz);observador.observe(document.body,{childList:true,subtree:true,characterData:true});actualizarInterfaz();prepararPermisoMonitoreo();

    const handlePopState=()=>{if(historialConsultaPreparado&&document.body.textContent?.includes("CONSULTA DE PLANTELES PLS")){historialConsultaPreparado=false;const boton=Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(b=>b.textContent?.toLowerCase().includes("volver al menú"));boton?.click();}};
    window.addEventListener("popstate",handlePopState);
    const handleClick=(event:MouseEvent)=>{const target=event.target as HTMLElement|null;const button=target?.closest("button") as HTMLButtonElement|null;if(!button)return;const text=button.textContent?.toLowerCase()??"";if(accesoNacional&&text.includes("consultar plantel")){if(permitirConsultaNacional)permitirConsultaNacional=false;else{event.preventDefault();event.stopPropagation();mostrarSelectorConsulta();return;}}if(text.includes("volver al menú")&&document.body.textContent?.includes("CONSULTA DE PLANTELES PLS")){event.preventDefault();event.stopPropagation();const p=new URLSearchParams(window.location.search);const token=p.get("token")?.trim()??"";window.location.replace(token?`${window.location.pathname}?token=${encodeURIComponent(token)}`:window.location.pathname);return;}if(text.includes("volver al menú")&&document.body.textContent?.includes("Registro concluido")){event.preventDefault();event.stopPropagation();window.location.href=`${window.location.pathname}${window.location.search}`;return;}let ruta="";if(button.dataset.monitoreo==="true")ruta="/monitoreo";if(text.includes("solicitar modificación"))ruta="/modificar";if(text.includes("solicitar baja"))ruta="/baja";if(!ruta)return;event.preventDefault();event.stopPropagation();const p=new URLSearchParams(window.location.search);const token=p.get("token");window.location.href=token?`${ruta}?token=${encodeURIComponent(token)}`:ruta;};
    document.addEventListener("click",handleClick,true);
    return()=>{window.fetch=fetchOriginal;observador.disconnect();cerrarSelectorConsulta();document.removeEventListener("click",handleClick,true);window.removeEventListener("popstate",handlePopState);};
  },[]);
  return null;
}
