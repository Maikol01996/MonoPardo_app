import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const GOOGLE_SHEETS_CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;

// Robust Private Key Parsing
const GOOGLE_SHEETS_PRIVATE_KEY = (() => {
    let key = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    if (!key) return undefined;

    // Handle escaped newlines (common in Vercel/env vars)
    key = key.replace(/\\n/g, "\n");

    // Remove surrounding quotes if present
    key = key.replace(/^"|"$/g, "");

    // Ensure it looks like a PEM key
    if (!key.includes("-----BEGIN PRIVATE KEY-----")) {
        console.error("GOOGLE_SHEETS_PRIVATE_KEY missing PEM header");
    }

    return key;
})();

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

if (!GOOGLE_SHEETS_CLIENT_EMAIL || !GOOGLE_SHEETS_PRIVATE_KEY || !SPREADSHEET_ID) {
    console.error("Google Sheets credentials are missing or incomplete.");
    console.error("Email:", !!GOOGLE_SHEETS_CLIENT_EMAIL);
    console.error("Key:", !!GOOGLE_SHEETS_PRIVATE_KEY, "Length:", GOOGLE_SHEETS_PRIVATE_KEY?.length);
    console.error("Spreadsheet ID:", !!SPREADSHEET_ID);
}

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: GOOGLE_SHEETS_PRIVATE_KEY,
    },
    scopes: SCOPES,
});

const sheets = google.sheets({ version: "v4", auth });

/* Type definitions for our Sheets */

export interface Asistente {
    id: string; // generated uuid
    cedula: string;
    nombre_completo: string;
    celular: string;
    email: string;
    localidad: string;
    referenciado_por_id: string;
    referenciado_por_nombre: string;
    estado: string;
    observaciones: string;
    creado_en: string; // ISO date
    actualizado_en: string;
    origen: string;
    ultima_gestion_en: string;
    row_number?: number; // Internal use
}

export interface Usuario {
    user_id: string;
    nombre: string;
    email: string;
    rol: "ADMIN" | "COLABORADOR";
    password_hash: string;
    activo: boolean; // stored as "TRUE" or "FALSE"
    creado_en: string;
    ultimo_login_en: string;
    row_number?: number;
}

export interface Asignacion {
    asignacion_id: string;
    asistente_id: string;
    cedula: string;
    user_id: string;
    asignado_por_user_id: string;
    asignado_en: string;
    activo: boolean;
    row_number?: number;
}

export interface Actividad {
    actividad_id: string;
    timestamp: string;
    asistente_id: string;
    cedula: string;
    user_id: string;
    tipo: string;
    detalle: string;
    estado_nuevo: string;
    respuesta_persona: string;
    nota: string;
}

/* Helper to map objects to rows and vice versa */
// Implementation note: We assume headers are in specific order or we map by order. 
// For simplicity, we will assume fixed column text order as per prompt, but a header row check would be more robust.
// We'll trust the prompt's column list.

// Asistentes Columns: id, cedula, nombre_completo, celular, email, localidad, referenciado_por_id, referenciado_por_nombre, estado, observaciones, creado_en, actualizado_en, origen, ultima_gestion_en
// Users Columns: user_id, nombre, email, rol, password_hash, activo, creado_en, ultimo_login_en
// Assignments: asignacion_id, asistente_id, cedula, user_id, asignado_por_user_id, asignado_en, activo

export async function getSheetData(range: string) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
        });
        return response.data.values || [];
    } catch (error) {
        console.error("Error reading sheet:", error);
        throw error;
    }
}

export async function appendSheetRow(range: string, values: string[]) {
    try {
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [values],
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error appending row:", error);
        throw error;
    }
}

export async function updateSheetRow(range: string, values: string[]) {
    try {
        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [values],
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating row:", error);
        throw error;
    }
}

// Specific Table Helpers

// --- Asistentes ---
// Range: asistentes!A:N (assuming 14 cols)
// offset 1 for heater

export async function getAllAsistentes(): Promise<Asistente[]> {
    const rows = await getSheetData("asistentes!A2:N");
    return rows.map((row, index) => ({
        id: row[0] || "",
        cedula: row[1] || "",
        nombre_completo: row[2] || "",
        celular: row[3] || "",
        email: row[4] || "",
        localidad: row[5] || "",
        referenciado_por_id: row[6] || "",
        referenciado_por_nombre: row[7] || "",
        estado: row[8] || "NUEVO",
        observaciones: row[9] || "",
        creado_en: row[10] || "",
        actualizado_en: row[11] || "",
        origen: row[12] || "",
        ultima_gestion_en: row[13] || "",
        row_number: index + 2,
    }));
}

