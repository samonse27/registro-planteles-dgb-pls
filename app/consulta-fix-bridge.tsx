"use client";

import { useEffect } from "react";

const normalizar = (valor: unknown) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es-MX");

export default function ConsultaFixBridge() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const estadoElegido = params.get("consultaEstado")?.trim() ?? "";
    const nombreElegido = params.get("consultaNombre")?.trim() ?? "";

    if (estadoElegido && estadoElegido !== "todos" && nombreElegido) {
      params.set("consultaFiltroEstado", estadoElegido);
      params.set("consultaEstado", "todos");
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
    }

    const fetchAnterior = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await fetchAnterior(input, init);
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
        const actuales = new URLSearchParams(window.location.search);
        const filtroEstado = actuales.get("consultaFiltroEstado")?.trim() ?? "";
        const filtroNombre = actuales.get("consultaNombre")?.trim() ?? "";

        if (!filtroEstado || !filtroNombre || !Array.isArray(data?.planteles)) {
          return response;
        }

        const nombreBuscado = normalizar(filtroNombre);
        const planteles = data.planteles.filter((plantel: Record<string, unknown>) => {
          const nombrePlantel = normalizar(plantel?.estado ?? plantel?.Estado);
          const clavePlantel = String(plantel?.claveEstado ?? plantel?.ClaveEstado ?? "").trim();
          return nombrePlantel === nombreBuscado || clavePlantel === filtroEstado;
        });

        const headers = new Headers(response.headers);
        headers.delete("content-length");
        headers.set("Content-Type", "application/json; charset=utf-8");

        return new Response(JSON.stringify({ ...data, planteles }), {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      } catch {
        return response;
      }
    };

    return () => {
      window.fetch = fetchAnterior;
    };
  }, []);

  return null;
}
