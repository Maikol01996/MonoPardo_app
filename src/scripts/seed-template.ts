import { savePlantilla } from "../lib/googleSheets"; // Adjust path if running via ts-node from root
import { config } from "dotenv";
config({ path: ".env.local" });

const DEFAULT_TEMPLATE = {
    id: "template-cierre-1",
    nombre: "Invitación Gran Cierre",
    contenido: "Hola {NOMBRE}, te saludamos del equipo del Mono Pardo. Queremos invitarte muy especialmente a nuestro Gran Cierre de Campaña este 10 de febrero a las 5:00 PM en el Auditorio El Pacto (Calle 63 # 36-26). Estaremos con Horacio José Serpa y Bleidy Pérez. ¡Contamos contigo!"
};

async function main() {
    console.log("Seeding default template...");
    try {
        await savePlantilla(DEFAULT_TEMPLATE);
        console.log("Template created successfully.");
    } catch (error) {
        console.error("Error seeding template:", error);
    }
}

main();
