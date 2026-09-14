"use client";

import { useEffect } from "react";

const TEXTO_ORIGINAL = "Aulas didácticas";
const TEXTO_NUEVO = "Computadoras para alumnos";

export default function LabelPatch() {
  useEffect(() => {
    const reemplazar = () => {
      document.querySelectorAll<HTMLElement>("dt, label").forEach((elemento) => {
        if (elemento.tagName === "DT" && elemento.textContent?.trim() === TEXTO_ORIGINAL) {
          elemento.textContent = TEXTO_NUEVO;
          return;
        }

        if (elemento.tagName === "LABEL") {
          for (const nodo of Array.from(elemento.childNodes)) {
            if (nodo.nodeType !== Node.TEXT_NODE) continue;
            const texto = nodo.textContent ?? "";
            if (texto.trim().startsWith(TEXTO_ORIGINAL)) {
              nodo.textContent = texto.replace(TEXTO_ORIGINAL, TEXTO_NUEVO);
              break;
            }
          }
        }
      });
    };

    reemplazar();
    const observador = new MutationObserver(reemplazar);
    observador.observe(document.body, { childList: true, subtree: true });
    return () => observador.disconnect();
  }, []);

  return null;
}
