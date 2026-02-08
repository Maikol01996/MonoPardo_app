"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui/core";
import { Loader2, Phone, MessageCircle, CheckCircle } from "lucide-react";
import { Asistente } from "@/lib/googleSheets";
import { ESTADO_COLORS, PLANTILLA_WSP_DEFAULT, LOCALIDADES, EstadoGestion } from "@/lib/constants";
import Link from "next/link";

export default function MyRegistrationsPage() {
    const [queue, setQueue] = useState<Asistente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [plantillas, setPlantillas] = useState<any[]>([]);
    const [selectedPlantilla, setSelectedPlantilla] = useState("");

    useEffect(() => {
        fetchData();
        fetch("/api/plantillas").then(r => r.json()).then(setPlantillas).catch(console.error);
    }, []);

    const fetchData = async () => {
        try {
            // Fetching from Bases_Consulta_Total via new endpoint or param?
            // Since we don't have a direct endpoint yet on the plan, I'll assume we modify the existing one 
            // OR I just create a dedicated endpoint logic here if I can't restart server easily.
            // But I can create new files. I'll create /api/bases-consulta in a moment.
            const res = await fetch("/api/bases-consulta");
            if (res.ok) {
                const data = await res.json();
                setQueue(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openWhatsapp = (a: Asistente) => {
        let template = plantillas.find(p => p.id === selectedPlantilla)?.contenido || PLANTILLA_WSP_DEFAULT;

        let text = template
            .replace("{NOMBRE}", a.nombre_completo.split(" ")[0])
            .replace("{LOCALIDAD}", a.localidad || "")
            .replace("{FECHA_EVENTO}", "10 de febrero")
            .replace("{HORA_EVENTO}", "5:00 pm")
            .replace("{LUGAR_EVENTO}", "Auditorio El Pacto")
            .replace("{DIRECCION_EVENTO}", "Calle 63 # 36 26");

        const url = `https://wa.me/57${a.celular}?text=${encodeURIComponent(text)}`;
        window.open(url, "_blank");

        // Ideally we should verify opening, but we can't. 
        // Usually user clicks 'Log' in the detail view. 
        // Requires Detail view for full management.
    };

    const filteredQueue = queue.filter(a =>
        searchTerm === "" ||
        (a.nombre_completo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.cedula || "").includes(searchTerm) ||
        (a.celular || "").includes(searchTerm)
    );

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;

    return (
        <div className="space-y-6 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Gestión Individual</h1>
                    <p className="text-muted-foreground">Tu cola de gestión activa ({queue.length}/5)</p>
                </div>
                <div className="w-full md:w-auto flex gap-2">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Buscar en cola..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-gray-50 border-gray-200"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredQueue.map(a => (
                    <Card key={a.id} className={`hover:shadow-xl transition-all duration-300 border-t-4 transform hover:-translate-y-1 ${a.estado === EstadoGestion.CONFIRMADO ? "border-t-green-500" :
                        a.estado === EstadoGestion.RECHAZA ? "border-t-red-500" :
                            a.estado === EstadoGestion.NO_RESPONDE ? "border-t-orange-500" :
                                "border-t-primary"
                        }`}>
                        <CardHeader className="pb-3 bg-gradient-to-br from-white to-gray-50 border-b">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-bold text-gray-800 leading-tight">
                                        {a.nombre_completo}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                                        ID: {a.id.slice(0, 8)}
                                        {a.origen && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-[3px]">BASE</span>}
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm ${ESTADO_COLORS[a.estado as keyof typeof ESTADO_COLORS] || "bg-gray-200 text-gray-600"}`}>
                                    {a.estado}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-5 space-y-4">
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3 text-gray-600 group">
                                    <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <span className="font-semibold text-gray-800 tracking-wide">{a.celular}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600 group">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                        <div className="w-4 h-4 flex items-center justify-center font-bold text-xs">CC</div>
                                    </div>
                                    <span className="font-medium">{a.cedula}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600 group">
                                    <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                        <div className="w-4 h-4 flex items-center justify-center text-xs">📍</div>
                                    </div>
                                    <span className="font-medium">{a.localidad || "Bogotá"}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button onClick={() => openWhatsapp(a)} className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white shadow-sm transition-all h-10">
                                    <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 h-10"
                                    onClick={() => window.location.href = `tel:+57${a.celular}`}
                                >
                                    <Phone className="w-4 h-4 mr-2" /> Llamar
                                </Button>
                            </div>

                            <div className="border-t border-dashed my-2"></div>

                            <Link href={`/panel/gestion/${a.id}`} className="block">
                                <Button className="w-full bg-primary text-white shadow-md hover:shadow-lg hover:bg-primary/90 transition-all h-11 text-base font-medium">
                                    Gestionar / Detalle
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
                {filteredQueue.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-400">
                        No hay asignaciones encontradas.
                    </div>
                )}
            </div>
        </div>
    );
}
