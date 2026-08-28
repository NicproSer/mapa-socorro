"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PruebaSupabase() {
    const [mensaje, setMensaje] = useState(
        "Listo para probar."
    );

    const [cargando, setCargando] = useState(false);

    const crearRegistro = async () => {
        setCargando(true);
        setMensaje("Guardando registro...");

        try {
            const { data, error } = await supabase
                .from("afectados")
                .insert({
                    zona: "PRUEBA",
                    circuito: "PRUEBA",
                    congregacion: "Prueba",
                    nombre: "Usuario de prueba",
                    telefono: "0000000000",
                    direccion: "Dirección de prueba",

                    latitud: 10.4806,
                    longitud: -66.9036,

                    tipo_construccion: "PCA",
                    estatus: "pendiente",
                    nivel_danios: "sin_danos",

                    notas:
                        "Registro creado desde mapa-socorro",
                })
                .select()
                .single();

            if (error) {
                console.error(
                    "ERROR SUPABASE:",
                    error
                );

                setMensaje(
                    `❌ ${error.message}`
                );

                return;
            }

            console.log(
                "REGISTRO CREADO:",
                data
            );

            setMensaje(
                `✅ Registro creado correctamente. ID: ${data.id}`
            );

        } catch (error) {
            console.error(error);

            setMensaje(
                "❌ Error inesperado."
            );
        } finally {
            setCargando(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">

            <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg">

                <h1 className="mb-2 text-2xl font-bold text-slate-900">
                    Prueba de mapa-socorro
                </h1>

                <p className="mb-6 text-sm text-slate-600">
                    Vamos a crear un registro de prueba
                    directamente en Supabase.
                </p>

                <div className="mb-5 rounded-lg bg-slate-100 p-4">

                    <p className="text-sm text-slate-700">
                        {mensaje}
                    </p>

                </div>

                <button
                    type="button"
                    onClick={crearRegistro}
                    disabled={cargando}
                    className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                    {cargando
                        ? "Guardando..."
                        : "Crear registro de prueba"}
                </button>

            </div>

        </main>
    );
}