"use client";

import { useEffect } from "react";

const normalizar = (valor: unknown) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es-MX");

export default function ConsultaFilterBridge() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const estadoSeleccionado = params.get("consultaEstado")?.trim() ?? "";
    const nombreSeleccionado = params.get("consultaNombre")?.trim() ?? "";

    // Para consultas específicas guardamos la selección real en otro parámetro
    // y dejamos consultaEstado="todos" para que ningún filtro anterior vacíe la respuesta.
    if (estadoSeleccionado && estadoSeleccionado !== "todos" && nombreSeleccionado) {
      params.set("consultaFiltroEstado", estadoSeleccionado);
      params.set("consultaEstado", "todos");
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
    }

    const fetchOriginal = window.fetch.bind(window);

    const fetchFiltrado: typeof window.fetch = async (input, init) => {
      const response = await fetchOriginal(input, init);
      const url = typeof input === "string"
        ? input
        : input instanceof Request
          ? input.url
          : String(input);

      if (!url.includes("/api/planteles") || !response.ok) return response;

      const actuales = new URLSearchParams(window.location.search);
      const claveFiltro = actuales.get("consultaFiltroEstado")?.trim() ?? "";
      const nombreFiltro = actuales.get("consultaNombre")?.trim() ?? "";

      // "Todos los estados": no filtrar.
      if (!claveFiltro || !nombreFiltro) return response;

      try {
        const data = await response.clone().json();
        if (!Array.isArray(data?.planteles)) return response;

        const nombreBuscado = normalizar(nombreFiltro);
        const plantelesFiltrados = data.planteles.filter((plantel: Record<string, unknown>) => {
          const clave = String(plantel?.claveEstado ?? plantel?.ClaveEstado ?? "").trim();
          const nombre = normalizar(plantel?.estado ?? plantel?.Estado);
          return clave === claveFiltro || nombre === nombreBuscado;
        });

        const headers = new Headers(response.headers);
        headers.delete("content-length");
        headers.set("Content-Type", "application/json; charset=utf-8");

        return new Response(
          JSON.stringify({ ...data, planteles: plantelesFiltrados }),
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

    window.fetch = fetchFiltrado;

    return () => {
      if (window.fetch === fetchFiltrado) window.fetch = fetchOriginal;
    };
  }, []);

  return null;
}
