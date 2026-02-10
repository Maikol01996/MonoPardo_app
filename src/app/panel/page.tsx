"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/core";
import { Loader2, Users, CheckCircle, Phone, MessageCircle, MapPin, Trophy, LayoutDashboard, Database } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'evento' | 'votantes'>('evento');

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
        return <div className="p-8 flex items-center justify-center min-h-[50vh]"><Loader2 className="animate-spin mr-2" /> Cargando estadísticas...</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Panel de Control</h1>

                {/* Mobile-friendly Tab Switcher */}
                <div className="flex bg-gray-100 p-1 rounded-lg self-start md:self-auto w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('evento')}
                        className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'evento'
                                ? 'bg-white text-red-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Cierre de Campaña
                    </button>
                    <button
                        onClick={() => setActiveTab('votantes')}
                        className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'votantes'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <Database className="h-4 w-4" />
                        Base Votantes (Camilo)
                    </button>
                </div>
            </div>

            {/* MODULE 1: EVENTO CIERRE CAMPAÑA */}
            {activeTab === 'evento' && stats?.eventStats && (
                <div className="space-y-6">
                    {/* Big Metric */}
                    <Card className="border-l-4 border-l-red-500 shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Total Registrados (En Tiempo Real)</CardTitle>
                            <Users className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-extrabold text-gray-900">{stats.eventStats.totalRegistros}</div>
                            <p className="text-xs text-muted-foreground mt-1">Asistentes confirmados al evento</p>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Breakdown by Barrio */}
                        <Card className="shadow-md h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <MapPin className="h-5 w-5 text-gray-500" />
                                    Registros por Localidad
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full overflow-y-auto pr-2">
                                    <div className="space-y-4">
                                        {stats.eventStats.registrosPorBarrio.map((item: any, i: number) => (
                                            <div key={i} className="flex items-center">
                                                <div className="w-full">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm font-medium text-gray-700">{item.name || "Sin dato"}</span>
                                                        <span className="text-sm font-bold text-gray-900">{item.value}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div
                                                            className="bg-red-500 h-2.5 rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.min((item.value / stats.eventStats.totalRegistros) * 100 * 1.5, 100)}%` }} // Scaled visually
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Referrers */}
                        <Card className="shadow-md h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Trophy className="h-5 w-5 text-yellow-500" />
                                    Top Referenciadores (Ranking)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full overflow-y-auto pr-2">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 rounded-tl-lg">#</th>
                                                <th className="px-4 py-3">Referente</th>
                                                <th className="px-4 py-3 text-right rounded-tr-lg">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.eventStats.rankingReferidos.map((item: any, i: number) => (
                                                <tr key={i} className="bg-white border-b hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-medium text-gray-900">
                                                        {i + 1}
                                                        {i < 3 && <span className="ml-1">👑</span>}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-gray-700">{item.name}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-blue-600">{item.count}</td>
                                                </tr>
                                            ))}
                                            {stats.eventStats.rankingReferidos.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="text-center py-4 text-gray-500">No hay datos de referidos aún</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* MODULE 2: BASE VOTANTES */}
            {activeTab === 'votantes' && stats?.voterStats && (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="border-l-4 border-l-blue-500 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Base Votantes</CardTitle>
                                <Users className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.voterStats.total}</div>
                                <p className="text-xs text-muted-foreground">Histórico Elecciones Pasadas</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Pendientes</CardTitle>
                                <Phone className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.voterStats.pendientes}</div>
                                <p className="text-xs text-muted-foreground">Por gestionar hoy</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Gestionados (Atendidos)</CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.voterStats.atendidos}</div>
                                <p className="text-xs text-muted-foreground">Contactados exitosamente</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Historial de Atenciones (Equipo)</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.voterStats.timeline || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" name="Atenciones" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
