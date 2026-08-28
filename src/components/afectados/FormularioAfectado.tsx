"use client";

import { useState } from "react";

import SelectorUbicacion, {
    Ubicacion,
} from "@/components/mapa/SelectorUbicacion";

import { supabase } from "@/lib/supabase";

// ======================================================
// TIPOS
// ======================================================

interface TipoConstruccion {
    codigo: string;
    descripcion: string;
}

// ======================================================
// NOMENCLATURA DE TIPOS DE CONSTRUCCIÓN
// ======================================================

const TIPOS_CONSTRUCCION:
    TipoConstruccion[] = [

        {
            codigo: "PCA",
            descripcion:
                "Pórticos de concreto armado",
        },

        {
            codigo: "PCAP",
            descripcion:
                "Pórticos de concreto armado rellenos con paredes de bloques de arcilla o de concreto",
        },

        {
            codigo: "MCA2D",
            descripcion:
                "Muros de concreto armado en dos direcciones horizontales",
        },

        {
            codigo: "MCA1D",
            descripcion:
                "Sistemas con muros de concreto armado de poco espesor, dispuestos en una sola dirección, como algunos sistemas del tipo túnel",
        },

        {
            codigo: "PA",
            descripcion:
                "Pórticos de acero",
        },

        {
            codigo: "PAPT",
            descripcion:
                "Pórticos de acero con perfiles tubulares",
        },

        {
            codigo: "PAD",
            descripcion:
                "Pórticos de acero diagonalizados",
        },

        {
            codigo: "PAC",
            descripcion:
                "Pórticos de acero con cerchas",
        },

        {
            codigo: "PRE",
            descripcion:
                "Sistemas prefabricados a base de grandes paneles o de pórticos",
        },

        {
            codigo: "MMC",
            descripcion:
                "Sistemas cuyos elementos portantes sean muros de mampostería confinada",
        },

        {
            codigo: "MMNC",
            descripcion:
                "Sistemas cuyos elementos portantes sean muros de mampostería no confinada",
        },

        {
            codigo: "PMBCB",
            descripcion:
                "Sistemas mixtos de pórticos y de mampostería de baja calidad de construcción, con altura no mayor a 2 pisos",
        },

        {
            codigo: "PMBCA",
            descripcion:
                "Sistemas mixtos de pórticos y de mampostería de baja calidad de construcción, con altura mayor a 2 pisos",
        },

        {
            codigo: "VB",
            descripcion:
                "Viviendas de bahareque de un piso",
        },

        {
            codigo: "VCP",
            descripcion:
                "Viviendas de construcción precaria (tierra, madera, zinc, etc.)",
        },
    ];

// ======================================================
// ESTATUS
// ======================================================

const ESTATUS = [

    {
        value: "pendiente",
        label: "Pendiente",
    },

    {
        value: "visitado",
        label: "Visitado",
    },

    {
        value: "inspeccionado",
        label: "Inspeccionado",
    },

    {
        value: "atendido",
        label: "Atendido",
    },

    {
        value: "reconstruido",
        label: "Reconstruido",
    },
];

// ======================================================
// NIVELES DE DAÑOS
// ======================================================

const NIVELES_DANOS = [

    {
        value: "sin_danos",
        label: "Sin daños",
    },

    {
        value: "leve",
        label: "Daños leves",
    },

    {
        value: "moderado",
        label: "Daños moderados",
    },

    {
        value: "grave",
        label: "Daños graves",
    },

    {
        value: "destruccion_total",
        label: "Destrucción total",
    },
];

// ======================================================
// FORMULARIO
// ======================================================

interface DatosFormulario {

    zona: string;

    circuito: string;

    congregacion: string;

    nombre: string;

    telefono: string;

    direccion: string;

    ubicacion: Ubicacion | null;

    tipoConstruccion: string;

    estatus: string;

    nivelDanios: string;

    notas: string;

    s183: string;

    photoreport: string;

    fecha1: string;

    fecha2: string;

    fecha3: string;
}

// ======================================================
// ESTADO INICIAL
// ======================================================

const FORMULARIO_INICIAL:
    DatosFormulario = {

    zona: "",

    circuito: "",

    congregacion: "",

    nombre: "",

    telefono: "",

    direccion: "",

    ubicacion: null,

    tipoConstruccion: "",

    estatus: "",

    nivelDanios: "",

    notas: "",

    s183: "",

    photoreport: "",

    fecha1: "",

    fecha2: "",

    fecha3: "",
};