export async function createAsistente(asistente: Omit<Asistente, "row_number">) {
    const values = [
        asistente.id,
        asistente.cedula,
        asistente.nombre_completo,
        asistente.celular,
        asistente.email,
        asistente.localidad,
        asistente.referenciado_por_id,
        asistente.referenciado_por_nombre,
        asistente.estado,
        asistente.observaciones,
        asistente.creado_en,
        asistente.actualizado_en,
        asistente.origen,
        asistente.ultima_gestion_en
    ];
    await appendSheetRow("asistentes!A:N", values);
}

export async function updateAsistente(rowNumber: number, asistente: Omit<Asistente, "row_number">) {
    const values = [
        asistente.id,
        asistente.cedula,
        asistente.nombre_completo,
        asistente.celular,
        asistente.email,
        asistente.localidad,
        asistente.referenciado_por_id,
        asistente.referenciado_por_nombre,
        asistente.estado,
        asistente.observaciones,
        asistente.creado_en,
        asistente.actualizado_en,
        asistente.origen,
        asistente.ultima_gestion_en
    ];
    await updateSheetRow(`asistentes!A${rowNumber}:N${rowNumber}`, values);
}


// --- Usuarios ---
// Range: usuarios!A:H

export async function getAllUsuarios(): Promise<Usuario[]> {
    const rows = await getSheetData("usuarios!A2:H");
    return rows.map((row, index) => ({
        user_id: row[0],
        nombre: row[1],
        email: row[2],
        rol: row[3] as any,
        password_hash: row[4],
        activo: row[5] === "TRUE",
        creado_en: row[6],
        ultimo_login_en: row[7],
        row_number: index + 2,
    }));
}

export async function getUsuarioByEmail(email: string): Promise<Usuario | undefined> {
    const usuarios = await getAllUsuarios();
    return usuarios.find(u => u.email === email);
}

// --- Asignaciones ---
// Range: asignaciones!A:G

export async function getAllAsignaciones(): Promise<Asignacion[]> {
    const rows = await getSheetData("asignaciones!A2:G");
    return rows.map((row, index) => ({
        asignacion_id: row[0],
        asistente_id: row[1],
        cedula: row[2],
        user_id: row[3],
        asignado_por_user_id: row[4],
        asignado_en: row[5],
        activo: row[6] === "TRUE",
        row_number: index + 2
    }));
}

// --- Actividad ---
// Range: actividad!A:J

export async function getAllActividad(): Promise<Actividad[]> {
    const rows = await getSheetData("actividad!A2:J");
    return rows.map((row) => ({
        actividad_id: row[0],
        timestamp: row[1],
        asistente_id: row[2],
        cedula: row[3],
        user_id: row[4],
        tipo: row[5],
        detalle: row[6],
        estado_nuevo: row[7],
        respuesta_persona: row[8],
        nota: row[9]
    }));
}

export async function logActividad(log: Omit<Actividad, "actividad_id">) {
    // Generate a simple ID or just use timestamp
    const id = crypto.randomUUID();
    const values = [
        id,
        log.timestamp,
        log.asistente_id,
        log.cedula,
        log.user_id,
        log.tipo,
        log.detalle,
        log.estado_nuevo,
        log.respuesta_persona,
        log.nota
    ];
    await appendSheetRow("actividad!A:J", values);
}

// --- Plantillas (Templates) ---
// Range: plantillas!A:C (id, nombre, contenido)
export interface Plantilla {
    id: string;
    nombre: string;
    contenido: string;
}

export async function getAllPlantillas(): Promise<Plantilla[]> {
    try {
        const rows = await getSheetData("plantillas!A2:C");
        return rows.map((row) => ({
            id: row[0],
            nombre: row[1],
            contenido: row[2]
        }));
    } catch (e) {
        return [];
    }
}

export async function savePlantilla(plantilla: Plantilla) {
    // Check if exists to update, else append. Simple append for now or overwrite if ID matches?
    // For simplicity, we'll just append. Real app needs update logic.
    // Let's implement simple update: read all, find index, update.
    const rows = await getSheetData("plantillas!A2:C");
    const index = rows.findIndex(r => r[0] === plantilla.id);

    if (index >= 0) {
        const rowNum = index + 2;
        await updateSheetRow(`plantillas!A${rowNum}:C${rowNum}`, [plantilla.id, plantilla.nombre, plantilla.contenido]);
    } else {
        await appendSheetRow("plantillas!A:C", [plantilla.id, plantilla.nombre, plantilla.contenido]);
    }
}

