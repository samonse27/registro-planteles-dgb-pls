"use client";

import { useEffect } from "react";

const ETIQUETA_ERRONEA = "Computadoras para alumnos";
const AULAS_DIDACTICAS = "Aulas didácticas";
const AULAS_COMPUTO = "Aulas de cómputo";
const COMPUTADORA_ALUMNOS = "Computadora para alumnos";

export default function LabelPatch() {
  useEffect(() => {
    const reemplazar = () => {
      document.querySelectorAll<HTMLElement>("dt, label, legend").forEach((elemento) => {
        const textoCompleto = elemento.textContent?.trim() ?? "";

        if (elemento.tagName === "DT") {
          if (textoCompleto === ETIQUETA_ERRONEA) elemento.textContent = AULAS_DIDACTICAS;
          if (textoCompleto === AULAS_COMPUTO) elemento.textContent = COMPUTADORA_ALUMNOS;
          return;
        }

        if (elemento.tagName === "LEGEND") {
          for (const nodo of Array.from(elemento.childNodes)) {
            if (nodo.nodeType !== Node.TEXT_NODE) continue;
            const texto = nodo.textContent ?? "";
            if (texto.trim().startsWith(AULAS_COMPUTO)) {
              nodo.textContent = texto.replace(AULAS_COMPUTO, COMPUTADORA_ALUMNOS);
              break;
            }
          }
          return;
        }

        if (elemento.tagName === "LABEL") {
          for (const nodo of Array.from(elemento.childNodes)) {
            if (nodo.nodeType !== Node.TEXT_NODE) continue;
            const texto = nodo.textContent ?? "";
            if (texto.trim().startsWith(ETIQUETA_ERRONEA)) {
              nodo.textContent = texto.replace(ETIQUETA_ERRONEA, AULAS_DIDACTICAS);
              break;
            }
          }
        }
      });
    };

    reemplazar();
    const observador = new MutationObserver(reemplazar);
    observador.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observador.disconnect();
  }, []);

  return null;
}
