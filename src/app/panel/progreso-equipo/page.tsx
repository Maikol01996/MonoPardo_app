"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/core";
import { Loader2, Phone, CheckCircle, XCircle } from "lucide-react";
import { Usuario, Asistente, Asignacion } from "@/lib/googleSheets";
import { EstadoGestion, Roles } from "@/lib/constants";
import { useRouter } from "next/navigation";

interface UserStats {
    user: Usuario;
    assignedCount: number;
    confirmedCount: number;
    rejectedCount: number;
    managedCount: number; // Called/WhatsApp/etc
    pendingCount: number;
    completionRate: number; // managed / assigned * 100
}

export default function TeamProgressPage() {
    const router = useRouter();
    const [stats, setStats] = useState<UserStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Check auth first
            const authRes = await fetch("/api/auth/me");
            const authData = await authRes.json();
            if (!authRes.ok || authData.user?.rol !== Roles.ADMIN) {
                router.push("/panel");
                return;
            }

            // Fetch all required data
            const [usersRes, asignacionesRes, asistentesRes] = await Promise.all([
                fetch("/api/usuarios"),
                fetch("/api/asignaciones"),
                fetch("/api/asistentes") // Admin gets all
            ]);

            if (usersRes.ok && asignacionesRes.ok && asistentesRes.ok) {
                const users: Usuario[] = await usersRes.json();
                const asignaciones: Asignacion[] = await asignacionesRes.json();
                const asistentes: Asistente[] = await asistentesRes.json();

                // Process Data
                const collaboradorStats = users
                    .filter(u => u.rol === Roles.COLABORADOR || u.rol === Roles.ADMIN) // Show all? Or just collaborators? Let's show all
                    .map(user => {
                        // Find user assignments
                        const userAssignments = asignaciones.filter(a => a.user_id === user.user_id && a.activo);
                        const assignedIds = new Set(userAssignments.map(a => a.asistente_id));
                        const assignedCedulas = new Set(userAssignments.map(a => a.cedula));

                        // Filter assistants assigned to this user
                        const userAssistants = asistentes.filter(a => assignedIds.has(a.id) || assignedCedulas.has(a.cedula));

                        const totalAssigned = userAssistants.length;
                        if (totalAssigned === 0) {
                            return {
                                user,
                                assignedCount: 0,
                                confirmedCount: 0,
                                rejectedCount: 0,
                                managedCount: 0,
                                pendingCount: 0,
                                completionRate: 0
                            };
                        }

                        const confirmados = userAssistants.filter(a => a.estado === EstadoGestion.CONFIRMADO).length;
                        const rechazados = userAssistants.filter(a => a.estado === EstadoGestion.RECHAZA).length;
                        // Managed = Not New/NoRespond (Depending on definition, but usually "Touched")
                        // Let's stick to "Llamado", "Whatsapp", "Seguimiento" + Final states
                        const managed = userAssistants.filter(a =>
                            a.estado !== EstadoGestion.NUEVO &&
                            a.estado !== EstadoGestion.NO_RESPONDE // Maybe NO_RESPONDE is managed? depends. Let's assume managed means "Intento"
                            // Actually, let's look at page.tsx logic:
                            // llamados = LLAMADO || WHATSAPP_ENVIADO || PENDIENTE_SEGUIMIENTO
                            // rejected = RECHAZA
                            // confirm = CONFIRMADO
                        ).length;

                        // More strict "Managed" count for progress:
                        const interactions = userAssistants.filter(a =>
                            a.estado === EstadoGestion.LLAMADO ||
                            a.estado === EstadoGestion.WHATSAPP_ENVIADO ||
                            a.estado === EstadoGestion.PENDIENTE_SEGUIMIENTO ||
                            a.estado === EstadoGestion.CONFIRMADO ||
                            a.estado === EstadoGestion.RECHAZA
                        ).length;


                        const pending = totalAssigned - interactions;

                        return {
                            user,
                            assignedCount: totalAssigned,
                            confirmedCount: confirmados,
                            rejectedCount: rechazados,
                            managedCount: interactions,
                            pendingCount: pending,
                            completionRate: (interactions / totalAssigned) * 100
                        };
                    });

                // Sort by assigned count desc
                setStats(collaboradorStats.sort((a, b) => b.assignedCount - a.assignedCount));
            }

        } catch (error) {
            console.error("Error fetching team progress:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Progreso del Equipo</h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                    <Card key={stat.user.user_id} className="overflow-hidden">
                        <CardHeader className="bg-gray-50 pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">{stat.user.nombre}</CardTitle>
                                <span className="text-xs font-semibold px-2 py-1 bg-white rounded border">
                                    {stat.completionRate.toFixed(1)}%
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">{stat.user.email}</p>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500">Asignados</p>
                                    <p className="text-2xl font-bold">{stat.assignedCount}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500">Gestionados</p>
                                    <p className="text-2xl font-bold text-blue-600">{stat.managedCount}</p>
                                </div>
                            </div>

                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-500"
                                    style={{ width: `${stat.completionRate}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
                                <div>
                                    <CheckCircle className="h-4 w-4 mx-auto text-green-500 mb-1" />
                                    <span className="text-sm font-bold block">{stat.confirmedCount}</span>
                                    <span className="text-[10px] text-gray-400">SI</span>
                                </div>
                                <div>
                                    <XCircle className="h-4 w-4 mx-auto text-red-500 mb-1" />
                                    <span className="text-sm font-bold block">{stat.rejectedCount}</span>
                                    <span className="text-[10px] text-gray-400">NO</span>
                                </div>
                                <div>
                                    <Phone className="h-4 w-4 mx-auto text-yellow-500 mb-1" />
                                    <span className="text-sm font-bold block">{stat.managedCount - (stat.confirmedCount + stat.rejectedCount)}</span>
                                    <span className="text-[10px] text-gray-400">Pend</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {stats.length === 0 && (
                    <p className="text-gray-500 col-span-full text-center py-10">No hay usuarios con asignaciones activas.</p>
                )}
            </div>
        </div>
    );
}
