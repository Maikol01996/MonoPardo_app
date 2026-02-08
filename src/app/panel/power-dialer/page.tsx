"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from "@/components/ui/core";
import { Loader2, Phone, MessageCircle, CheckCircle, XCircle, SkipForward, Play } from "lucide-react";
import { Asistente } from "@/lib/googleSheets";
import { EstadoGestion, GUION_LLAMADA_DEFAULT, PLANTILLA_WSP_DEFAULT } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";

export default function PowerDialerPage() {
    const [queue, setQueue] = useState<Asistente[]>([]);
    const [current, setCurrent] = useState<Asistente | null>(null);
    const [loading, setLoading] = useState(false); // Action loading
    const [sessionStats, setSessionStats] = useState({ total: 0, confirmed: 0, rejected: 0, noAnswer: 0 });
    const [plantillas, setPlantillas] = useState<any[]>([]);
    const [selectedPlantilla, setSelectedPlantilla] = useState("");

    // Call State
    const [outcome, setOutcome] = useState<string>("");
    const [notes, setNotes] = useState("");

    const loadMore = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/asignaciones/auto", {
                method: "POST",
                body: JSON.stringify({ count: 5 })
            });
            const data = await res.json();
            if (data.assigned && data.assigned.length > 0) {
                setQueue(prev => [...prev, ...data.assigned]);
                if (!current) setCurrent(data.assigned[0]);
            } else {
                alert("No hay más registros disponibles por ahora.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial load
        fetch("/api/plantillas").then(r => r.json()).then(setPlantillas).catch(console.error);
    }, []);

    const handleNext = async () => {
        if (!current) return;
        setLoading(true);

        // 1. Save result if any outcome selected
        if (outcome) {
            const templateName = plantillas.find(p => p.id === selectedPlantilla)?.nombre;

            await fetch("/api/asistentes/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: current.id,
                    estado: outcome,
                    respuesta_persona: notes,
                    nota: "Power Dialer Session",
                    templateName: outcome === EstadoGestion.WHATSAPP_ENVIADO ? templateName : undefined
                })
            });

            // Update stats
            setSessionStats(prev => ({
                ...prev,
                total: prev.total + 1,
                confirmed: outcome === EstadoGestion.CONFIRMADO ? prev.confirmed + 1 : prev.confirmed,
                rejected: outcome === EstadoGestion.RECHAZA ? prev.rejected + 1 : prev.rejected,
                noAnswer: outcome === EstadoGestion.NO_RESPONDE ? prev.noAnswer + 1 : prev.noAnswer,
            }));
        }

        // 2. Move to next
        const nextQueue = queue.slice(1);
        setQueue(nextQueue);

        if (nextQueue.length > 0) {
            setCurrent(nextQueue[0]);
            setOutcome("");
            setNotes("");
        } else {
            setCurrent(null);
            // Maybe auto load more?
            // loadMore(); 
        }
        setLoading(false);
    };

    const getScript = () => {
        if (!current) return "";
        return GUION_LLAMADA_DEFAULT.replace("{NOMBRE}", current.nombre_completo);
    };

    if (!current && queue.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">Power Dialer</h2>
                    <p className="text-muted-foreground mt-2">Modo de llamadas rápidas y secuenciales.</p>
                </motion.div>

                <Button size="lg" onClick={loadMore} disabled={loading} className="animate-pulse">
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2 fill-current" />}
                    Iniciar Sesión (Cargar 5)
                </Button>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            {/* Stats Bar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border mb-4">
                <div className="flex gap-6 text-sm font-medium">
                    <span className="text-gray-500">Sesión: <strong className="text-gray-900">{sessionStats.total}</strong></span>
                    <span className="text-green-600">Confirmados: <strong>{sessionStats.confirmed}</strong></span>
                    <span className="text-red-600">Rechazados: <strong>{sessionStats.rejected}</strong></span>
                </div>
                <div className="text-xs text-gray-400">En cola: {queue.length}</div>
            </div>

            <div className="flex-1 grid md:grid-cols-2 gap-6 overflow-hidden">
                {/* Left: Script & Info */}
                <AnimatePresence mode="wait">
                    {current && (
                        <motion.div
                            key={current.id}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="flex flex-col gap-4 h-full"
                        >
                            <Card className="flex-1 bg-yellow-50/50 border-yellow-200 overflow-y-auto">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Phone className="h-5 w-5 text-primary" />
                                        {current.nombre_completo}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6 text-lg">
                                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 bg-white p-3 rounded-md border">
                                        <div><span className="font-bold">Cel:</span> {current.celular}</div>
                                        <div><span className="font-bold">CC:</span> {current.cedula}</div>
                                        <div><span className="font-bold">Loc:</span> {current.localidad}</div>
                                    </div>

                                    <div className="whitespace-pre-wrap font-medium text-gray-800 leading-relaxed p-4 bg-white rounded-xl shadow-sm border-l-4 border-primary">
                                        {getScript()}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Right: Action Board */}
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Registro de Gestión</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-6">
                        <div className="space-y-4">
                            {/* --- Sección Llamadas --- */}
                            <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
                                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <Phone className="h-4 w-4" /> Gestión Telefónica
                                </h3>

                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full border-primary/20 text-primary hover:bg-primary/5 h-12 text-lg shadow-sm"
                                    onClick={() => {
                                        if (!current) return;
                                        window.location.href = `tel:+57${current.celular}`;
                                    }}
                                >
                                    <Phone className="mr-2 h-5 w-5" /> Llamar Ahora
                                </Button>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant={outcome === EstadoGestion.CONFIRMADO ? "default" : "outline"}
                                        className={`h-16 flex flex-col gap-1 ${outcome === EstadoGestion.CONFIRMADO ? "bg-green-600 hover:bg-green-700" : "hover:border-green-500 hover:text-green-600"}`}
                                        onClick={() => setOutcome(EstadoGestion.CONFIRMADO)}
                                    >
                                        <CheckCircle className="h-5 w-5" /> Confirmado
                                    </Button>

                                    <Button variant={outcome === EstadoGestion.NO_RESPONDE ? "default" : "outline"}
                                        className={`h-16 flex flex-col gap-1 ${outcome === EstadoGestion.NO_RESPONDE ? "bg-orange-500 hover:bg-orange-600" : "hover:border-orange-400 hover:text-orange-500"}`}
                                        onClick={() => setOutcome(EstadoGestion.NO_RESPONDE)}
                                    >
                                        <Phone className="h-5 w-5" /> No Contesta
                                    </Button>

                                    <Button variant={outcome === EstadoGestion.RECHAZA ? "default" : "outline"}
                                        className={`h-16 flex flex-col gap-1 ${outcome === EstadoGestion.RECHAZA ? "bg-red-600 hover:bg-red-700" : "hover:border-red-500 hover:text-red-600"}`}
                                        onClick={() => setOutcome(EstadoGestion.RECHAZA)}
                                    >
                                        <XCircle className="h-5 w-5" /> Rechaza
                                    </Button>

                                    <Button variant={outcome === EstadoGestion.PENDIENTE_SEGUIMIENTO ? "default" : "outline"}
                                        className={`h-16 flex flex-col gap-1 ${outcome === EstadoGestion.PENDIENTE_SEGUIMIENTO ? "bg-blue-600 hover:bg-blue-700" : "hover:border-blue-500 hover:text-blue-600"}`}
                                        onClick={() => setOutcome(EstadoGestion.PENDIENTE_SEGUIMIENTO)}
                                    >
                                        <MessageCircle className="h-5 w-5" /> Volver a Llamar
                                    </Button>

                                    <Button variant={outcome === EstadoGestion.NUMERO_INVALIDO ? "default" : "outline"}
                                        size="sm"
                                        className={`h-10 text-xs ${outcome === EstadoGestion.NUMERO_INVALIDO ? "bg-gray-800" : "hover:text-gray-800"}`}
                                        onClick={() => setOutcome(EstadoGestion.NUMERO_INVALIDO)}
                                    >
                                        Número Errado
                                    </Button>

                                    <Button variant={outcome === EstadoGestion.DUPLICADO ? "default" : "outline"}
                                        size="sm"
                                        className={`h-10 text-xs ${outcome === EstadoGestion.DUPLICADO ? "bg-gray-400" : "hover:text-gray-600"}`}
                                        onClick={() => setOutcome(EstadoGestion.DUPLICADO)}
                                    >
                                        Duplicado
                                    </Button>
                                </div>
                            </div>

                            {/* --- Sección WhatsApp --- */}
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100 space-y-3">
                                <h3 className="font-semibold text-green-900 flex items-center gap-2">
                                    <MessageCircle className="h-4 w-4" /> Gestión WhatsApp
                                </h3>

                                <div className="space-y-2">
                                    <Label className="text-xs text-green-800">Plantilla de Mensaje</Label>
                                    <select
                                        className="h-9 w-full rounded-md border border-green-200 bg-white px-3 py-1 text-sm"
                                        value={selectedPlantilla}
                                        onChange={e => setSelectedPlantilla(e.target.value)}
                                    >
                                        <option value="">Predeterminada (Invitación)</option>
                                        {plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                    </select>
                                </div>

                                <Button
                                    size="lg"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg shadow-sm"
                                    onClick={() => {
                                        if (!current) return;
                                        const template = plantillas.find(p => p.id === selectedPlantilla)?.contenido || PLANTILLA_WSP_DEFAULT;
                                        const text = template.replace("{NOMBRE}", current.nombre_completo.split(" ")[0]);
                                        window.open(`https://wa.me/57${current.celular}?text=${encodeURIComponent(text)}`, "_blank");
                                    }}
                                >
                                    <MessageCircle className="mr-2 h-5 w-5" /> Enviar WhatsApp
                                </Button>

                                <Button variant={outcome === EstadoGestion.WHATSAPP_ENVIADO ? "default" : "outline"}
                                    size="sm"
                                    className={`w-full h-10 text-sm ${outcome === EstadoGestion.WHATSAPP_ENVIADO ? "bg-purple-600" : "text-purple-600 border-purple-200 hover:bg-purple-50"}`}
                                    onClick={() => setOutcome(EstadoGestion.WHATSAPP_ENVIADO)}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Enviado
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2 mt-auto">
                            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Nota rapida (opcional)..." />
                        </div>

                        <div className="pt-2 flex gap-3">
                            <Button className="w-full text-lg h-12" onClick={handleNext} disabled={loading || !outcome}>
                                {loading ? <Loader2 className="animate-spin" /> : "Guardar y Siguiente"}
                            </Button>
                            <Button variant="ghost" onClick={handleNext}>Saltar</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
