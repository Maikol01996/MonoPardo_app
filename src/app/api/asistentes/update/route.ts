import { NextRequest, NextResponse } from "next/server";
import { getAllAsistentes, updateAsistente, logActividad, getAllAsignaciones } from "@/lib/googleSheets";
import { getSessionFromRequest } from "@/lib/auth";
import { Roles, TipoActividad } from "@/lib/constants";

export async function PUT(req: NextRequest) {
    // Update state/notes endpoint (Protected)
    try {
        const session = await getSessionFromRequest(req);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, estado, respuesta_persona, nota, observaciones } = body;

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const asistentes = await getAllAsistentes();
        const target = asistentes.find(a => a.id === id);

        if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Check permissions
        if (session.rol !== Roles.ADMIN) {
            // Check assignment
            const asignaciones = await getAllAsignaciones();
            const isAssigned = asignaciones.some(a => a.user_id === session.userId && a.asistente_id === id && a.activo);
            if (!isAssigned) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        // Update
        const updated = {
            ...target,
            estado: estado || target.estado,
            observaciones: observaciones || target.observaciones, // Admin might edit obs
            actualizado_en: new Date().toISOString(),
            ultima_gestion_en: new Date().toISOString()
        };

        // If it is from Base Total, we should try to update Base Total
        if (target.origen === "BASE_TOTAL") {
            const updateData: any = {
                nota: nota,
                usuario: session.nombre || session.email
            };

            // Map generic "estado" to specific columns based on input or outcome type
            // If outcome is WhatsApp related (WHATSAPP_ENVIADO), update estado_whatsapp
            // If outcome is Call related, update estado_llamada
            if (estado === "WHATSAPP_ENVIADO" || body.templateName) {
                updateData.estado_whatsapp = "ENVIADO";
            } else if (estado) {
                updateData.estado_llamada = estado;
            }

            await import("@/lib/googleSheets").then(m => m.updateBaseTotal(target.cedula, updateData));
        }

        await updateAsistente(target.row_number!, updated);

        // Activity Log
        if (nota || estado !== target.estado) {
            let detalle = nota ? "Nota agregada" : "Cambio de estado";

            // If specific template info is passed
            if (body.templateName) {
                detalle += ` | Plantilla: ${body.templateName}`;
            }

            await logActividad({
                timestamp: new Date().toISOString(),
                asistente_id: target.id,
                cedula: target.cedula,
                user_id: session.userId,
                tipo: body.templateName ? TipoActividad.WHATSAPP : (nota ? TipoActividad.NOTA : TipoActividad.ESTADO),
                detalle: detalle,
                estado_nuevo: estado || target.estado,
                respuesta_persona: respuesta_persona || "",
                nota: nota || ""
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("PUT Asistentes Error:", error);
        return NextResponse.json({ error: "Error updating" }, { status: 500 });
    }
}
