"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle, CardHeader, Button, Input, Label, CardFooter } from "@/components/ui/core";
import { Loader2, Trash2 } from "lucide-react";
import { Usuario } from "@/lib/googleSheets";

export default function UsersPage() {
    const [users, setUsers] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [newUser, setNewUser] = useState({ nombre: "", email: "", password: "", rol: "COLABORADOR" });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const res = await fetch("/api/usuarios");
        if (res.ok) {
            setUsers(await res.json());
        }
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.nombre || !newUser.email || !newUser.password) return;

        const res = await fetch("/api/usuarios", {
            method: "POST",
            body: JSON.stringify(newUser)
        });

        if (res.ok) {
            setNewUser({ nombre: "", email: "", password: "", rol: "COLABORADOR" });
            fetchUsers();
        } else {
            alert("Error creating user");
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 h-fit">
                    <CardHeader><CardTitle>Nuevo Usuario</CardTitle></CardHeader>
                    <form onSubmit={handleCreate}>
                        <CardContent className="space-y-3">
                            <div>
                                <Label>Nombre</Label>
                                <Input value={newUser.nombre} onChange={e => setNewUser({ ...newUser, nombre: e.target.value })} required />
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                            </div>
                            <div>
                                <Label>Password</Label>
                                <Input value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                            </div>
                            <div>
                                <Label>Rol</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={newUser.rol}
                                    onChange={e => setNewUser({ ...newUser, rol: e.target.value })}
                                >
                                    <option value="COLABORADOR">COLABORADOR</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full">Crear Usuario</Button>
                        </CardFooter>
                    </form>
                </Card>

                <Card className="md:col-span-2">
                    <CardContent className="p-0">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3">Nombre</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Rol</th>
                                    <th className="px-6 py-3">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.user_id} className="border-b">
                                        <td className="px-6 py-3">{u.nombre}</td>
                                        <td className="px-6 py-3">{u.email}</td>
                                        <td className="px-6 py-3">{u.rol}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs ${u.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                {u.activo ? "Activo" : "Inactivo"}
                                            </span>
                                        </td>
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
