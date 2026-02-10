import { NextRequest, NextResponse } from "next/server";
import { getAllAsistentes, createAsistente, updateAsistente, logActividad, Asistente, getAllAsignaciones } from "@/lib/googleSheets";
import { getSessionFromRequest } from "@/lib/auth";
import { Roles, EstadoGestion, TipoActividad } from "@/lib/constants";

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        // Add filters if needed, e.g. ?page=1

        // Fetch all for now (optimization: fetch only needed cols or filter in Sheets)
        // Note: Google Sheets API is not a SQL DB, so we fetch all and filter in memory for small datasets (<5000 rows).
        const asistentes = await getAllAsistentes();

        if (session.rol === Roles.ADMIN) {
            // Admin sees all
            // Also need to join with assignments to show "asignado a"
            // And maybe join with users to show names?
            // For simplicity, we just return the raw data and let Frontend handle mapping or Fetch Users separately.
            return NextResponse.json(asistentes);
        } else {
            // Colaborador sees only assigned
            const asignaciones = await getAllAsignaciones();
            const myAssignments = asignaciones.filter(asig => asig.user_id === session.userId && asig.activo);
            const myAsistenteIds = new Set(myAssignments.map(a => a.asistente_id));

            // Also fallback to checking cedula if ID is missing (legacy)
            const myAsistenteCedulas = new Set(myAssignments.map(a => a.cedula));

            const filtered = asistentes.filter(a => myAsistenteIds.has(a.id) || myAsistenteCedulas.has(a.cedula));
            return NextResponse.json(filtered);
        }

    } catch (error: any) {
        console.error("GET Asistentes Error:", error);
        return NextResponse.json({
            error: "Error fetching data",
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    // Public Registration
    try {
        const body = await req.json();
        // Validate fields
        // required: nombre_completo, cedula, celular, localidad
        if (!body.nombre_completo || !body.cedula || !body.celular || !body.localidad) {
            return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
        }

        const cedula = String(body.cedula).trim();
        const allAsistentes = await getAllAsistentes();
        const existing = allAsistentes.find(a => a.cedula === cedula);

        if (existing) {
            // Update existing logic
            // Only update contact info if provided
            await updateAsistente(existing.row_number!, {
                ...existing,
                celular: body.celular || existing.celular,
                email: body.email || existing.email,
                localidad: body.localidad || existing.localidad,
                actualizado_en: new Date().toISOString(),
                // Don't change estado or observations
            });

            // Log Update
            await logActividad({
                timestamp: new Date().toISOString(),
                asistente_id: existing.id,
                cedula: existing.cedula,
                user_id: "SYSTEM",
                tipo: TipoActividad.CREACION, // Or separate UPDATE type, reusing CREACION for "Registration Event"
                detalle: "Actualización por re-registro público",
                estado_nuevo: existing.estado,
                respuesta_persona: "",
                nota: ""
            });

            return NextResponse.json({ success: true, message: "Datos actualizados" });
        }

        // Create New
        const newId = crypto.randomUUID();
        const nuevoAsistente: Omit<Asistente, "row_number"> = {
            id: newId,
            cedula: cedula,
            nombre_completo: body.nombre_completo,
            celular: String(body.celular),
            email: body.email || "",
            localidad: body.localidad,
            referenciado_por_id: body.referenciado_por_id || "",
            referenciado_por_nombre: body.referenciado_por_nombre || "",
            estado: EstadoGestion.NUEVO,
            observaciones: "",
            creado_en: new Date().toISOString(),
            actualizado_en: new Date().toISOString(),
            origen: "PUBLIC_FORM",
            ultima_gestion_en: ""
        };

        await createAsistente(nuevoAsistente);

        await logActividad({
            timestamp: new Date().toISOString(),
            asistente_id: newId,
            cedula: cedula,
            user_id: "SYSTEM",
            tipo: TipoActividad.CREACION,
            detalle: "Registro público",
            estado_nuevo: EstadoGestion.NUEVO,
            respuesta_persona: "",
            nota: ""
        });

        return NextResponse.json({ success: true, id: newId });

    } catch (error: any) {
        console.error("POST Asistentes Error:", error);
        return NextResponse.json({
            error: "Error saving data",
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
