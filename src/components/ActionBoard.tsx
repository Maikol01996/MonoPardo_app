"use client";

import { useState, useEffect } from "react";
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/core";
import { Loader2, Phone, MessageCircle, CheckCircle, XCircle } from "lucide-react";
import { EstadoGestion, PLANTILLA_WSP_DEFAULT } from "@/lib/constants";
import { Asistente } from "@/lib/googleSheets";

interface ActionBoardProps {
    current: Asistente;
    onNext?: () => void; // Optional, mostly for PowerDialer
    onSave?: () => void; // Optional, mostly for single edit
    isPowerDialer?: boolean;
}

export function ActionBoard({ current, onNext, onSave, isPowerDialer = false }: ActionBoardProps) {
    const [loading, setLoading] = useState(false);
    const [plantillas, setPlantillas] = useState<any[]>([]);
    const [selectedPlantilla, setSelectedPlantilla] = useState("");
    const [notes, setNotes] = useState("");

    // Split states for dual reporting
    const [callOutcome, setCallOutcome] = useState<string>("");
    const [waOutcome, setWaOutcome] = useState<string>("");

    useEffect(() => {
        fetch("/api/plantillas").then(r => r.json()).then(setPlantillas).catch(console.error);
    }, []);

    const handleSaveProcess = async () => {
        if (!callOutcome && !waOutcome) return;
        setLoading(true);

        const templateName = plantillas.find(p => p.id === selectedPlantilla)?.nombre;

        try {
            // Determine Final Primary Status
            // Logic: Confirmed > Rejected > WA Sent > No Answer > ...
            // If Confirmed is selected, it takes precedence.
            let finalStatus = current.estado;

            if (callOutcome === EstadoGestion.CONFIRMADO) finalStatus = EstadoGestion.CONFIRMADO;
            else if (callOutcome === EstadoGestion.RECHAZA) finalStatus = EstadoGestion.RECHAZA;
            else if (waOutcome === EstadoGestion.WHATSAPP_ENVIADO) finalStatus = EstadoGestion.WHATSAPP_ENVIADO;
            else if (callOutcome) finalStatus = callOutcome;
            else if (waOutcome) finalStatus = waOutcome;

            // 1. Log Call Outcome if present
            if (callOutcome) {
                await fetch("/api/asistentes/update", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: current.id,
                        estado: finalStatus,
                        respuesta_persona: notes,
                        nota: `Llamada: ${callOutcome}`,
                    })
                });
            }

            // 2. Log WA Outcome if present (and distinct)
            if (waOutcome) {
                await fetch("/api/asistentes/update", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: current.id,
                        estado: finalStatus, // Ensure consistent final status
                        respuesta_persona: notes,
                        nota: `WhatsApp: ${waOutcome}`,
                        templateName: templateName
                    })
                });
            }

            if (onNext) onNext();
            else if (onSave) onSave();

        } catch (e) {
            console.error(e);
            alert("Error guardando gestión");
        } finally {
            setLoading(false);
            setCallOutcome("");
            setWaOutcome("");
            setNotes("");
        }
    };

    return (
        <Card className="h-full flex flex-col shadow-sm">
            <CardHeader>
                <CardTitle>Panel de Gestión</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-6">
                {/* Selector de Plantilla */}
                <div className="space-y-2">
                    <Label>Plantilla de WhatsApp</Label>
                    <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedPlantilla}
                        onChange={e => setSelectedPlantilla(e.target.value)}
                    >
                        <option value="">Predeterminada (Invitación)</option>
                        {plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                </div>

                {/* VISUAL ACTIONS (Launchers) */}
                <div className="grid grid-cols-2 gap-4">
                    <Button
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 text-white h-14 text-lg shadow-sm"
                        onClick={() => {
                            const template = plantillas.find(p => p.id === selectedPlantilla)?.contenido || PLANTILLA_WSP_DEFAULT;
                            const text = template.replace("{NOMBRE}", current.nombre_completo.split(" ")[0]);
                            const date = new Date().getHours();
                            const greeting = date < 12 ? "Buenos días" : "Buenas tardes";
                            // Replace generic placeholder if exists, otherwise create smart text
                            window.open(`https://wa.me/57${current.celular}?text=${encodeURIComponent(text)}`, "_blank");
                            setWaOutcome(EstadoGestion.WHATSAPP_ENVIADO); // Auto select
                        }}
                    >
                        <MessageCircle className="mr-2 h-6 w-6" /> Abrir WhatsApp
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        className="border-primary/20 text-primary hover:bg-primary/5 h-14 text-lg shadow-sm"
                        onClick={() => window.location.href = `tel:+57${current.celular}`}
                    >
                        <Phone className="mr-2 h-6 w-6" /> Llamar
                    </Button>
                </div>

                <div className="border-t border-gray-100 my-2"></div>

                <div className="space-y-4">
                    {/* Call Outcomes */}
                    <div>
                        <Label className="mb-2 block text-gray-700">Resultado de Llamada</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant={callOutcome === EstadoGestion.CONFIRMADO ? "default" : "outline"}
                                className={`h-16 flex flex-col gap-1 ${callOutcome === EstadoGestion.CONFIRMADO ? "bg-green-600 hover:bg-green-700 border-green-600 text-white" : "hover:border-green-500 hover:text-green-600"}`}
                                onClick={() => setCallOutcome(callOutcome === EstadoGestion.CONFIRMADO ? "" : EstadoGestion.CONFIRMADO)}
                            >
                                <CheckCircle className="h-5 w-5" /> Confirmado
                            </Button>

                            <Button variant={callOutcome === EstadoGestion.NO_RESPONDE ? "default" : "outline"}
                                className={`h-16 flex flex-col gap-1 ${callOutcome === EstadoGestion.NO_RESPONDE ? "bg-orange-500 hover:bg-orange-600 border-orange-500 text-white" : "hover:border-orange-400 hover:text-orange-500"}`}
                                onClick={() => setCallOutcome(callOutcome === EstadoGestion.NO_RESPONDE ? "" : EstadoGestion.NO_RESPONDE)}
                            >
                                <Phone className="h-5 w-5" /> No Contesta
                            </Button>

                            <Button variant={callOutcome === EstadoGestion.RECHAZA ? "default" : "outline"}
                                className={`h-16 flex flex-col gap-1 ${callOutcome === EstadoGestion.RECHAZA ? "bg-red-600 hover:bg-red-700 border-red-600 text-white" : "hover:border-red-500 hover:text-red-600"}`}
                                onClick={() => setCallOutcome(callOutcome === EstadoGestion.RECHAZA ? "" : EstadoGestion.RECHAZA)}
                            >
                                <XCircle className="h-5 w-5" /> Rechaza
                            </Button>

                            <Button variant={callOutcome === EstadoGestion.PENDIENTE_SEGUIMIENTO ? "default" : "outline"}
                                className={`h-16 flex flex-col gap-1 ${callOutcome === EstadoGestion.PENDIENTE_SEGUIMIENTO ? "bg-blue-600 hover:bg-blue-700 border-blue-600 text-white" : "hover:border-blue-500 hover:text-blue-600"}`}
                                onClick={() => setCallOutcome(callOutcome === EstadoGestion.PENDIENTE_SEGUIMIENTO ? "" : EstadoGestion.PENDIENTE_SEGUIMIENTO)}
                            >
                                <MessageCircle className="h-5 w-5" /> Volver a Llamar
                            </Button>
                        </div>
                    </div>

                    {/* WA Outcomes */}
                    <div>
                        <Label className="mb-2 block text-gray-700">Estado de WhatsApp / Otros</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button variant={waOutcome === EstadoGestion.WHATSAPP_ENVIADO ? "default" : "outline"}
                                size="sm"
                                className={`h-12 text-xs flex flex-col ${waOutcome === EstadoGestion.WHATSAPP_ENVIADO ? "bg-purple-600 text-white" : "hover:text-purple-600"}`}
                                onClick={() => setWaOutcome(waOutcome === EstadoGestion.WHATSAPP_ENVIADO ? "" : EstadoGestion.WHATSAPP_ENVIADO)}
                            >
                                WhatsApp Enviado
                            </Button>
                            <Button variant={waOutcome === EstadoGestion.NUMERO_INVALIDO ? "default" : "outline"}
                                size="sm"
                                className={`h-12 text-xs flex flex-col ${waOutcome === EstadoGestion.NUMERO_INVALIDO ? "bg-gray-800 text-white" : "hover:text-gray-800"}`}
                                onClick={() => setWaOutcome(waOutcome === EstadoGestion.NUMERO_INVALIDO ? "" : EstadoGestion.NUMERO_INVALIDO)}
                            >
                                Número Errado
                            </Button>
                            <Button variant={waOutcome === EstadoGestion.DUPLICADO ? "default" : "outline"}
                                size="sm"
                                className={`h-12 text-xs flex flex-col ${waOutcome === EstadoGestion.DUPLICADO ? "bg-gray-400 text-white" : "hover:text-gray-600"}`}
                                onClick={() => setWaOutcome(waOutcome === EstadoGestion.DUPLICADO ? "" : EstadoGestion.DUPLICADO)}
                            >
                                Duplicado
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 mt-auto">
                    <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Nota rapida (opcional)..." />
                </div>

                <div className="pt-2 flex gap-3">
                    <Button className="w-full text-lg h-12"
                        disabled={loading || (!callOutcome && !waOutcome)}
                        onClick={handleSaveProcess}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isPowerDialer ? "Guardar y Siguiente" : "Guardar Gestión")}
                    </Button>

                    {isPowerDialer && <Button variant="ghost" onClick={onNext}>Saltar</Button>}
                </div>
            </CardContent>
        </Card>
    );
}
