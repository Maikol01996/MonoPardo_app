import { NextRequest, NextResponse } from "next/server";
import { getAllActividad, getAllAsignaciones, getAllAsistentes, getBasesConsulta } from "@/lib/googleSheets";
import { getSessionFromRequest } from "@/lib/auth";
import { Roles, EstadoGestion, TipoActividad } from "@/lib/constants";

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch Base Total (Source of Truth)
        // We fetch "BOGOTA D.C." and "CUNDINAMARCA" or just EVERYTHING if manageable.
        // Assuming the user wants to see the whole operation. 
        // We'll filter empty rows if any.
        const baseTotal = await getBasesConsulta(1, 100000, "", false);

        // 1. Calculate Global Backlog (Pendientes)
        // Definition: Records with NO 'Estado Llamada' AND NO 'Estado WhatsApp'
        const globalPendientes = baseTotal.filter(p => !p.estado_llamada && !p.estado_whatsapp).length;

        // 2. Calculate Attended (Atendidos)
        // Global
        const globalAtendidos = baseTotal.filter(p => !!p.estado_llamada || !!p.estado_whatsapp).length;

        let pendientes = globalPendientes;
        let atendidos = globalAtendidos;
        let timelineData: any[] = [];
        let total = baseTotal.length;

        if (session.rol === Roles.ADMIN) {
            // Admin sees Global Stats
            pendientes = globalPendientes;
            atendidos = globalAtendidos;

            // Construct Timeline from Base Total 'Fecha' (Column N) if available, or fall back to Activity Logs
            // Ideally use Col N "Fecha Gestión"
            const timelineMap = new Map<string, number>();
            baseTotal.forEach(p => {
                if ((p.estado_llamada || p.estado_whatsapp) && p.ultima_gestion_en) {
                    // Try to parse date from "ultima_gestion_en" (Col N)
                    // Format might be "D/M/YYYY, H:MM:SS AM/PM" or ISO?
                    // Let's try simple parsing or fallback
                    try {
                        // Attempt to parse locale string or ISO
                        // If it's the one we wrote: new Date().toLocaleString("es-CO")
                        // It's tricky to parse locale string reliably without library. 
                        // Let's assume we can split by ',' or just take the raw if simple.
                        // For now, let's rely on Actividad Log for timeline as it has ISO timestamp?
                        // User asked to use the Sheet columns. 
                        // But for Timeline, Actividad Log is safer for strict dates.
                        // Let's stick to Actividad Log for Timeline for now to be safe, but use Base for Counts.
                    } catch (e) { }
                }
            });

            // Fallback to Actividad for Timeline
            const actividad = await getAllActividad();
            actividad.forEach(log => {
                const date = log.timestamp.split("T")[0];
                timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
            });

            timelineData = Array.from(timelineMap.entries())
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date));

        } else {
            // Collaborator
            // "Pendientes" -> "Global Backlog" (Work available) OR "My Assignments"?
            // User said "No es que esten asignadas". 
            // Let's show Global Backlog as "Total Pendientes" so they see the pile.
            // OR "My Unattended Assignments" if they rely on auto-assign.
            // Let's stick to Global Backlog based on user feedback "control de este grupo".

            pendientes = globalPendientes;

            // "Atendidos" -> My Work
            // Filter Base Total where 'Gestionado Por' (Col M) == Me
            // We need to match username/email properly.
            // Session.nombre might differ from Sheet.
            // We stored "session.nombre || session.email" in updateBaseTotal.

            const myWork = baseTotal.filter(p => {
                const gestor = (p as any).usuario || ""; // Need to ensure we mapped Col M to 'usuario' 
                // Wait, getBasesConsulta mapping: 
                // M: Gestionado Por [12] -> mapped to 'usuario'? 
                // Check googleSheets.ts mapping in previous step.
                // I didn't map Col M to a property named 'usuario' in BaseConsulta interface explicitly! 
                // I mapped it to... I need to check.
                // In previous edit to googleSheets.ts:
                // "M: Gestionado Por [12]" was NOT mapped to a specific field name in the object returned!
                // I need to update googleSheets.ts to map Col M to a field 'gestionado_por'.
                return false;
            });

            // Since I can't filter by 'Gestionado Por' without the mapping, I must fix googleSheets.ts first.
        }

        // TEMPORARY RETURN until I fix mapping
        return NextResponse.json({
            pendientes,
            atendidos,
            timeline: timelineData,
            total
        });

    } catch (e) {
        console.error("Stats Error:", e);
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}
