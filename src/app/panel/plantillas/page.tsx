"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Label } from "@/components/ui/core";
import { Loader2, Plus, Save } from "lucide-react";

interface Plantilla {
    id: string;
    nombre: string;
    contenido: string; // Puede contener {NOMBRE}, {LOCALIDAD}
}

export default function PlantillasPage() {
    const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Plantilla | null>(null);

    useEffect(() => {
        fetch("/api/plantillas")
            .then(res => res.json())
            .then(data => setPlantillas(data))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        if (!editing) return;

        await fetch("/api/plantillas", {
            method: "POST",
            body: JSON.stringify(editing)
        });

        // Refresh
        const res = await fetch("/api/plantillas");
        setPlantillas(await res.json());
        setEditing(null);
    };

    const handleNew = () => {
        setEditing({
            id: crypto.randomUUID(),
            nombre: "Nueva Plantilla",
            contenido: "Hola {NOMBRE}, ..."
        });
    };

    if (loading) return <div className="p-10"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Plantillas de Mensajes</h2>
                <Button onClick={handleNew}><Plus className="mr-2 h-4 w-4" /> Nueva</Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    {plantillas.map(p => (
                        <Card key={p.id} className="cursor-pointer hover:border-primary" onClick={() => setEditing(p)}>
                            <CardHeader>
                                <CardTitle className="text-lg">{p.nombre}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-gray-500 line-clamp-2">{p.contenido}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {editing && (
                    <Card className="h-fit sticky top-4">
                        <CardHeader><CardTitle>Editar Plantilla</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Nombre</Label>
                                <Input value={editing.nombre} onChange={e => setEditing({ ...editing, nombre: e.target.value })} />
                            </div>
                            <div>
                                <Label>Contenido</Label>
                                <textarea
                                    id="template-content"
                                    className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={editing.contenido}
                                    onChange={e => setEditing({ ...editing, contenido: e.target.value })}
                                />
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {["{NOMBRE}", "{LOCALIDAD}", "{FECHA_EVENTO}", "{HORA_EVENTO}", "{LUGAR_EVENTO}", "{DIRECCION_EVENTO}"].map(v => (
                                        <span
                                            key={v}
                                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors border"
                                            onClick={() => setEditing({ ...editing, contenido: editing.contenido + " " + v })}
                                        >
                                            {v}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <Button onClick={handleSave} className="w-full">
                                <Save className="mr-2 h-4 w-4" /> Guardar
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
