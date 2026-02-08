import { NextRequest, NextResponse } from "next/server";
import { getAllAsignaciones, appendSheetRow, updateSheetRow, getSheetData } from "@/lib/googleSheets";
import { getSessionFromRequest } from "@/lib/auth";
import { Roles } from "@/lib/constants";

export async function GET(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session || session.rol !== Roles.ADMIN) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const asignaciones = await getAllAsignaciones();
    return NextResponse.json(asignaciones);
}

export async function POST(req: NextRequest) {
    // Create Assignment
    const session = await getSessionFromRequest(req);
    if (!session || session.rol !== Roles.ADMIN) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { asistente_id, result_cedula, user_id } = body;
    // result_cedula because sometimes we map by cedula

    if ((!asistente_id && !result_cedula) || !user_id) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if invalid logic...
    // We assume validation on front.

    const id = crypto.randomUUID();
    // asignacion_id, asistente_id, cedula, user_id, asignado_por_user_id, asignado_en, activo
    const values = [
        id,
        asistente_id || "",
        result_cedula || "",
        user_id,
        session.userId,
        new Date().toISOString(),
        "TRUE"
    ];

    await appendSheetRow("asignaciones!A:G", values);
    return NextResponse.json({ success: true, id });
}
