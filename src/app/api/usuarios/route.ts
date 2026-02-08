import { NextRequest, NextResponse } from "next/server";
import { getAllUsuarios, appendSheetRow, updateSheetRow } from "@/lib/googleSheets";
import { getSessionFromRequest, hashPassword } from "@/lib/auth";
import { Roles } from "@/lib/constants";

export async function GET(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session || session.rol !== Roles.ADMIN) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const usuarios = await getAllUsuarios();
    // Remove hash
    const safeUsers = usuarios.map(u => {
        const { password_hash, ...rest } = u;
        return rest;
    });
    return NextResponse.json(safeUsers);
}

export async function POST(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session || session.rol !== Roles.ADMIN) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { nombre, email, password, rol } = body;

    if (!nombre || !email || !password || !rol) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const allUsers = await getAllUsuarios();
    if (allUsers.find(u => u.email === email)) {
        return NextResponse.json({ error: "Email exists" }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const hash = await hashPassword(password);

    // user_id, nombre, email, rol, password_hash, activo, creado_en, ultimo_login_en
    const values = [
        id,
        nombre,
        email,
        rol,
        hash,
        "TRUE",
        new Date().toISOString(),
        ""
    ];

    await appendSheetRow("usuarios!A:H", values);
    return NextResponse.json({ success: true, id });
}
