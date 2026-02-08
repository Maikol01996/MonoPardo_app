"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle, CardHeader, Button, Input, Label, CardFooter } from "@/components/ui/core";
import { Loader2 } from "lucide-react";
import { Usuario, Asistente, Asignacion } from "@/lib/googleSheets";

export default function AssignmentsPage() {
    const [users, setUsers] = useState<Usuario[]>([]);
    const [asistentes, setAsistentes] = useState<Asistente[]>([]);
    const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
    const [loading, setLoading] = useState(true);

    // Assignment Form
    const [selectedUser, setSelectedUser] = useState("");
    const [cedulaToAssign, setCedulaToAssign] = useState("");

    useEffect(() => {
        Promise.all([
            fetch("/api/usuarios").then(res => res.json()),
            fetch("/api/asistentes").then(res => res.json()),
            fetch("/api/asignaciones").then(res => res.json())
        ]).then(([u, a, as]) => {
            setUsers(u);
            setAsistentes(a);
            setAsignaciones(as);
            setLoading(false);
        });
    }, []);

    const handleAssign = async () => {
        if (!selectedUser || !cedulaToAssign) return;

        // Find asistente by cedula
        const target = asistentes.find(a => a.cedula === cedulaToAssign);
        if (!target) {
            alert("Cédula no encontrada");
            return;
        }

        const res = await fetch("/api/asignaciones", {
            method: "POST",
            body: JSON.stringify({
                user_id: selectedUser,
                asistente_id: target.id,
                result_cedula: target.cedula
            })
        });

        if (res.ok) {
            alert("Asignado correctamente");
            setCedulaToAssign("");
            // Reload assignments
            fetch("/api/asignaciones").then(res => res.json()).then(setAsignaciones);
        } else {
            alert("Error assigning");
        }
    };

    const getAssigneeName = (userId: string) => users.find(u => u.user_id === userId)?.nombre || userId;

    if (loading) return <div className="p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Asignación de Registros</h2>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 h-fit">
                    <CardHeader><CardTitle>Nueva Asignación Manual</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Colaborador</Label>
                            <select className="flex h-10 w-full rounded-md border border-input px-3"
                                value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                                <option value="">Seleccione...</option>
                                {users.filter(u => u.rol === "COLABORADOR").map(u => (
                                    <option key={u.user_id} value={u.user_id}>{u.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label>Cédula Asistente</Label>
                            <Input value={cedulaToAssign} onChange={e => setCedulaToAssign(e.target.value)} placeholder="Ej: 80123456" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleAssign} className="w-full">Asignar</Button>
                    </CardFooter>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader><CardTitle>Asignaciones Activas</CardTitle></CardHeader>
                    <CardContent className="p-0 max-h-[500px] overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b sticky top-0">
                                <tr>
                                    <th className="px-6 py-3">Cédula</th>
                                    <th className="px-6 py-3">Asignado a</th>
                                    <th className="px-6 py-3">Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {asignaciones.slice().reverse().map(a => (
                                    <tr key={a.asignacion_id} className="border-b">
                                        <td className="px-6 py-3">{a.cedula}</td>
                                        <td className="px-6 py-3">{getAssigneeName(a.user_id)}</td>
                                        <td className="px-6 py-3">{new Date(a.asignado_en).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
