"use client";

import { useEffect } from "react";

export default function ModificationBridge() {
  useEffect(() => {
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

    const observador = new MutationObserver(resaltarPendientes);
    observador.observe(document.body, { childList: true, subtree: true, characterData: true });
    resaltarPendientes();

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
