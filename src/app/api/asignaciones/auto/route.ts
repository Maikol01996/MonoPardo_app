import { NextRequest, NextResponse } from "next/server";
import { getAllAsignaciones, getBasesConsulta, appendSheetRow, updateSheetRow } from "@/lib/googleSheets";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const count = body.count || 5;
    const userId = session.userId as string;

    // 1. Get all existing assignments to specific users
    const asignaciones = await getAllAsignaciones();
    const assignedIds = new Set(asignaciones.map(a => a.cedula)); // Using cedula as unique key given Base structure

    // 2. Get available people
    const allPeople = await getBasesConsulta();

    // 3. Filter unassigned
    const available = allPeople.filter(p => !assignedIds.has(p.cedula));

    // 4. Take N
    const toAssign = available.slice(0, count);

    if (toAssign.length === 0) {
        return NextResponse.json({ message: "No more records available", count: 0 });
    }

    // 5. Create assignments
    // Range: asignaciones!A:G
    // asignacion_id, asistente_id, cedula, user_id, asignado_por_user_id, asignado_en, activo
    const promises = toAssign.map(p => {
        const id = crypto.randomUUID();
        return appendSheetRow("asignaciones!A:G", [
            id,
            p.id,
            p.cedula,
            userId,      // assigning to self
            "SYSTEM",    // assigned by SYSTEM
            new Date().toISOString(),
            "TRUE"
        ]);
    });

    await Promise.all(promises);

    return NextResponse.json({ count: toAssign.length, assigned: toAssign });
}
