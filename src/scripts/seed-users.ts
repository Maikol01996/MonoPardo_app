import { google } from "googleapis";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load env vars from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const GOOGLE_SHEETS_CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const GOOGLE_SHEETS_PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

if (!GOOGLE_SHEETS_CLIENT_EMAIL || !GOOGLE_SHEETS_PRIVATE_KEY || !SPREADSHEET_ID) {
    console.error("Missing credentials in .env.local");
    process.exit(1);
}

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: GOOGLE_SHEETS_PRIVATE_KEY,
    },
    scopes: SCOPES,
});

const sheets = google.sheets({ version: "v4", auth });

async function seed() {
    console.log("Seeding users...");

    const users = [
        {
            nombre: "Administrador",
            email: "admin@monopardo.com",
            password: "admin", // Simple password
            rol: "ADMIN"
        },
        {
            nombre: "Colaborador 1",
            email: "colab@monopardo.com",
            password: "asistente", // Simple password
            rol: "COLABORADOR"
        }
    ];

    for (const u of users) {
        const id = crypto.randomUUID();
        const hash = await bcrypt.hash(u.password, 10);

        // user_id, nombre, email, rol, password_hash, activo, creado_en, ultimo_login_en
        const values = [
            id,
            u.nombre,
            u.email,
            u.rol,
            hash,
            "TRUE",
            new Date().toISOString(),
            ""
        ];

        try {
            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: "usuarios!A:H",
                valueInputOption: "USER_ENTERED",
                requestBody: {
                    values: [values],
                },
            });
            console.log(`User created: ${u.email} / ${u.password}`);
        } catch (error: any) {
            console.error(`Error creating ${u.email}:`, error.message);
        }
    }
}

seed();
