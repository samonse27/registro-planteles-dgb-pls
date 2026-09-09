"use client";

import { useEffect } from "react";

type EstadoPermitido = { clave: string; nombre: string };

export default function ModificationBridge() {
  useEffect(() => {
    let puedeVerMonitoreo = false;
    let accesoNacional = false;
    let estadosNacionales: EstadoPermitido[] = [];
    let permitirConsultaNacional = false;

    const fetchOriginal = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await fetchOriginal(input, init);
      const url = typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input instanceof Request
            ? input.url
            : "";

      if (!url.includes("/api/planteles") || !response.ok) return response;

      try {
        const data = await response.clone().json();
        const consultaEstado = new URLSearchParams(window.location.search).get("consultaEstado")?.trim() ?? "";

        if (!consultaEstado || consultaEstado === "todos" || !Array.isArray(data?.planteles)) {
          return response;
        }

        const plantelesFiltrados = data.planteles.filter((plantel: Record<string, unknown>) =>
          String(plantel?.claveEstado ?? plantel?.ClaveEstado ?? "").trim() === consultaEstado
        );

        const headers = new Headers(response.headers);
        headers.delete("content-length");
        headers.set("Content-Type", "application/json; charset=utf-8");

        return new Response(
          JSON.stringify({ ...data, planteles: plantelesFiltrados, consultaEstado }),
          {
            status: response.status,
            statusText: response.statusText,
            headers,
          },
        );
      } catch {
        return response;
      }
    };

    const resaltarPendientes = () => {
      const esAlta = document.body.textContent?.includes("ALTA DE PLANTELES PLS");
      if (!esAlta) return;

      document.querySelectorAll<HTMLElement>(".review-data-grid dd").forEach((elemento) => {
        const texto = elemento.textContent?.trim().toLowerCase() ?? "";
        const pendiente = texto.startsWith("pendiente") || texto === "sin respuesta";

        if (pendiente) elemento.style.fontWeight = "800";
        else elemento.style.removeProperty("font-weight");
      });
    };

    const agregarSelectorEstadoNacional = () => {
      if (!accesoNacional || estadosNacionales.length === 0) return;
      if (!document.body.textContent?.includes("Seleccione los municipios")) return;

      const contenedor = document.querySelector<HTMLElement>(".two-columns");
      if (!contenedor) return;

      const etiqueta = contenedor.querySelector<HTMLLabelElement>("label");
      if (!etiqueta || etiqueta.dataset.selectorNacional === "true") return;

      const input = etiqueta.querySelector<HTMLInputElement>("input.locked-field");
      if (!input) return;

      etiqueta.dataset.selectorNacional = "true";
      input.style.display = "none";

      const texto = Array.from(etiqueta.childNodes).find((nodo) => nodo.nodeType === Node.TEXT_NODE);
      if (texto) texto.textContent = "Estado ";

      const requerido = document.createElement("b");
      requerido.textContent = "*";
      etiqueta.insertBefore(requerido, input);

      const select = document.createElement("select");
      select.setAttribute("aria-label", "Seleccione un estado");
      select.style.width = "100%";
      select.style.marginTop = "8px";

      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Seleccione un estado";
      select.appendChild(placeholder);

      estadosNacionales.forEach((estado) => {
        const option = document.createElement("option");
        option.value = estado.clave;
        option.textContent = estado.nombre;
        select.appendChild(option);
      });

      const params = new URLSearchParams(window.location.search);
      select.value = params.get("estado") ?? "";

      select.addEventListener("change", () => {
        const nuevosParams = new URLSearchParams(window.location.search);
        if (select.value) nuevosParams.set("estado", select.value);
        else nuevosParams.delete("estado");
        window.location.href = `${window.location.pathname}?${nuevosParams.toString()}`;
      });

      etiqueta.appendChild(select);
    };

    const cerrarSelectorConsulta = () => {
      document.querySelector<HTMLElement>('[data-selector-consulta-nacional="true"]')?.remove();
    };

    const mostrarSelectorConsulta = () => {
      if (!accesoNacional || estadosNacionales.length === 0) return;
      cerrarSelectorConsulta();

      const overlay = document.createElement("div");
      overlay.dataset.selectorConsultaNacional = "true";
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.zIndex = "9999";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.padding = "24px";
      overlay.style.background = "rgba(20, 25, 32, 0.48)";
      overlay.style.backdropFilter = "blur(3px)";

      const tarjeta = document.createElement("section");
      tarjeta.style.width = "min(560px, 100%)";
      tarjeta.style.background = "#ffffff";
      tarjeta.style.borderRadius = "18px";
      tarjeta.style.padding = "30px";
      tarjeta.style.boxShadow = "0 24px 70px rgba(0,0,0,.22)";
      tarjeta.style.border = "1px solid rgba(115, 64, 81, .14)";

      const eyebrow = document.createElement("p");
      eyebrow.textContent = "Consulta nacional";
      eyebrow.style.margin = "0 0 8px";
      eyebrow.style.fontSize = ".78rem";
      eyebrow.style.fontWeight = "800";
      eyebrow.style.letterSpacing = ".08em";
      eyebrow.style.textTransform = "uppercase";
      eyebrow.style.color = "#7e374d";

      const titulo = document.createElement("h2");
      titulo.textContent = "Seleccione el estado que desea consultar";
      titulo.style.margin = "0 0 10px";
      titulo.style.fontSize = "1.55rem";

      const ayuda = document.createElement("p");
      ayuda.textContent = "Puede consultar un estado específico o visualizar todos los planteles registrados a nivel nacional.";
      ayuda.style.margin = "0 0 22px";
      ayuda.style.color = "#5f6670";
      ayuda.style.lineHeight = "1.55";

      const select = document.createElement("select");
      select.style.width = "100%";
      select.style.minHeight = "48px";
      select.style.padding = "0 14px";
      select.style.border = "1px solid #cfd3d8";
      select.style.borderRadius = "10px";
      select.style.fontSize = "1rem";
      select.style.background = "#fff";

      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Seleccione un estado";
      select.appendChild(placeholder);

      const todos = document.createElement("option");
      todos.value = "todos";
      todos.textContent = "Todos los estados";
      select.appendChild(todos);

      estadosNacionales.forEach((estado) => {
        const option = document.createElement("option");
        option.value = estado.clave;
        option.textContent = estado.nombre;
        select.appendChild(option);
      });

      const params = new URLSearchParams(window.location.search);
      select.value = params.get("consultaEstado") ?? "";

      const error = document.createElement("p");
      error.textContent = "Seleccione una opción para continuar.";
      error.style.display = "none";
      error.style.margin = "8px 0 0";
      error.style.color = "#a32222";
      error.style.fontSize = ".9rem";

      const acciones = document.createElement("div");
      acciones.style.display = "flex";
      acciones.style.justifyContent = "flex-end";
      acciones.style.gap = "10px";
      acciones.style.marginTop = "24px";

      const cancelar = document.createElement("button");
      cancelar.type = "button";
      cancelar.textContent = "Cancelar";
      cancelar.style.padding = "11px 18px";
      cancelar.style.borderRadius = "10px";
      cancelar.style.border = "1px solid #cfd3d8";
      cancelar.style.background = "#fff";
      cancelar.style.fontWeight = "700";
      cancelar.addEventListener("click", cerrarSelectorConsulta);

      const continuar = document.createElement("button");
      continuar.type = "button";
      continuar.textContent = "Continuar";
      continuar.style.padding = "11px 20px";
      continuar.style.borderRadius = "10px";
      continuar.style.border = "0";
      continuar.style.background = "#7e374d";
      continuar.style.color = "#fff";
      continuar.style.fontWeight = "800";
      continuar.addEventListener("click", () => {
        if (!select.value) {
          error.style.display = "block";
          select.focus();
          return;
        }

        const nombreSeleccionado = select.options[select.selectedIndex]?.textContent?.trim() ?? "";
        const nuevosParams = new URLSearchParams(window.location.search);
        nuevosParams.set("consultaEstado", select.value);
        nuevosParams.set("consultaNombre", nombreSeleccionado);
        nuevosParams.set("abrirConsulta", "1");
        window.location.href = `${window.location.pathname}?${nuevosParams.toString()}`;
      });

      acciones.append(cancelar, continuar);
      tarjeta.append(eyebrow, titulo, ayuda, select, error, acciones);
      overlay.appendChild(tarjeta);
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) cerrarSelectorConsulta();
      });
      document.body.appendChild(overlay);
      select.focus();
    };

    const actualizarTituloConsultaNacional = () => {
      if (!accesoNacional) return;
      if (!document.body.textContent?.includes("CONSULTA DE PLANTELES PLS")) return;

      const params = new URLSearchParams(window.location.search);
      const valor = params.get("consultaEstado") ?? "";
      if (!valor) return;

      const nombreEnUrl = params.get("consultaNombre")?.trim() ?? "";
      const nombre = nombreEnUrl || (valor === "todos"
        ? "Todos los estados"
        : estadosNacionales.find((estado) => estado.clave === valor)?.nombre ?? "");
      if (!nombre) return;

      const titulo = document.querySelector<HTMLElement>(".consultation-view .portal-welcome h2");
      if (titulo && titulo.textContent !== `Planteles de ${nombre}`) titulo.textContent = `Planteles de ${nombre}`;
    };

    const agregarMonitoreo = () => {
      if (!puedeVerMonitoreo) return;
      const grid = document.querySelector<HTMLElement>(".operation-grid");
      if (!grid || grid.querySelector('[data-monitoreo="true"]')) return;

      const boton = document.createElement("button");
      boton.type = "button";
      boton.dataset.monitoreo = "true";
      boton.setAttribute("aria-label", "Avance de información");
      boton.style.display = "flex";
      boton.style.flexDirection = "column";
      boton.style.alignItems = "center";
      boton.style.justifyContent = "center";
      boton.style.textAlign = "center";
      boton.style.gap = "8px";
      boton.style.paddingRight = "64px";
      boton.style.paddingLeft = "64px";

      boton.innerHTML = `
        <span aria-hidden="true" style="margin:0 auto 2px;">
          <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 20V10" />
            <path d="M10 20V4" />
            <path d="M16 20v-7" />
            <path d="M22 20V8" />
          </svg>
        </span>
        <strong style="align-self:center;font-size:1.08rem;line-height:1.25;">Avance de información</strong>
        <small style="align-self:center;margin-top:0;max-width:520px;text-align:center;">Monitoree la completitud nacional por estado, plantel y campo.</small>
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;right:22px;top:50%;transform:translateY(-50%);color:#a57f2c;">
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      `;
      grid.appendChild(boton);
    };

    const abrirConsultaPendiente = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("abrirConsulta") !== "1") return;

      const boton = Array.from(document.querySelectorAll<HTMLButtonElement>(".operation-grid button"))
        .find((item) => item.textContent?.toLowerCase().includes("consultar plantel"));
      if (!boton) return;

      params.delete("abrirConsulta");
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
      permitirConsultaNacional = true;
      boton.click();
    };

    const prepararPermisoMonitoreo = async () => {
      const token = new URLSearchParams(window.location.search).get("token")?.trim() ?? "";
      if (!token) return;

      try {
        const response = await fetch("/api/access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        puedeVerMonitoreo = response.ok && data?.valido === true && data?.puedeVerMonitoreo === true;
        accesoNacional = response.ok && data?.valido === true && data?.accesoNacional === true;
        estadosNacionales = Array.isArray(data?.estados) ? data.estados : [];
        agregarMonitoreo();
        agregarSelectorEstadoNacional();
        actualizarTituloConsultaNacional();
        abrirConsultaPendiente();
      } catch {
        puedeVerMonitoreo = false;
        accesoNacional = false;
        estadosNacionales = [];
      }
    };

    const actualizarInterfaz = () => {
      resaltarPendientes();
      agregarMonitoreo();
      agregarSelectorEstadoNacional();
      actualizarTituloConsultaNacional();
      abrirConsultaPendiente();
    };

    const observador = new MutationObserver(actualizarInterfaz);
    observador.observe(document.body, { childList: true, subtree: true, characterData: true });
    actualizarInterfaz();
    prepararPermisoMonitoreo();

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button") as HTMLButtonElement | null;
      if (!button) return;

      const text = button.textContent?.toLowerCase() ?? "";

      if (accesoNacional && text.includes("consultar plantel")) {
        if (permitirConsultaNacional) permitirConsultaNacional = false;
        else {
          event.preventDefault();
          event.stopPropagation();
          mostrarSelectorConsulta();
          return;
        }
      }

      if (text.includes("volver al menú") && document.body.textContent?.includes("CONSULTA DE PLANTELES PLS")) {
        event.preventDefault();
        event.stopPropagation();
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token")?.trim() ?? "";
        window.location.replace(token
          ? `${window.location.pathname}?token=${encodeURIComponent(token)}`
          : window.location.pathname);
        return;
      }

      if (text.includes("volver al menú") && document.body.textContent?.includes("Registro concluido")) {
        event.preventDefault();
        event.stopPropagation();
        window.location.href = `${window.location.pathname}${window.location.search}`;
        return;
      }

      let ruta = "";
      if (button.dataset.monitoreo === "true") ruta = "/monitoreo";
      if (text.includes("solicitar modificación")) ruta = "/modificar";
      if (text.includes("solicitar baja")) ruta = "/baja";
      if (!ruta) return;

      event.preventDefault();
      event.stopPropagation();

      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      window.location.href = token ? `${ruta}?token=${encodeURIComponent(token)}` : ruta;
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      window.fetch = fetchOriginal;
      observador.disconnect();
      cerrarSelectorConsulta();
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}