// ======================================================
// COMPONENTE
// ======================================================

export default function FormularioAfectado() {

    const [
        formulario,
        setFormulario,
    ] =
        useState<DatosFormulario>(
            FORMULARIO_INICIAL
        );

    const [
        mostrarMapa,
        setMostrarMapa,
    ] =
        useState(false);

    const [
        guardando,
        setGuardando,
    ] =
        useState(false);

    // ==================================================
    // ACTUALIZAR CAMPO
    // ==================================================

    const actualizarCampo = <
        K extends keyof DatosFormulario
    >(
        campo: K,
        valor: DatosFormulario[K]
    ) => {

        setFormulario(
            (actual) => ({

                ...actual,

                [campo]: valor,

            })
        );
    };

    // ==================================================
    // UBICACIÓN
    // ==================================================

    const manejarUbicacion = (
        ubicacion: Ubicacion
    ) => {

        setFormulario(
            (actual) => ({

                ...actual,

                ubicacion,

                // Si el mapa encontró una dirección,
                // también la colocamos en el campo
                // Dirección.

                direccion:
                    ubicacion.direccion ??
                    actual.direccion,

            })
        );

        setMostrarMapa(
            false
        );
    };

    // ==================================================
    // TIPO SELECCIONADO
    // ==================================================

    const tipoSeleccionado =
        TIPOS_CONSTRUCCION.find(
            (tipo) =>
                tipo.codigo ===
                formulario.tipoConstruccion
        );

    // ==================================================
    // LIMPIAR
    // ==================================================

    const limpiarFormulario = () => {

        const confirmar =
            window.confirm(
                "¿Deseas limpiar todo el formulario?"
            );

        if (!confirmar) {
            return;
        }

        setFormulario(
            FORMULARIO_INICIAL
        );

        setMostrarMapa(
            false
        );
    };

    // ==================================================
    // GUARDAR
    // ==================================================

    const manejarSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {

        event.preventDefault();

        if (guardando) {
            return;
        }

        setGuardando(
            true
        );

        try {

            const registro = {

                zona:
                    formulario.zona.trim(),

                circuito:
                    formulario.circuito.trim(),

                congregacion:
                    formulario.congregacion.trim(),

                nombre:
                    formulario.nombre.trim(),

                telefono:
                    formulario.telefono.trim(),

                direccion:
                    formulario.direccion.trim(),

                latitud:
                    formulario.ubicacion?.latitude ??
                    null,

                longitud:
                    formulario.ubicacion?.longitude ??
                    null,

                precision_gps:
                    formulario.ubicacion?.precision ??
                    null,
                metodo_ubicacion:
                    formulario.ubicacion?.metodo ??
                    null,

                nivel_precision:
                    formulario.ubicacion?.nivelPrecision ??
                    null,

                tipo_construccion:
                    formulario.tipoConstruccion ||
                    null,

                estatus:
                    formulario.estatus ||
                    null,

                nivel_danios:
                    formulario.nivelDanios ||
                    null,

                notas:
                    formulario.notas.trim(),

                s183:
                    formulario.s183.trim(),

                photoreport:
                    formulario.photoreport.trim(),

                fecha1:
                    formulario.fecha1 ||
                    null,

                fecha2:
                    formulario.fecha2 ||
                    null,

                fecha3:
                    formulario.fecha3 ||
                    null,
            };

            console.log(
                "Enviando registro:",
                registro
            );

            const {
                data,
                error,
            } =
                await supabase
                    .from("afectados")
                    .insert(
                        registro
                    )
                    .select()
                    .single();

            if (error) {

                console.error(
                    "Error de Supabase:",
                    error
                );

                alert(
                    `No se pudo guardar el registro.\n\n${error.message}`
                );

                return;
            }

            console.log(
                "Registro guardado correctamente:",
                data
            );

            alert(
                "✅ Registro de afectado guardado correctamente."
            );

            setFormulario({
                ...FORMULARIO_INICIAL,
            });

            setMostrarMapa(
                false
            );

        } catch (error) {

            console.error(
                "Error inesperado:",
                error
            );

            alert(
                "Ocurrió un error inesperado al guardar el registro."
            );

        } finally {

            setGuardando(
                false
            );
        }
    };

    // ==================================================
    // RENDER
    // ==================================================

    return (

        <main className="min-h-screen bg-slate-100 p-4 md:p-6">

            <div className="mx-auto max-w-6xl">

                {/* ==================================================
                    ENCABEZADO
                ================================================== */}

                <div className="mb-6">

                    <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                        Registro de afectado
                    </h1>

                    <p className="mt-1 text-sm text-slate-600">
                        Levantamiento de información
                        y evaluación.
                    </p>

                </div>

                <form
                    onSubmit={
                        manejarSubmit
                    }
                    className="space-y-6"
                >

                    {/* ==================================================
                        INFORMACIÓN TERRITORIAL
                    ================================================== */}

                    <section className="rounded-xl bg-white p-5 shadow-sm">

                        <h2 className="mb-1 text-lg font-semibold text-slate-900">
                            Información territorial
                        </h2>

                        <p className="mb-5 text-sm text-slate-500">
                            Identificación de la zona,
                            circuito y congregación.
                        </p>

                        <div className="grid gap-4 md:grid-cols-3">

                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Zona
                                </label>

                                <input
                                    type="text"
                                    value={
                                        formulario.zona
                                    }
                                    onChange={(e) =>
                                        actualizarCampo(
                                            "zona",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Zona"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />

                            </div>

                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Circuito
                                </label>

                                <input
                                    type="text"
                                    value={
                                        formulario.circuito
                                    }
                                    onChange={(e) =>
                                        actualizarCampo(
                                            "circuito",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Circuito"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />

                            </div>

                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Congregación
                                </label>

                                <input
                                    type="text"
                                    value={
                                        formulario.congregacion
                                    }
                                    onChange={(e) =>
                                        actualizarCampo(
                                            "congregacion",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Congregación"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />

                            </div>

                        </div>

                    </section>

                    {/* ==================================================
                        CONTACTO
                    ================================================== */}

                    <section className="rounded-xl bg-white p-5 shadow-sm">

                        <h2 className="mb-5 text-lg font-semibold text-slate-900">
                            Familiar de contacto
                        </h2>

                        <div className="grid gap-4 md:grid-cols-2">

                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Nombre
                                </label>

                                <input
                                    type="text"
                                    value={
                                        formulario.nombre
                                    }
                                    onChange={(e) =>
                                        actualizarCampo(
                                            "nombre",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Nombre completo"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />

                            </div>

                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Teléfono
                                </label>

                                <input
                                    type="tel"
                                    value={
                                        formulario.telefono
                                    }
                                    onChange={(e) =>
                                        actualizarCampo(
                                            "telefono",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ej. 0412-1234567"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />

                            </div>

                        </div>

                    </section>

                    {/* ==================================================
                        UBICACIÓN
                    ================================================== */}

                    <section className="rounded-xl bg-white p-5 shadow-sm">

                        <h2 className="mb-1 text-lg font-semibold text-slate-900">
                            Ubicación
                        </h2>

                        <p className="mb-5 text-sm text-slate-500">
                            Introduce una dirección o
                            utiliza el mapa para ubicar
                            el lugar.
                        </p>

                        {/* DIRECCIÓN */}

                        <div className="mb-4">

                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Dirección
                            </label>

                            <textarea
                                value={
                                    formulario.direccion
                                }
                                onChange={(e) =>
                                    actualizarCampo(
                                        "direccion",
                                        e.target.value
                                    )
                                }
                                rows={3}
                                placeholder="Dirección, sector, referencia o descripción del lugar"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />

                        </div>

                        {/* BOTÓN */}

                        {!mostrarMapa && (

                            <button
                                type="button"
                                onClick={() =>
                                    setMostrarMapa(
                                        true
                                    )
                                }
                                className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
                            >

                                📍 Seleccionar ubicación

                            </button>

                        )}

                        {/* ==================================================
                            MAPA
                        ================================================== */}

                        {mostrarMapa && (

                            <div className="mt-4 h-[600px] overflow-hidden rounded-xl border border-slate-200 shadow-sm">

                                <SelectorUbicacion

                                    ubicacionInicial={
                                        formulario.ubicacion ??
                                        undefined
                                    }

                                    onConfirmar={
                                        manejarUbicacion
                                    }

                                />

                            </div>

                        )}

                        {/* ==================================================
                            UBICACIÓN SELECCIONADA
                        ================================================== */}

                        {formulario.ubicacion && (

                            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">

                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                    <div>

                                        <p className="font-semibold text-slate-900">
                                            📍 Ubicación seleccionada
                                        </p>

                                        <p className="mt-1 text-sm text-slate-600">
                                            Latitud:{" "}
                                            {formulario.ubicacion.latitude.toFixed(
                                                6
                                            )}
                                        </p>

                                        <p className="text-sm text-slate-600">
                                            Longitud:{" "}
                                            {formulario.ubicacion.longitude.toFixed(
                                                6
                                            )}
                                        </p>

                                        {formulario.ubicacion.precision !==
                                            undefined && (

                                                <p className="text-sm text-slate-600">

                                                    Precisión: ±
                                                    {Math.round(
                                                        formulario
                                                            .ubicacion
                                                            .precision
                                                    )}{" "}
                                                    metros

                                                </p>
                                            )}

                                        {formulario.ubicacion.direccion && (

                                            <p className="mt-2 max-w-2xl text-sm text-slate-600">

                                                <strong>
                                                    Dirección:
                                                </strong>{" "}

                                                {
                                                    formulario
                                                        .ubicacion
                                                        .direccion
                                                }

                                            </p>
                                        )}

                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setMostrarMapa(
                                                true
                                            )
                                        }
                                        className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                                    >

                                        Cambiar ubicación

                                    </button>

                                </div>

                            </div>
                        )}

                    </section>

                    {/* ==================================================
                        TIPO DE CONSTRUCCIÓN
                    ================================================== */}

                    <section className="rounded-xl bg-white p-5 shadow-sm">

                        <div className="mb-5">

                            <h2 className="text-lg font-semibold text-slate-900">
                                Tipo de Construcción
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Selecciona la clasificación
                                estructural correspondiente.
                            </p>

                        </div>

                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Clasificación
                        </label>

                        <select
                            value={
                                formulario.tipoConstruccion
                            }
                            onChange={(e) =>
                                actualizarCampo(
                                    "tipoConstruccion",
                                    e.target.value
                                )
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        >

                            <option value="">
                                Seleccionar tipo de construcción...
                            </option>

                            {TIPOS_CONSTRUCCION.map(
                                (tipo) => (

                                    <option
                                        key={
                                            tipo.codigo
                                        }
                                        value={
                                            tipo.codigo
                                        }
                                    >

                                        {tipo.codigo} —{" "}
                                        {
                                            tipo.descripcion
                                        }

                                    </option>
                                )
                            )}

                        </select>

                        {tipoSeleccionado && (

                            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">

                                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                                    Código
                                </p>

                                <p className="mt-1 text-2xl font-bold text-slate-900">
                                    {
                                        tipoSeleccionado.codigo
                                    }
                                </p>

                                <p className="mt-2 text-sm leading-6 text-slate-700">
                                    {
                                        tipoSeleccionado.descripcion
                                    }
                                </p>

                            </div>
                        )}

                        <details className="mt-5 rounded-xl border border-slate-200">

                            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800">
                                📋 Consultar nomenclatura de construcción
                            </summary>

                            <div className="border-t border-slate-200">

                                {TIPOS_CONSTRUCCION.map(
                                    (
                                        tipo,
                                        index
                                    ) => (

                                        <div
                                            key={
                                                tipo.codigo
                                            }
                                            className="border-b border-slate-100 p-4 last:border-b-0"
                                        >

                                            <div className="flex gap-3">

                                                <span className="flex h-7 min-w-10 items-center justify-center rounded-md bg-slate-100 px-2 text-xs font-bold text-slate-700">

                                                    {index + 1}

                                                </span>

                                                <div>

                                                    <p className="font-semibold text-slate-900">

                                                        {
                                                            tipo.codigo
                                                        }

                                                    </p>

                                                    <p className="mt-1 text-sm leading-5 text-slate-600">

                                                        {
                                                            tipo.descripcion
                                                        }

                                                    </p>

                                                </div>

                                            </div>

                                        </div>
                                    )
                                )}

                            </div>

                        </details>

                    </section>

                    {/* ==================================================
                        EVALUACIÓN
                    ================================================== */}

                    <section className="rounded-xl bg-white p-5 shadow-sm">

                        <h2 className="mb-1 text-lg font-semibold text-slate-900">
                            Evaluación
                        </h2>

                        <p className="mb-5 text-sm text-slate-500">
                            Estado del caso y nivel de
                            afectación observado.
                        </p>

                        <div className="grid gap-4 md:grid-cols-2">

                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Estatus
                                </label>

                                <select
                                    value={
                                        formulario.estatus
                                    }
                                    onChange={(e) =>
                                        actualizarCampo(
                                            "estatus",
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                >

                                    <option value="">
                                        Seleccionar estatus...
                                    </option>

                                    {ESTATUS.map(
                                        (estado) => (

                                            <option
                                                key={
                                                    estado.value
                                                }
                                                value={
                                                    estado.value
                                                }
                                            >

                                                {
                                                    estado.label
                                                }

                                            </option>
                                        )
                                    )}

                                </select>

                            </div>

                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Nivel de Daños
                                </label>

                                <select
                                    value={
                                        formulario.nivelDanios
                                    }
                                    onChange={(e) =>
                                        actualizarCampo(
                                            "nivelDanios",
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                >

                                    <option value="">
                                        Seleccionar nivel de daños...
                                    </option>

                                    {NIVELES_DANOS.map(
                                        (nivel) => (

                                            <option
                                                key={
                                                    nivel.value
                                                }
                                                value={
                                                    nivel.value
                                                }
                                            >

                                                {
                                                    nivel.label
                                                }

                                            </option>
                                        )
                                    )}

                                </select>

                            </div>

                        </div>

                        <div className="mt-4">

                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Notas
                            </label>

                            <textarea
                                value={
                                    formulario.notas
                                }
                                onChange={(e) =>
                                    actualizarCampo(
                                        "notas",
                                        e.target.value
                                    )
                                }
                                rows={5}
                                placeholder="Información adicional, observaciones, detalles del levantamiento..."
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />

                        </div>

                    </section>

                    {/* ==================================================
                        DOCUMENTACIÓN
                    ================================================== */}

                    <section className="rounded-xl bg-white p-5 shadow-sm">

                        <h2 className="mb-1 text-lg font-semibold text-slate-900">
                            Documentación
                        </h2>

                        <p className="mb-5 text-sm text-slate-500">
                            Referencias de los documentos
                            asociados al caso.
                        </p>

                        <div className="grid gap-4 md:grid-cols-2">

                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    S-183
                                </label>

                                <input
                                    type="text"
                                    value={
                                        formulario.s183
                                    }
                                    onChange={(e) =>
                                        actualizarCampo(
                                            "s183",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Referencia del S-183"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />

                            </div>

                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Photoreport
                                </label>

                                <input
                                    type="text"
                                    value={
                                        formulario.photoreport
                                    }
                                    onChange={(e) =>
                                        actualizarCampo(
                                            "photoreport",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Referencia del Photoreport"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />

                            </div>

                        </div>

                    </section>

                    {/* ==================================================
                        FECHAS
                    ================================================== */}

                    <section className="rounded-xl bg-white p-5 shadow-sm">

                        <h2 className="mb-1 text-lg font-semibold text-slate-900">
                            Fechas
                        </h2>

                        <p className="mb-5 text-sm text-slate-500">
                            El registro permite almacenar
                            hasta tres fechas.
                        </p>

                        <div className="grid gap-4 md:grid-cols-3">

                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Fecha 1
                                </label>

                                <input
                                    type="date"
                                    value={
                                        formulario.fecha1
                                    }
                                    onChange={(e) =>
                                        actualizarCampo(
                                            "fecha1",
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />

                            </div>

                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Fecha 2
                                </label>

                                <input
                                    type="date"
                                    value={
                                        formulario.fecha2
                                    }
                                    onChange={(e) =>
                                        actualizarCampo(
                                            "fecha2",
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />

                            </div>

                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Fecha 3
                                </label>

                                <input
                                    type="date"
                                    value={
                                        formulario.fecha3
                                    }
                                    onChange={(e) =>
                                        actualizarCampo(
                                            "fecha3",
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />

                            </div>

                        </div>

                    </section>

                    {/* ==================================================
                        BOTONES
                    ================================================== */}

                    <div className="flex flex-col-reverse gap-3 pb-8 sm:flex-row sm:justify-end">

                        <button
                            type="button"
                            onClick={
                                limpiarFormulario
                            }
                            disabled={
                                guardando
                            }
                            className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                            Limpiar formulario

                        </button>

                        <button
                            type="submit"
                            disabled={
                                guardando
                            }
                            className="rounded-lg bg-green-600 px-8 py-3 font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >

                            {guardando
                                ? "Guardando..."
                                : "✓ Guardar registro"}

                        </button>

                    </div>

                </form>

            </div>

        </main>
    );
}