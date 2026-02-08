import { NextRequest, NextResponse } from "next/server";
import { getSheetData, Actividad } from "@/lib/googleSheets";
import { getSessionFromRequest } from "@/lib/auth";
import { Roles } from "@/lib/constants";

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const asistenteId = searchParams.get("asistente_id");

        // Fetch all logs
        const rows = await getSheetData("actividad!A2:J");
        let logs: Actividad[] = rows.map((row) => ({
            actividad_id: row[0],
            timestamp: row[1],
            asistente_id: row[2],
            cedula: row[3],
            user_id: row[4],
            tipo: row[5],
            detalle: row[6],
            estado_nuevo: row[7],
            respuesta_persona: row[8],
            nota: row[9]
        }));

        // Filter
        if (asistenteId) {
            logs = logs.filter(l => l.asistente_id === asistenteId);
        }

        // Sort desc
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return NextResponse.json(logs);

    } catch (error) {
        console.error("GET Actividad Error:", error);
        return NextResponse.json({ error: "Error fetching activity" }, { status: 500 });
    }
}
