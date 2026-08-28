"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Afectado {
    id: string;
    nombre: string | null;
    zona: string | null;
    latitud: number | null;
    longitud: number | null;
}

export default function PruebaRealtime() {
    const [registros, setRegistros] = useState<Afectado[]>([]);
    const [estado, setEstado] = useState(
        "Conectando con Realtime..."
    );

    useEffect(() => {
        // ==========================================
        // CARGAR REGISTROS EXISTENTES
        // ==========================================

        const cargarRegistros = async () => {
            const { data, error } = await supabase
                .from("afectados")
                .select(
                    "id, nombre, zona, latitud, longitud"
                )
                .order("created_at", {
                    ascending: false,
                });

            if (error) {
                console.error(error);
                setEstado(
                    `Error: ${error.message}`
                );
                return;
            }

            setRegistros(data ?? []);
        };

        cargarRegistros();

        // ==========================================
        // ESCUCHAR CAMBIOS
        // ==========================================

        const canal = supabase
            .channel("afectados-realtime")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "afectados",
                },
                (payload) => {
                    console.log(
                        "NUEVO REGISTRO:",
                        payload
                    );

                    const nuevo =
                        payload.new as Afectado;

                    setRegistros((actuales) => [
                        nuevo,
                        ...actuales,
                    ]);
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "afectados",
                },
                (payload) => {
                    console.log(
                        "REGISTRO ACTUALIZADO:",
                        payload
                    );

                    const actualizado =
                        payload.new as Afectado;

                    setRegistros((actuales) =>
                        actuales.map((registro) =>
                            registro.id ===
                            actualizado.id
                                ? actualizado
                                : registro
                        )
                    );
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "afectados",
                },
                (payload) => {
                    console.log(
                        "REGISTRO ELIMINADO:",
                        payload
                    );

                    const eliminado =
                        payload.old as Afectado;

                    setRegistros((actuales) =>
                        actuales.filter(
                            (registro) =>
                                registro.id !==
                                eliminado.id
                        )
                    );
                }
            )
            .subscribe((status) => {
                console.log(
                    "Realtime:",
                    status
                );

                if (status === "SUBSCRIBED") {
                    setEstado(
                        "🟢 Realtime conectado"
                    );
                }

                if (status === "CHANNEL_ERROR") {
                    setEstado(
                        "🔴 Error conectando Realtime"
                    );
                }
            });

        // ==========================================
        // LIMPIAR
        // ==========================================

        return () => {
            supabase.removeChannel(canal);
        };
    }, []);

    return (
        <main className="min-h-screen bg-slate-100 p-6">

            <div className="mx-auto max-w-4xl">

                <h1 className="text-3xl font-bold text-slate-900">
                    Prueba Realtime
                </h1>

                <p className="mt-2 text-slate-600">
                    {estado}
                </p>

                <div className="mt-6 space-y-3">

                    {registros.length === 0 ? (
                        <div className="rounded-xl bg-white p-6 text-slate-500 shadow">
                            No hay registros.
                        </div>
                    ) : (
                        registros.map((registro) => (
                            <div
                                key={registro.id}
                                className="rounded-xl bg-white p-5 shadow"
                            >

                                <h2 className="font-semibold text-slate-900">
                                    {registro.nombre ||
                                        "Sin nombre"}
                                </h2>

                                <p className="text-sm text-slate-600">
                                    Zona:{" "}
                                    {registro.zona ||
                                        "Sin zona"}
                                </p>

                                {registro.latitud !==
                                    null &&
                                    registro.longitud !==
                                        null && (
                                        <p className="mt-1 text-xs text-slate-500">
                                            📍{" "}
                                            {registro.latitud.toFixed(
                                                6
                                            )}
                                            {" / "}
                                            {registro.longitud.toFixed(
                                                6
                                            )}
                                        </p>
                                    )}

                            </div>
                        ))
                    )}

                </div>

            </div>

        </main>
    );
}