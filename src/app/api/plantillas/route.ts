import { NextRequest, NextResponse } from "next/server";
import { getAllPlantillas, savePlantilla } from "@/lib/googleSheets";

export async function GET() {
    const data = await getAllPlantillas();
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    await savePlantilla(body);
    return NextResponse.json({ success: true });
}
