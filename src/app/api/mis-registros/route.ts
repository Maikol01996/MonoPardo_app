import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getAllAsignaciones, getBasesConsulta, Asistente } from "@/lib/googleSheets";
import { EstadoGestion } from "@/lib/constants";

export async function GET(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.userId;

    // 1. Get my assignments
    const allAssignments = await getAllAsignaciones();
    const myAssignments = allAssignments.filter(a => a.user_id === userId && a.activo);

    if (myAssignments.length === 0) {
        return NextResponse.json({ items: [], count: 0, message: "No tienes asignaciones activas." });
    }

    // 2. We need the details (Name, Phone, etc) from Bases_Consulta_Total
    // Optimisation: We fetch ALL bases and match by cedula. (Slow but necessary without DB)
    // We already added pagination to `getBasesConsulta` but here we need SPECIFIC IDs.
    // So we fetch a larger chunk or map manually. 
    // Ideally `getBasesConsulta` should accept "ids" or "cedulas" filter.
    // For now, let's just fetch default broad list (heuristic) or better: fetch ALL and find.
    // Given the prompt "se esta tardando mucho", fetching ALL is the bottleneck.
    // If the Sheet is huge (10k+ rows), this will timeout.
    // TEMPORARY FIX: We assume the user has assignments from recent batches.
    const allPeople = await getBasesConsulta(1, 10000, ""); // No city filter here, we want specific people.
    // We fetch up to 10k. If >10k, we need real DB.

    // 3. Match assignments to people
    const myPeople: Asistente[] = [];
    const myPending: Asistente[] = [];

    // Optimize lookup
    const peopleMap = new Map(allPeople.map(p => [p.cedula, p]));

    for (const assignment of myAssignments) {
        const person = peopleMap.get(assignment.cedula);
        if (person) {
            myPeople.push(person);
            // Check status
            // If status is "NUEVO" or "NO_RESPONDE" or "PENDIENTE", it's pending.
            // If "CONFIRMADO" or "RECHAZA", it's done. 
            // The user wants "hasta que no complete...".
            const isPending = [EstadoGestion.NUEVO, EstadoGestion.NO_RESPONDE, EstadoGestion.PENDIENTE_SEGUIMIENTO].includes(person.estado as any) || !person.estado;
            if (isPending) {
                myPending.push(person);
            }
        }
    }

    // 4. Return ONLY first 5 pending
    // If we have >5 pending, we show 5.
    // If we have <5 pending, we show what we have.
    const slice = myPending.slice(0, 5);

    return NextResponse.json({ items: slice, count: myPending.length });
}