// --- Bases Consulta Total ---
// Range: Bases_Consulta_Total!A:Z
// We map this to Asistente structure for compatibility in the view
// --- Bases Consulta Total ---
// Range: Bases_Consulta_Total!A:Z
// --- Bases Consulta Total ---
// Range: Bases_Consulta_Total!A:N
// Columns:
// A: Cedula [0]
// B: Nombre [1]
// C: Celular [2]
// D: NUIP [3]
// E: DEPARTAMENTO [4]
// F: MUNICIPIO [5]
// G: PUESTO [6]
// H: DIRECCIÓN [7]
// I: MESA [8]
// J: Estado Llamada [9]
// K: Estado WhatsApp [10]
// L: Nota [11]
// M: Gestionado Por [12]
// N: Fecha [13]

export interface BaseConsulta extends Asistente {
    estado_llamada?: string;
    estado_whatsapp?: string;
    gestionado_por?: string;
    fecha_gestion?: string;
    row_idx?: number;
}

export async function getBasesConsulta(
    page: number = 1,
    limit: number = 1000,
    filterCity: string = "BOGOTA",
    filterAssigned: boolean = true
): Promise<BaseConsulta[]> {
    try {
        // Fetch A:N to get status columns
        const rows = await getSheetData("Bases_Consulta_Total!A2:N");

        let all = rows.map((row, index) => ({
            id: row[0] || `base-${index}`, // Use Cedula as ID
            cedula: row[0] || "",
            nombre_completo: row[1] || "Sin Nombre",
            celular: row[2] || "",
            email: "", // Not present
            localidad: row[5] || "", // Using MUNICIPIO as Localidad
            referenciado_por_id: "",
            referenciado_por_nombre: "",
            estado: row[9] || "NUEVO", // Default to Estado Llamada
            observaciones: row[11] || "",
            creado_en: new Date().toISOString(),
            actualizado_en: row[13] || "",
            origen: "BASE_TOTAL",
            ultima_gestion_en: row[13] || "",
            row_number: index + 2,

            // New fields
            estado_llamada: row[9] || "",
            estado_whatsapp: row[10] || "",
            municipio: row[5] || "",
            puesto: row[6] || "",
            mesa: row[8] || "",
            gestionado_por: row[12] || "",
            fecha_gestion: row[13] || "",
            row_idx: index + 2,
        }));

        if (filterCity) {
            // Flexible filter: Department or Municipality
            const term = filterCity.toUpperCase();
            all = all.filter(p =>
                (p.localidad || "").toUpperCase().includes(term) ||
                (p.municipio || "").toUpperCase().includes(term)
            );
            // Re-map allows accessing row? No, 'row' is param.
            // Filter logic needs to happen after map or inside map. 
            // Let's filter after map using mapped fields.
            // Added 'departamento' to interface? No, let's just match municipio/localidad.
        }

        // Actually, let's fix the filter logic to be robust inside the map or ensure we captured fields.
        // Re-mapping slightly to capture Dept.

        return all;
    } catch (e) {
        console.error(e);
        return [];
    }
}

export async function updateBaseTotal(cedula: string, data: { estado_llamada?: string, estado_whatsapp?: string, nota?: string, usuario?: string }) {
    // 1. Find row by Cedula. (Inefficient but works without row_id known securely)
    // Optimization: If we passed row_number to frontend, use it.
    // For now, let's assume we search.
    const rows = await getSheetData("Bases_Consulta_Total!A2:A");
    const index = rows.findIndex(r => r[0] == cedula);

    if (index === -1) return false;

    const rowNum = index + 2;
    const updates = [];

    // We update specific columns: J, K, L, M, N.
    // Index 9, 10, 11, 12, 13.
    // We can't batch update non-contiguous simply without rewriting row or separate calls.
    // Construct the row segment J:N

    // First read current J:N to preserve if needed? 
    // Or just write.

    const currentStatus = await getSheetData(`Bases_Consulta_Total!J${rowNum}:N${rowNum}`);
    const current = currentStatus[0] || ["", "", "", "", ""];

    const newVals = [
        data.estado_llamada ?? current[0],
        data.estado_whatsapp ?? current[1],
        data.nota ?? current[2],
        data.usuario ?? current[3],
        new Date().toLocaleString("es-CO")
    ];

    await updateSheetRow(`Bases_Consulta_Total!J${rowNum}:N${rowNum}`, newVals);
    return true;
}

// End of file

