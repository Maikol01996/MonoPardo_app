"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/core";
import { Loader2, Users, CheckCircle, Phone, MessageCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const res = await fetch("/api/auth/me");
            if (res.ok) {
                const data = await res.json();
                setUserRole(data.user.rol);
            }
        } catch (error) {
            console.error(error);
        }
    }

    const fetchData = async () => {
        try {
            const res = await fetch("/api/dashboard-stats");
            if (res.ok) {
                setStats(await res.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin" /> Cargando estadísticas...</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold tracking-tight">Mi Gestión</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pendientes (Base)</CardTitle>
                        <Phone className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.pendientes || 0}</div>
                        <p className="text-xs text-muted-foreground">Registros sin gestionar</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Atendidos</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.atendidos || 0}</div>
                        <p className="text-xs text-muted-foreground">{userRole === 'ADMIN' ? 'Global' : 'Mis gestiones'}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Llamadas Realizadas</CardTitle>
                        <Phone className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.llamadas || 0}</div>
                        <p className="text-xs text-muted-foreground">Intentos de contacto</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">WhatsApp Enviados</CardTitle>
                        <MessageCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.whatsapp || 0}</div>
                        <p className="text-xs text-muted-foreground">Mensajes enviados</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Atenciones</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.timeline || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <YAxis allowDecimals={false} />
                            <Tooltip
                                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <Bar dataKey="count" name="Atenciones" fill="#16a34a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Table of Attended Records */}
            {stats?.atendidosList && stats.atendidosList.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Detalle de Gestionados ({stats.atendidosList.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Cédula</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Nombre</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Teléfono</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Estado Llamada</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Estado WhatsApp</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {stats.atendidosList.map((item: any, i: number) => (
                                        <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td className="p-4 align-middle font-medium">{item.cedula}</td>
                                            <td className="p-4 align-middle">{item.nombre_completo}</td>
                                            <td className="p-4 align-middle">{item.celular || "N/A"}</td>
                                            <td className="p-4 align-middle">
                                                {item.estado_llamada ? (
                                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-900 border-blue-200">
                                                        {item.estado_llamada}
                                                    </span>
                                                ) : "-"}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {item.estado_whatsapp ? (
                                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-900 border-green-200">
                                                        {item.estado_whatsapp}
                                                    </span>
                                                ) : "-"}
                                            </td>
                                            <td className="p-4 align-middle text-muted-foreground">{item.fecha_gestion}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
