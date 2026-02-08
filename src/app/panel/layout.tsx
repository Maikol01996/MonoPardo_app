"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/core";
import { Roles } from "@/lib/constants";
import {
    Loader2,
    LayoutDashboard,
    Users,
    UserPlus,
    Phone,
    LogOut,
    Menu,
    X,
    TrendingUp
} from "lucide-react";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<{ nombre: string; rol: Roles } | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch("/api/auth/me");
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                router.push("/admin");
            }
        } catch (err) {
            router.push("/admin");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/admin");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    const NavItem = ({ href, icon: Icon, label, active }: any) => (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${active
                ? "bg-primary text-white font-medium"
                : "text-gray-600 hover:bg-gray-100 hover:text-primary"
                }`}
            onClick={() => setSidebarOpen(false)}
        >
            <Icon className="h-5 w-5" />
            {label}
        </Link>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-sm transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
                <div className="p-6 border-b flex justify-between items-center">
                    <h1 className="text-xl font-bold text-primary">Panel Staff</h1>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Menu
                    </div>

                    <NavItem
                        href="/panel"
                        icon={LayoutDashboard}
                        label="Dashboard"
                        active={pathname === "/panel"}
                    />

                    {user.rol === Roles.ADMIN && (
                        <>
                            <NavItem
                                href="/panel/registros"
                                icon={Users}
                                label="Todos los Registros"
                                active={pathname === "/panel/registros"}
                            />
                            <NavItem
                                href="/panel/asignaciones"
                                icon={UserPlus}
                                label="Asignaciones"
                                active={pathname === "/panel/asignaciones"}
                            />
                            <NavItem
                                href="/panel/usuarios"
                                icon={Users}
                                label="Usuarios Admin"
                                active={pathname === "/panel/usuarios"}
                            />
                            <NavItem
                                href="/panel/mis-registros"
                                icon={Phone}
                                label="Gestión Individual"
                                active={pathname === "/panel/mis-registros"}
                            />
                            <NavItem
                                href="/panel/plantillas"
                                icon={Menu}
                                label="Plantillas WhatsApp"
                                active={pathname === "/panel/plantillas"}
                            />
                            <NavItem
                                href="/panel/progreso-equipo"
                                icon={TrendingUp}
                                label="Progreso Equipo"
                                active={pathname === "/panel/progreso-equipo"}
                            />
                        </>
                    )}

                    <NavItem
                        href="/panel/power-dialer"
                        icon={Phone}
                        label="Power Dialer (Auto)"
                        active={pathname === "/panel/power-dialer"}
                    />
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t bg-gray-50">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {user.nombre.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{user.nombre}</p>
                            <p className="text-xs text-gray-500 truncate">{user.rol}</p>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0">
                <header className="bg-white border-b h-16 flex items-center px-4 justify-between md:hidden shadow-sm sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        {/* Hamburger still useful for less common items if needed, but primary nav is bottom */}
                        <span className="font-bold text-lg text-primary">Mono Pardo</span>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-16 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                <Link href="/panel" className={`flex flex-col items-center justify-center w-full h-full ${pathname === "/panel" ? "text-primary" : "text-gray-400"}`}>
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="text-[10px] mt-1 font-medium">Dash</span>
                </Link>
                <Link href="/panel/mis-registros" className={`flex flex-col items-center justify-center w-full h-full ${pathname === "/panel/mis-registros" ? "text-primary" : "text-gray-400"}`}>
                    <Phone className="h-5 w-5" />
                    <span className="text-[10px] mt-1 font-medium">Gestión</span>
                </Link>
                <div className="relative -top-5">
                    <Link href="/panel/power-dialer" className="flex items-center justify-center h-14 w-14 rounded-full bg-primary text-white shadow-lg border-4 border-gray-50">
                        <Phone className="h-6 w-6 animate-pulse" />
                    </Link>
                </div>
                <Link href="/panel/plantillas" className={`flex flex-col items-center justify-center w-full h-full ${pathname === "/panel/plantillas" ? "text-primary" : "text-gray-400"}`}>
                    <Menu className="h-5 w-5" />
                    <span className="text-[10px] mt-1 font-medium">Msjs</span>
                </Link>
                <button onClick={handleLogout} className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-red-500">
                    <LogOut className="h-5 w-5" />
                    <span className="text-[10px] mt-1 font-medium">Salir</span>
                </button>
            </div>
        </div>
    );
}
