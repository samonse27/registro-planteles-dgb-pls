import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const powerAutomateUrl = process.env.POWER_AUTOMATE_MONITOR_URL;
  if (!powerAutomateUrl) {
    return NextResponse.json(
      {
        valido: false,
        mensaje: "El módulo de monitoreo aún no está conectado a Power Automate.",
      },
      { status: 503 },
    );
  }

  const payload = await request.json().catch(() => null);
  const token = typeof payload?.token === "string" ? payload.token.trim() : "";

  if (!token) {
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
      mensaje: "No fue posible consultar la información de monitoreo.",
    }));

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        valido: false,
        mensaje: "No fue posible consultar el monitoreo en este momento.",
      },
      { status: 502 },
    );
  }
}
