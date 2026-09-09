import { NextResponse } from "next/server";

type EstadoPermitido = { clave: string; nombre: string };
type MunicipioPermitido = { clave: string; nombre: string; claveEstado?: string };

export async function POST(request: Request) {
  const powerAutomateUrl = process.env.POWER_AUTOMATE_VALIDATE_URL;
  if (!powerAutomateUrl) {
    return NextResponse.json(
      { valido: false, mensaje: "La validación de acceso aún no está configurada." },
      { status: 503 },
    );
  }

  const payload = await request.json().catch(() => null);
  const token = typeof payload?.token === "string" ? payload.token.trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
    return NextResponse.json(
      { valido: false, mensaje: "El enlace de acceso no es válido." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(powerAutomateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({
      valido: false,
      mensaje: "No fue posible validar el enlace.",
    }));

    if (
      response.ok &&
      data?.valido === true &&
      String(data?.estado?.clave ?? "") === "00"
    ) {
      const estados: EstadoPermitido[] = Array.isArray(data.estados) ? data.estados : [];
      const municipios: MunicipioPermitido[] = Array.isArray(data.municipios) ? data.municipios : [];
      const referer = request.headers.get("referer") ?? "";
      let claveSeleccionada = "";

      try {
        claveSeleccionada = referer ? new URL(referer).searchParams.get("estado")?.trim() ?? "" : "";
      } catch {
        claveSeleccionada = "";
      }

      const estadoSeleccionado = estados.find((item) => item.clave === claveSeleccionada);

      if (estadoSeleccionado) {
        return NextResponse.json(
          {
            ...data,
            accesoNacional: true,
            estado: estadoSeleccionado,
            estados,
            municipios: municipios.filter((item) => item.claveEstado === estadoSeleccionado.clave),
          },
          { status: response.status },
        );
      }

      return NextResponse.json(
        { ...data, accesoNacional: true, estados, municipios },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { valido: false, mensaje: "No fue posible validar el enlace en este momento." },
      { status: 502 },
    );
  }
}
