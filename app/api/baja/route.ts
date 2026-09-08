import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const powerAutomateUrl = process.env.POWER_AUTOMATE_BAJA_URL;

  if (!powerAutomateUrl) {
    return NextResponse.json(
      { ok: false, mensaje: "La baja de planteles aún no está conectada." },
      { status: 503 },
    );
  }

  const payload = await request.json().catch(() => null);
  const token = typeof payload?.token === "string" ? payload.token.trim() : "";
  const plantelId = typeof payload?.plantelId === "string" ? payload.plantelId.trim() : "";
  const motivoBaja = typeof payload?.motivoBaja === "string" ? payload.motivoBaja.trim() : "";
  const especificacionOtro = typeof payload?.especificacionOtro === "string" ? payload.especificacionOtro.trim() : "";

  if (!token || !plantelId || !motivoBaja) {
    return NextResponse.json(
      { ok: false, mensaje: "Faltan datos obligatorios para registrar la baja." },
      { status: 400 },
    );
  }

  if (motivoBaja === "Otro" && !especificacionOtro) {
    return NextResponse.json(
      { ok: false, mensaje: "Especifique el motivo de la baja." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(powerAutomateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await response.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? JSON.parse(text) as Record<string, unknown> : {};
    } catch {}

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: typeof data.mensaje === "string"
            ? data.mensaje
            : "Power Automate rechazó la baja.",
        },
        { status: response.status },
      );
    }

    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json(
      { ok: false, mensaje: "No fue posible registrar la baja del plantel." },
      { status: 502 },
    );
  }
}
