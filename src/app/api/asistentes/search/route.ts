import { NextRequest, NextResponse } from "next/server";
import { getAllAsistentes } from "@/lib/googleSheets";

export async function GET(req: NextRequest) {
    // Public Endpoint for Autocomplete
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.toLowerCase();

    if (!q || q.length < 3) {
        return NextResponse.json([]);
    }

    try {
        const asistentes = await getAllAsistentes();
        // Filter by name match
        const matches = asistentes
            .filter((a) => a.nombre_completo.toLowerCase().includes(q))
            .slice(0, 8)
            .map((a) => ({
                id: a.id,
                nombre_completo: a.nombre_completo,
            }));

        return NextResponse.json(matches);
    } catch (error) {
        console.error("Search Error:", error);
        return NextResponse.json({ error: "Error searching" }, { status: 500 });
    }
}
