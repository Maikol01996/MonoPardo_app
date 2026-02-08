import { NextResponse } from "next/server";
import { getBasesConsulta } from "@/lib/googleSheets";

export async function GET() {
    // This endpoint reads from "Bases_Consulta_Total"
    // Since this might be large, we might want to cache or paginate, but for now we dump.
    const data = await getBasesConsulta();
    return NextResponse.json(data);
}
