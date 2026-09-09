"use client";

import { useEffect } from "react";

type EstadoPermitido = { clave: string; nombre: string };

export default function ModificationBridge() {
  useEffect(() => {
    let puedeVerMonitoreo = false;
    let accesoNacional = false;
    let estadosNacionales: EstadoPermitido[] = [];

    const resaltarPendientes = () => {
      const esAlta = document.body.textContent?.includes("ALTA DE PLANTELES PLS");
      if (!esAlta) return;

      document.querySelectorAll<HTMLElement>(".review-data-grid dd").forEach((elemento) => {
        const texto = elemento.textContent?.trim().toLowerCase() ?? "";
        const pendiente = texto.startsWith("pendiente") || texto === "sin respuesta";

        if (pendiente) {
          elemento.style.fontWeight = "800";
        } else {
          elemento.style.removeProperty("font-weight");
        }
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
    };

    const observador = new MutationObserver(actualizarInterfaz);
    observador.observe(document.body, { childList: true, subtree: true, characterData: true });
    actualizarInterfaz();
    prepararPermisoMonitoreo();

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button) return;

      const text = button.textContent?.toLowerCase() ?? "";

      if (
        text.includes("volver al menú") &&
        document.body.textContent?.includes("Registro concluido")
      ) {
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
      observador.disconnect();
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}
