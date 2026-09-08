import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const powerAutomateUrl = process.env.POWER_AUTOMATE_MODIFY_URL;
  if (!powerAutomateUrl) {
    return NextResponse.json(
      { ok: false, mensaje: "La solicitud de modificación aún no está conectada." },
      { status: 503 },
    );
  }

  const payload = await request.json().catch(() => null);
  const token = typeof payload?.token === "string" ? payload.token.trim() : "";
  const plantelId = typeof payload?.plantelId === "string" ? payload.plantelId.trim() : "";
  const motivo = typeof payload?.motivo === "string" ? payload.motivo.trim() : "";

  if (!token || !plantelId || !motivo) {
    return NextResponse.json(
      { ok: false, mensaje: "Faltan datos obligatorios para enviar la modificación." },
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
        { ok: false, mensaje: typeof data.mensaje === "string" ? data.mensaje : "Power Automate rechazó la solicitud." },
        { status: response.status },
      );
    }

    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json(
      { ok: false, mensaje: "No fue posible enviar la solicitud de modificación." },
      { status: 502 },
    );
  }
}
