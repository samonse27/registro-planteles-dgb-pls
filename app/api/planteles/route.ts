import { NextResponse } from "next/server";

const textoSeguro = (valor: unknown) => {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "string") return valor;
  if (typeof valor === "number" || typeof valor === "boolean") return String(valor);
  return "";
};

const booleanoSeguro = (valor: unknown): boolean | null => {
  if (valor === true || valor === false) return valor;
  if (typeof valor === "string") {
    const normalizado = valor.trim().toLowerCase();
    if (["si", "sí", "true", "1", "yes"].includes(normalizado)) return true;
    if (["no", "false", "0"].includes(normalizado)) return false;
  }
  return null;
};

const normalizarPlantel = (plantel: unknown) => {
  const p = plantel && typeof plantel === "object" ? plantel as Record<string, unknown> : {};
  return {
    plantelId: textoSeguro(p.plantelId ?? p.PlantelID ?? p.ID),
    estado: textoSeguro(p.estado ?? p.Estado),
    claveEstado: textoSeguro(p.claveEstado ?? p.ClaveEstado),
    municipio: textoSeguro(p.municipio ?? p.Municipio),
    nombrePlantel: textoSeguro(p.nombrePlantel ?? p.NombrePlantel ?? p.Title),
    direccion: textoSeguro(p.direccion ?? p.direccionPlantel ?? p.DireccionPlantel),
    latitud: textoSeguro(p.latitud ?? p.Latitud),
    longitud: textoSeguro(p.longitud ?? p.Longitud),
    codigoPostal: textoSeguro(p.codigoPostal ?? p.CodigoPostal),
    linkGoogleMaps: textoSeguro(p.linkGoogleMaps ?? p.LinkGoogleMaps),
    aulasDidacticas: p.aulasDidacticas ?? p.AulasDidacticas ?? null,
    capacidadPorAula: p.capacidadPorAula ?? p.CapacidadPorAula ?? null,
    capacidadInstalada: p.capacidadInstalada ?? p.CapacidadInstalada ?? null,
    computadoras: p.computadoras ?? p.Computadoras ?? null,
    agua: booleanoSeguro(p.agua ?? p.Agua),
    luz: booleanoSeguro(p.luz ?? p.Luz),
    internet: booleanoSeguro(p.internet ?? p.Internet),
    drenaje: booleanoSeguro(p.drenaje ?? p.Drenaje),
    equipoComputo: booleanoSeguro(p.equipoComputo ?? p.EquipoComputo),
    laboratorio: booleanoSeguro(p.laboratorio ?? p.Laboratorio),
    banos: booleanoSeguro(p.banos ?? p.Banos ?? p.Baños),
    espacioAdministrativo: booleanoSeguro(p.espacioAdministrativo ?? p.EspacioAdministrativo),
    movilidad: textoSeguro(p.movilidad ?? p.Movilidad),
    horario: textoSeguro(p.horario ?? p.Horario),
    activo: booleanoSeguro(p.activo ?? p.Activo),
    fechaActualizacion: textoSeguro(p.fechaActualizacion ?? p.FechaActualizacion),
    motivoActual: textoSeguro(p.motivoActual ?? p.MotivoActual),
    estadoRevision: textoSeguro(p.estadoRevision ?? p.EstadoRevision),
    versionActual: p.versionActual ?? p.VersionActual ?? null,
  };
};

export async function POST(request: Request) {
  const powerAutomateUrl = process.env.POWER_AUTOMATE_QUERY_URL;
  if (!powerAutomateUrl) {
    return NextResponse.json(
      { valido: false, mensaje: "La consulta de planteles aún no está configurada." },
      { status: 503 },
    );
  }

  const payload = await request.json().catch(() => null);
  const token = typeof payload?.token === "string" ? payload.token.trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
    return NextResponse.json({ valido: false, mensaje: "El enlace de acceso no es válido." }, { status: 400 });
  }

  try {
    const response = await fetch(powerAutomateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });

    const texto = await response.text();
    let data: Record<string, unknown>;
    try {
      data = texto ? JSON.parse(texto) as Record<string, unknown> : {};
    } catch {
      return NextResponse.json(
        { valido: false, mensaje: "El flujo de consulta devolvió una respuesta no válida." },
        { status: 502 },
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          valido: false,
          mensaje: textoSeguro(data.mensaje) || `Power Automate rechazó la consulta (${response.status}).`,
        },
        { status: response.status },
      );
    }

    let planteles = Array.isArray(data.planteles)
      ? data.planteles
          .map(normalizarPlantel)
          .filter((plantel) => plantel.activo !== false)
      : [];

    let consultaEstado = typeof payload?.consultaEstado === "string" ? payload.consultaEstado.trim() : "";
    if (!consultaEstado) {
      const referer = request.headers.get("referer") ?? "";
      try {
        consultaEstado = referer ? new URL(referer).searchParams.get("consultaEstado")?.trim() ?? "" : "";
      } catch {
        consultaEstado = "";
      }
    }

    if (consultaEstado && consultaEstado !== "todos") {
      planteles = planteles.filter((plantel) => plantel.claveEstado.trim() === consultaEstado);
    }

    return NextResponse.json({
      ...data,
      valido: data.valido !== false,
      consultaEstado,
      planteles,
    });
  } catch {
    return NextResponse.json(
      { valido: false, mensaje: "No fue posible consultar los planteles en este momento." },
      { status: 502 },
    );
  }
}
