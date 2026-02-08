"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Input, Label, cn } from "@/components/ui/core";
import { Loader2, Phone, MessageCircle, Save, ArrowLeft, Copy } from "lucide-react";
import { Asistente } from "@/lib/googleSheets";
import { EstadoGestion, ESTADO_COLORS, GUION_LLAMADA_DEFAULT, PLANTILLA_WSP_DEFAULT, EVENTO_INFO } from "@/lib/constants";
import { ActionBoard } from "@/components/ActionBoard";

export default function GestionPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [asistente, setAsistente] = useState<Asistente | null>(null);
    const [loading, setLoading] = useState(true);

    // Action State
    const [nota, setNota] = useState("");
    const [estado, setEstado] = useState<EstadoGestion | "">("");
    const [respuesta, setRespuesta] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id) fetchAsistente();
    }, [id]);

    const fetchAsistente = async () => {
        try {
            const res = await fetch("/api/asistentes"); // We fetch all and filter client side for simplicity given current API
            if (res.ok) {
                const data: Asistente[] = await res.json();
                const found = data.find(a => a.id === id);
                if (found) {
                    setAsistente(found);
                    setEstado(found.estado as EstadoGestion);
                } else {
                    router.push("/panel");
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/asistentes/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id,
                    estado: estado,
                    respuesta_persona: respuesta,
                    nota: nota
                })
            });

            if (res.ok) {
                alert("Guardado correctamente");
                setNota("");
                setRespuesta("");
                fetchAsistente(); // Refresh
            } else {
                alert("Error al guardar");
            }
        } catch (e) {
            alert("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    const getScript = () => {
        if (!asistente) return "";
        return GUION_LLAMADA_DEFAULT
            .replace("{NOMBRE}", asistente.nombre_completo)
            .replace("{LOCALIDAD}", asistente.localidad);
    };

    const copyScript = () => {
        const text = getScript();
        navigator.clipboard.writeText(text);
        alert("Guion copiado");
    };

    if (loading || !asistente) return <div className="p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
            {/* Left Column: Asistente Info & Actions */}
            <div className="w-full lg:w-1/3 space-y-6 overflow-y-auto pr-2 pb-10">
                <Button variant="ghost" className="pl-0" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                </Button>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl text-primary">{asistente.nombre_completo}</CardTitle>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[asistente.estado as EstadoGestion] || "bg-gray-100"}`}>
                            {asistente.estado}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                            <div><span className="font-semibold block text-gray-500">Cédula</span> {asistente.cedula}</div>
                            <div><span className="font-semibold block text-gray-500">Celular</span> {asistente.celular}</div>
                            <div><span className="font-semibold block text-gray-500">Localidad</span> {asistente.localidad}</div>
                            <div><span className="font-semibold block text-gray-500">Origen</span> {asistente.origen || "Base"}</div>
                        </div>
                    </CardContent>
                </Card>

                <div className="h-[600px]">
                    <ActionBoard
                        current={asistente}
                        onSave={() => {
                            alert("Gestión guardada exitosamente.");
                            fetchAsistente();
                        }}
                    />
                </div>
            </div>

            {/* Right Column: Teleprompter */}
            <div className="flex-1 h-full flex flex-col">
                <Card className="h-full flex flex-col shadow-lg border-2 border-primary/20 bg-yellow-50/30">
                    <CardHeader className="bg-primary/5 border-b pb-3">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg flex items-center gap-2">
                                📜 Guion de Llamada
                            </CardTitle>
                            <Button size="sm" variant="ghost" onClick={copyScript}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-6 overflow-y-auto text-lg leading-relaxed font-medium text-gray-800">
                        <div className="whitespace-pre-wrap">
                            {getScript()}
                        </div>

                        <div className="mt-8 border-t pt-4">
                            <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Respuestas Rápidas (Objeciones)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-3 bg-white rounded border text-sm">
                                    <strong>"Estoy ocupado"</strong>: Entiendo, será solo un minuto. Solo quería confirmar si recibiste la invitación...
                                </div>
                                <div className="p-3 bg-white rounded border text-sm">
                                    <strong>"¿De qué se trata?"</strong>: Es el cierre de campaña del Mono Pardo, con música y los candidatos Horacio Serpa y Bleidy Pérez.
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
