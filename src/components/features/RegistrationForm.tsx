"use client";

import { useState, useEffect } from "react";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/core";
import { LOCALIDADES } from "@/lib/constants";
import { Loader2, CheckCircle, Search } from "lucide-react";

export default function RegistrationForm() {
    const [formData, setFormData] = useState({
        nombre_completo: "",
        cedula: "",
        celular: "",
        email: "",
        localidad: "",
        referenciado_por_id: "",
        referenciado_por_nombre: ""
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    // Autocomplete state
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<{ id: string, nombre_completo: string }[]>([]);
    const [showResults, setShowResults] = useState(false);

    // Debounced search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length >= 3) {
                try {
                    const res = await fetch(`/api/asistentes/search?q=${encodeURIComponent(searchTerm)}`);
                    if (res.ok) {
                        const data = await res.json();
                        setSearchResults(data);
                        setShowResults(true);
                    }
                } catch (e) {
                    console.error(e);
                }
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/asistentes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                setSubmitted(true);
            } else {
                setError(data.error || "Error al registrar");
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <Card className="w-full shadow-xl border-t-4 border-t-primary animate-in fade-in zoom-in duration-500">
                <CardContent className="pt-10 pb-10 flex flex-col items-center text-center">
                    <div className="rounded-full bg-green-100 p-3 mb-4">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Registro Exitoso!</h2>
                    <p className="text-gray-600 mb-6">Gracias por confirmar tu asistencia al Gran Cierre de Campaña.</p>
                    <Button onClick={() => window.location.reload()} variant="outline">
                        Registrar a otra persona
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full shadow-2xl border-0 overflow-hidden">
            <CardHeader className="bg-white border-b px-6 py-4">
                <CardTitle className="text-xl text-primary font-bold">Datos de Asistente</CardTitle>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Formulario Oficial</p>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4 p-6">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="cedula">Cédula <span className="text-primary">*</span></Label>
                        <Input
                            id="cedula"
                            type="number"
                            placeholder="Sin puntos ni espacios"
                            required
                            value={formData.cedula}
                            onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                            className="text-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre Completo <span className="text-primary">*</span></Label>
                        <Input
                            id="nombre"
                            placeholder="Nombres y Apellidos"
                            required
                            value={formData.nombre_completo}
                            onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                            className="capitalize"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="celular">Celular (WhatsApp) <span className="text-primary">*</span></Label>
                        <Input
                            id="celular"
                            type="tel"
                            placeholder="300 123 4567"
                            required
                            value={formData.celular}
                            onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="localidad">Localidad <span className="text-primary">*</span></Label>
                        <select
                            id="localidad"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            required
                            value={formData.localidad}
                            onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                        >
                            <option value="">Seleccione...</option>
                            {LOCALIDADES.map(l => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico (Opcional)</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="ejemplo@correo.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2 relative">
                        <Label htmlFor="referido">Referenciado por (Opcional)</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="referido"
                                placeholder="Buscar nombre..."
                                value={formData.referenciado_por_id ? formData.referenciado_por_nombre : searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setFormData({ ...formData, referenciado_por_id: "", referenciado_por_nombre: "" }); // Reset if user types
                                }}
                                className="pl-9"
                            />
                        </div>
                        {/* Autocomplete Results */}
                        {showResults && searchResults.length > 0 && !formData.referenciado_por_id && (
                            <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                                {searchResults.map(res => (
                                    <button
                                        key={res.id}
                                        type="button"
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                                        onClick={() => {
                                            setFormData({
                                                ...formData,
                                                referenciado_por_id: res.id,
                                                referenciado_por_nombre: res.nombre_completo
                                            });
                                            setSearchTerm(res.nombre_completo);
                                            setShowResults(false);
                                        }}
                                    >
                                        {res.nombre_completo}
                                    </button>
                                ))}
                            </div>
                        )}
                        {formData.referenciado_por_id && (
                            <button
                                type="button"
                                className="text-xs text-red-500 hover:underline mt-1"
                                onClick={() => {
                                    setFormData({ ...formData, referenciado_por_id: "", referenciado_por_nombre: "" });
                                    setSearchTerm("");
                                }}
                            >
                                Quitar selección
                            </button>
                        )}
                    </div>

                </CardContent>
                <CardFooter className="bg-gray-50 px-6 py-4">
                    <Button type="submit" className="w-full text-lg font-bold shadow-md hover:shadow-lg transition-all" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Confirmar Asistencia"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
