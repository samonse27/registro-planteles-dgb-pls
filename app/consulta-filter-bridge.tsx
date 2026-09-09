"use client";

import { useEffect } from "react";

export default function ConsultaFilterBridge() {
  useEffect(() => {
    const fetchOriginal = window.fetch.bind(window);

    const fetchFiltrado: typeof window.fetch = async (input, init) => {
      const response = await fetchOriginal(input, init);
      const url = typeof input === "string"
        ? input
        : input instanceof Request
          ? input.url
          : String(input);

      if (!url.includes("/api/planteles")) return response;

      const consultaEstado = new URLSearchParams(window.location.search)
        .get("consultaEstado")
        ?.trim() ?? "";

      if (!consultaEstado || consultaEstado === "todos") return response;

      try {
        const data = await response.clone().json();
        if (!Array.isArray(data?.planteles)) return response;

        const plantelesFiltrados = data.planteles.filter((plantel: Record<string, unknown>) => {
          const clave = String(plantel?.claveEstado ?? plantel?.ClaveEstado ?? "").trim();
          return clave === consultaEstado;
        });

        return new Response(
          JSON.stringify({ ...data, planteles: plantelesFiltrados }),
          {
            status: response.status,
            statusText: response.statusText,
            headers: new Headers(response.headers),
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
