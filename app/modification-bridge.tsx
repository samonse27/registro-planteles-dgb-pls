"use client";

import { useEffect } from "react";

export default function ModificationBridge() {
  useEffect(() => {
    let puedeVerMonitoreo = false;

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

    const agregarMonitoreo = () => {
      if (!puedeVerMonitoreo) return;
      const grid = document.querySelector<HTMLElement>(".operation-grid");
      if (!grid || grid.querySelector('[data-monitoreo="true"]')) return;

      const boton = document.createElement("button");
      boton.type = "button";
      boton.dataset.monitoreo = "true";
      boton.innerHTML = `
        <span aria-hidden="true">▥</span>
        <strong>Calidad de la información</strong>
        <small>Monitoree la completitud nacional por estado, plantel y campo.</small>
        <span aria-hidden="true">→</span>
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
        agregarMonitoreo();
      } catch {
        puedeVerMonitoreo = false;
      }
    };

    const actualizarInterfaz = () => {
      resaltarPendientes();
      agregarMonitoreo();
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
