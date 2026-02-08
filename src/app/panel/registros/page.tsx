"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from "@/components/ui/core";
import { Loader2, ArrowRight } from "lucide-react";
import { Asistente } from "@/lib/googleSheets";
import { ESTADO_COLORS } from "@/lib/constants";
import Link from "next/link";

export default function AllRegistrationsPage() {
    const [data, setData] = useState<Asistente[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const [localidadFilter, setLocalidadFilter] = useState("");

    useEffect(() => {
        fetch("/api/asistentes")
            .then(res => res.json())
            .then(d => setData(d))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, []);

    const filtered = data.filter(item =>
        (item.nombre_completo.toLowerCase().includes(filter.toLowerCase()) || item.cedula.includes(filter)) &&
        (localidadFilter ? item.localidad === localidadFilter : true)
    );

    if (loading) return <div className="p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Todos los Registros ({filtered.length})</h2>
                <div className="flex gap-2">
                    <Input placeholder="Buscar..." value={filter} onChange={e => setFilter(e.target.value)} className="w-64" />
                    <Input placeholder="Localidad..." value={localidadFilter} onChange={e => setLocalidadFilter(e.target.value)} className="w-48" />
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3">Nombre</th>
                                    <th className="px-6 py-3">Cédula</th>
                                    <th className="px-6 py-3">Celular</th>
                                    <th className="px-6 py-3">Localidad</th>
                                    <th className="px-6 py-3">Estado</th>
                                    <th className="px-6 py-3">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.slice(0, 100).map(row => (
                                    <tr key={row.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium">{row.nombre_completo}</td>
                                        <td className="px-6 py-4">{row.cedula}</td>
                                        <td className="px-6 py-4">{row.celular}</td>
                                        <td className="px-6 py-4">{row.localidad}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs ${ESTADO_COLORS[row.estado as keyof typeof ESTADO_COLORS] || "bg-gray-100"}`}>
                                                {row.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={`/panel/gestion/${row.id}`}>
                                                <Button size="sm" variant="outline">
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filtered.length > 100 && (
                            <div className="p-4 text-center text-gray-500 text-xs">
                                Mostrando primeros 100 de {filtered.length}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
