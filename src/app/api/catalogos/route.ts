import { NextResponse } from "next/server";
import { LOCALIDADES, Roles, EstadoGestion, TipoActividad, EVENTO_INFO, PLANTILLA_WSP_DEFAULT, GUION_LLAMADA_DEFAULT } from "@/lib/constants";

export async function GET() {
    return NextResponse.json({
        localidades: LOCALIDADES,
        roles: Roles,
        estados: EstadoGestion,
        tiposActividad: TipoActividad,
        eventoInfo: EVENTO_INFO,
        plantillas: {
            whatsapp: PLANTILLA_WSP_DEFAULT,
            guion: GUION_LLAMADA_DEFAULT
        }
    });
}
