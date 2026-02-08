import { NextRequest, NextResponse } from "next/server";
import { getUsuarioByEmail, logActividad } from "@/lib/googleSheets";
import { comparePassword, setSession, signToken } from "@/lib/auth";
import { Roles, TipoActividad } from "@/lib/constants";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Faltan credenciales" }, { status: 400 });
        }

        const usuario = await getUsuarioByEmail(email);

        if (!usuario) {
            // Dummy compare to prevent timing attacks
            await comparePassword("dummy", "$2a$10$dummyhashdummyhashdummyhashdummyhash");
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
        }

        if (!usuario.activo) {
            return NextResponse.json({ error: "Usuario inactivo" }, { status: 403 });
        }

        const isValid = await comparePassword(password, usuario.password_hash);

        if (!isValid) {
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
        }

        // Create session
        const token = await signToken({
            userId: usuario.user_id,
            email: usuario.email,
            rol: usuario.rol as Roles,
            nombre: usuario.nombre
        });

        await setSession(token);

        // Log Activity
        try {
            await logActividad({
                timestamp: new Date().toISOString(),
                asistente_id: "",
                cedula: "",
                user_id: usuario.user_id,
                tipo: TipoActividad.LOGIN,
                detalle: "Inicio de sesión exitoso",
                estado_nuevo: "",
                respuesta_persona: "",
                nota: ""
            });
        } catch (e) {
            console.error("Failed to log activity", e);
        }

        return NextResponse.json({ success: true, user: { name: usuario.nombre, role: usuario.rol } });

    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
