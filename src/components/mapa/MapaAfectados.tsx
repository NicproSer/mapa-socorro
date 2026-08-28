"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Map, {
    Marker,
    NavigationControl,
    Popup,
    Source,
    Layer,
} from "react-map-gl/maplibre";

import "maplibre-gl/dist/maplibre-gl.css";

import { supabase } from "@/lib/supabase";

// ======================================================
// TIPOS
// ======================================================

interface Afectado {
    id: string;
    created_at: string;

    zona: string | null;
    circuito: string | null;
    congregacion: string | null;

    nombre: string | null;
    telefono: string | null;

    direccion: string | null;

    latitud: number | null;
    longitud: number | null;

    precision_gps: number | null;

    tipo_construccion: string | null;

    estatus: string | null;

    nivel_danios: string | null;

    notas: string | null;

    s183: string | null;
    photoreport: string | null;

    fecha1: string | null;
    fecha2: string | null;
    fecha3: string | null;

    metodo_ubicacion: string | null;
    nivel_precision: string | null;
}

interface RegistroSeleccionado {
    longitude: number;
    latitude: number;
    afectado: Afectado;
}

// ======================================================
// ESTATUS
// ======================================================

const obtenerColorEstatus = (
    estatus: string | null
) => {
    switch (estatus) {
        case "visitado":
            return "bg-blue-600";

        case "inspeccionado":
            return "bg-orange-500";

        case "atendido":
            return "bg-green-600";

        case "reconstruido":
            return "bg-purple-600";

        case "pendiente":
        default:
            return "bg-slate-500";
    }
};

const obtenerTextoEstatus = (
    estatus: string | null
) => {
    switch (estatus) {
        case "visitado":
            return "Visitado";

        case "inspeccionado":
            return "Inspeccionado";

        case "atendido":
            return "Atendido";

        case "reconstruido":
            return "Reconstruido";

        case "pendiente":
            return "Pendiente";

        default:
            return "Sin estatus";
    }
};

// ======================================================
// DAÑOS
// ======================================================

const obtenerTextoDanios = (
    nivel: string | null
) => {
    switch (nivel) {
        case "sin_danos":
            return "Sin daños";

        case "leve":
            return "Daños leves";

        case "moderado":
            return "Daños moderados";

        case "grave":
            return "Daños graves";

        case "destruccion_total":
            return "Destrucción total";

        default:
            return "No especificado";
    }
};

const obtenerCoordenadasValidas = (
    latitud: number | null,
    longitud: number | null
): { latitude: number; longitude: number } | null => {
    const latitude = Number(latitud);
    const longitude = Number(longitud);

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {
        return null;
    }

    if (
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        return null;
    }

    return {
        latitude,
        longitude,
    };
};

// ======================================================
// COMPONENTE
// ======================================================

export default function MapaAfectados() {

    // ==================================================
    // REFERENCIA DEL MAPA
    // ==================================================

    const mapRef = useRef<any>(null);

    // ==================================================
    // DATOS
    // ==================================================

    const [
        afectados,
        setAfectados,
    ] = useState<Afectado[]>([]);

    // ==================================================
    // ESTADOS
    // ==================================================

    const [
        cargando,
        setCargando,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    const [
        seleccionado,
        setSeleccionado,
    ] =
        useState<RegistroSeleccionado | null>(
            null
        );

    // ==================================================
    // EDICIÓN
    // ==================================================

    const [
        editando,
        setEditando,
    ] = useState(false);

    const [
        guardando,
        setGuardando,
    ] = useState(false);

    const [
        errorGuardado,
        setErrorGuardado,
    ] = useState<string | null>(null);

    const [
        formulario,
        setFormulario,
    ] = useState({

        nombre: "",
        telefono: "",
        direccion: "",

        zona: "",
        circuito: "",
        congregacion: "",

        tipo_construccion: "",

        estatus: "",
        nivel_danios: "",

        notas: "",

        fecha1: "",
        fecha2: "",
        fecha3: "",

    });

    // ==================================================
    // FILTROS
    // ==================================================

    const [
        filtroZona,
        setFiltroZona,
    ] = useState("");

    const [
        filtroCircuito,
        setFiltroCircuito,
    ] = useState("");

    const [
        filtroCongregacion,
        setFiltroCongregacion,
    ] = useState("");

    const [
        filtroEstatus,
        setFiltroEstatus,
    ] = useState("");

    const [
        filtroDanios,
        setFiltroDanios,
    ] = useState("");

    // ==================================================
    // CARGAR AFECTADOS
    // ==================================================

    const cargarAfectados = async () => {

        setCargando(true);

        setError(null);

        try {

            const {
                data,
                error,
            } =
                await supabase
                    .from("afectados")
                    .select("*")
                    .order(
                        "created_at",
                        {
                            ascending: false,
                        }
                    );

            if (error) {

                console.error(
                    "Error cargando afectados:",
                    error
                );

                setError(
                    `No se pudieron cargar los registros: ${error.message}`
                );

                return;
            }

            setAfectados(
                (data ?? []) as Afectado[]
            );

        } catch (error) {

            console.error(
                error
            );

            setError(
                "Ocurrió un error inesperado al cargar los registros."
            );

        } finally {

            setCargando(false);
        }
    };

    // ==================================================
    // CARGAR AL INICIAR
    // ==================================================

    useEffect(() => {

        cargarAfectados();

    }, []);

    // ==================================================
    // REALTIME
    // ==================================================

    useEffect(() => {

        const canal =
            supabase
                .channel(
                    "afectados-realtime"
                )
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "afectados",
                    },
                    (payload) => {

                        console.log(
                            "Realtime afectados:",
                            payload
                        );

                        if (
                            payload.eventType ===
                            "INSERT"
                        ) {

                            setAfectados(
                                (actuales) => {

                                    const nuevo =
                                        payload.new as Afectado;

                                    if (
                                        actuales.some(
                                            (item) =>
                                                item.id ===
                                                nuevo.id
                                        )
                                    ) {

                                        return actuales;
                                    }

                                    return [
                                        nuevo,
                                        ...actuales,
                                    ];
                                }
                            );
                        }

                        if (
                            payload.eventType ===
                            "UPDATE"
                        ) {

                            setAfectados(
                                (actuales) => {

                                    const actualizado =
                                        payload.new as Afectado;

                                    return actuales.map(
                                        (item) =>
                                            item.id ===
                                            actualizado.id
                                                ? actualizado
                                                : item
                                    );
                                }
                            );

                            setSeleccionado(
                                (actual) => {

                                    if (
                                        !actual
                                    ) {

                                        return actual;
                                    }

                                    const actualizado =
                                        payload.new as Afectado;

                                    if (
                                        actual.afectado.id !==
                                        actualizado.id
                                    ) {

                                        return actual;
                                    }

                                    return {

                                        ...actual,

                                        afectado:
                                            actualizado,

                                    };
                                }
                            );
                        }

                        if (
                            payload.eventType ===
                            "DELETE"
                        ) {

                            const eliminado =
                                payload.old as Afectado;

                            setAfectados(
                                (actuales) =>
                                    actuales.filter(
                                        (item) =>
                                            item.id !==
                                            eliminado.id
                                    )
                            );

                            setSeleccionado(
                                (actual) => {

                                    if (
                                        actual?.afectado.id ===
                                        eliminado.id
                                    ) {

                                        return null;
                                    }

                                    return actual;
                                }
                            );
                        }
                    }
                )
                .subscribe(
                    (status) => {

                        console.log(
                            "Estado Realtime:",
                            status
                        );
                    }
                );

        return () => {

            supabase.removeChannel(
                canal
            );

        };

    }, []);

    // ==================================================
    // OPCIONES DE FILTROS
    // ==================================================

    const zonas = useMemo(() => {

        return Array.from(
            new Set(
                afectados
                    .map(
                        (afectado) =>
                            afectado.zona
                    )
                    .filter(
                        (
                            valor
                        ): valor is string =>
                            Boolean(
                                valor
                            )
                    )
            )
        ).sort();

    }, [afectados]);

    const circuitos = useMemo(() => {

        return Array.from(
            new Set(
                afectados
                    .map(
                        (afectado) =>
                            afectado.circuito
                    )
                    .filter(
                        (
                            valor
                        ): valor is string =>
                            Boolean(
                                valor
                            )
                    )
            )
        ).sort();

    }, [afectados]);

    const congregaciones = useMemo(() => {

        return Array.from(
            new Set(
                afectados
                    .map(
                        (afectado) =>
                            afectado.congregacion
                    )
                    .filter(
                        (
                            valor
                        ): valor is string =>
                            Boolean(
                                valor
                            )
                    )
            )
        ).sort();

    }, [afectados]);

    // ==================================================
    // FILTRAR REGISTROS
    // ==================================================

    const afectadosFiltrados = useMemo(() => {

        return afectados.filter(
            (afectado) => {

                const coincideZona =
                    !filtroZona ||
                    afectado.zona ===
                        filtroZona;

                const coincideCircuito =
                    !filtroCircuito ||
                    afectado.circuito ===
                        filtroCircuito;

                const coincideCongregacion =
                    !filtroCongregacion ||
                    afectado.congregacion ===
                        filtroCongregacion;

                const coincideEstatus =
                    !filtroEstatus ||
                    afectado.estatus ===
                        filtroEstatus;

                const coincideDanios =
                    !filtroDanios ||
                    afectado.nivel_danios ===
                        filtroDanios;

                return (
                    coincideZona &&
                    coincideCircuito &&
                    coincideCongregacion &&
                    coincideEstatus &&
                    coincideDanios
                );
            }
        );

    }, [
        afectados,
        filtroZona,
        filtroCircuito,
        filtroCongregacion,
        filtroEstatus,
        filtroDanios,
    ]);

    // ==================================================
    // REGISTROS CON UBICACIÓN
    // ==================================================

    const registrosConUbicacion = useMemo(() => {

        return afectadosFiltrados.filter((afectado) => {

            const coordenadas =
                obtenerCoordenadasValidas(
                    afectado.latitud,
                    afectado.longitud
                );

            return coordenadas !== null;
        });

    }, [
        afectadosFiltrados
    ]);

    // ==================================================
    // DENSIDAD DE AFECTADOS
    // ==================================================

    const datosDensidad = useMemo(() => {

        return {

            type:
                "FeatureCollection" as const,

            features:
                registrosConUbicacion.map(
                    (afectado) => ({

                        type:
                            "Feature" as const,

                        properties: {

                            id:
                                afectado.id,

                            nivel_danios:
                                afectado.nivel_danios,

                        },

                        geometry: {

                            type:
                                "Point" as const,

                            coordinates: [

                                afectado.longitud!,

                                afectado.latitud!,

                            ],

                        },

                    })
                ),

        };

    }, [
        registrosConUbicacion
    ]);

    // ==================================================
    // LIMPIAR FILTROS
    // ==================================================

    const limpiarFiltros = () => {

        setFiltroZona("");

        setFiltroCircuito("");

        setFiltroCongregacion("");

        setFiltroEstatus("");

        setFiltroDanios("");

        setSeleccionado(null);

        setEditando(false);
    };

    // ==================================================
    // SELECCIONAR AFECTADO
    // ==================================================

    const seleccionarAfectado = (
        afectado: Afectado
    ) => {

        const coordenadas =
            obtenerCoordenadasValidas(
                afectado.latitud,
                afectado.longitud
            );

        if (!coordenadas) {

            console.warn(
                "⚠️ No se puede seleccionar el afectado porque sus coordenadas no son válidas:",
                {
                    id: afectado.id,
                    nombre: afectado.nombre,
                    direccion: afectado.direccion,
                    latitud: afectado.latitud,
                    longitud: afectado.longitud,
                }
            );

            return;
        }

        setSeleccionado({

            latitude:
                coordenadas.latitude,

            longitude:
                coordenadas.longitude,

            afectado,

        });

        setEditando(false);

        setErrorGuardado(null);

        mapRef.current?.flyTo({

            center: [

                coordenadas.longitude,

                coordenadas.latitude,

            ],

            zoom: 16,

            duration: 1000,

            essential: true,

        });
    };

    // ==================================================
    // INICIAR EDICIÓN
    // ==================================================

    const iniciarEdicion = () => {

        if (
            !seleccionado
        ) {

            return;
        }

        const afectado =
            seleccionado.afectado;

        setFormulario({

            nombre:
                afectado.nombre ?? "",

            telefono:
                afectado.telefono ?? "",

            direccion:
                afectado.direccion ?? "",

            zona:
                afectado.zona ?? "",

            circuito:
                afectado.circuito ?? "",

            congregacion:
                afectado.congregacion ?? "",

            tipo_construccion:
                afectado.tipo_construccion ?? "",

            estatus:
                afectado.estatus ?? "",

            nivel_danios:
                afectado.nivel_danios ?? "",

            notas:
                afectado.notas ?? "",

            fecha1:
                afectado.fecha1 ?? "",

            fecha2:
                afectado.fecha2 ?? "",

            fecha3:
                afectado.fecha3 ?? "",

        });

        setErrorGuardado(null);

        setEditando(true);
    };

    // ==================================================
    // CANCELAR EDICIÓN
    // ==================================================

    const cancelarEdicion = () => {

        setEditando(false);

        setErrorGuardado(null);
    };

    // ==================================================
    // CAMBIAR FORMULARIO
    // ==================================================

    const cambiarFormulario = (
        campo: keyof typeof formulario,
        valor: string
    ) => {

        setFormulario(
            (actual) => ({

                ...actual,

                [campo]:
                    valor,

            })
        );
    };

    // ==================================================
    // GUARDAR CAMBIOS
    // ==================================================

    const guardarCambios = async () => {

        if (
            !seleccionado
        ) {

            return;
        }

        setGuardando(true);

        setErrorGuardado(null);

        try {

            const {
                data,
                error,
            } =
                await supabase
                    .from("afectados")
                    .update({

                        nombre:
                            formulario.nombre.trim() ||
                            null,

                        telefono:
                            formulario.telefono.trim() ||
                            null,

                        direccion:
                            formulario.direccion.trim() ||
                            null,

                        zona:
                            formulario.zona.trim() ||
                            null,

                        circuito:
                            formulario.circuito.trim() ||
                            null,

                        congregacion:
                            formulario.congregacion.trim() ||
                            null,

                        tipo_construccion:
                            formulario.tipo_construccion.trim() ||
                            null,

                        estatus:
                            formulario.estatus ||
                            null,

                        nivel_danios:
                            formulario.nivel_danios ||
                            null,

                        notas:
                            formulario.notas.trim() ||
                            null,

                        fecha1:
                            formulario.fecha1 ||
                            null,

                        fecha2:
                            formulario.fecha2 ||
                            null,

                        fecha3:
                            formulario.fecha3 ||
                            null,

                    })
                    .eq(
                        "id",
                        seleccionado.afectado.id
                    )
                    .select()
                    .single();

            if (error) {

                console.error(
                    "Error actualizando afectado:",
                    error
                );

                setErrorGuardado(
                    `No se pudieron guardar los cambios: ${error.message}`
                );

                return;
            }

            if (data) {

                const actualizado =
                    data as Afectado;

                setAfectados(
                    (actuales) =>
                        actuales.map(
                            (item) =>
                                item.id ===
                                actualizado.id
                                    ? actualizado
                                    : item
                        )
                );

                setSeleccionado(
                    (actual) => {

                        if (
                            !actual
                        ) {

                            return actual;
                        }

                        return {

                            ...actual,

                            afectado:
                                actualizado,

                        };
                    }
                );
            }

            setEditando(false);

        } catch (error) {

            console.error(
                error
            );

            setErrorGuardado(
                "Ocurrió un error inesperado al guardar los cambios."
            );

        } finally {

            setGuardando(false);
        }
    };

    // ==================================================
    // CERRAR POPUP
    // ==================================================

    const cerrarPopup = () => {

        if (
            guardando
        ) {

            return;
        }

        setSeleccionado(null);

        setEditando(false);

        setErrorGuardado(null);
    };

    // ==================================================
    // ESTADÍSTICAS
    // ==================================================

    const totalRegistros =
        afectadosFiltrados.length;

    const totalConUbicacion =
        registrosConUbicacion.length;

    const totalSinUbicacion =
        totalRegistros -
        totalConUbicacion;

    // ==================================================
    // ¿HAY FILTROS?
    // ==================================================

    const hayFiltros =
        Boolean(
            filtroZona ||
            filtroCircuito ||
            filtroCongregacion ||
            filtroEstatus ||
            filtroDanios
        );

    // ==================================================
    // RENDER
    // ==================================================

    return (

        <div className="relative h-full w-full overflow-hidden rounded-xl">

            {/* ==================================================
                MAPA
            ================================================== */}

            <Map

                ref={mapRef}

                initialViewState={{

                    longitude:
                        -66.9036,

                    latitude:
                        10.4806,

                    zoom:
                        10,

                }}

                style={{

                    width:
                        "100%",

                    height:
                        "100%",

                }}

                mapStyle={{

                    version: 8,

                    sources: {

                        osm: {

                            type:
                                "raster",

                            tiles: [

                                "https://tile.openstreetmap.org/{z}/{x}/{y}.png",

                            ],

                            tileSize:
                                256,

                            attribution:
                                "© OpenStreetMap contributors",

                        },

                    },

                    layers: [

                        {

                            id:
                                "osm",

                            type:
                                "raster",

                            source:
                                "osm",

                        },

                    ],

                }}

            >

                {/* ==================================================
                    CONTROLES
                ================================================== */}

                <NavigationControl
                    position="top-right"
                />

                {/* ==================================================
                    DENSIDAD DE AFECTADOS
                ================================================== */}

                <Source
                    id="densidad-afectados"
                    type="geojson"
                    data={datosDensidad}
                >

                    <Layer

                        id="densidad-afectados-heatmap"

                        type="heatmap"

                        paint={{

                            "heatmap-weight":
                                1,

                            "heatmap-intensity": [

                                "interpolate",

                                [
                                    "linear"
                                ],

                                [
                                    "zoom"
                                ],

                                8,
                                0.8,

                                12,
                                1.5,

                                16,
                                2.5,

                            ],

                            "heatmap-radius": [

                                "interpolate",

                                [
                                    "linear"
                                ],

                                [
                                    "zoom"
                                ],

                                8,
                                30,

                                12,
                                45,

                                16,
                                60,

                            ],

                            "heatmap-opacity":
                                0.65,

                            "heatmap-color": [

                                "interpolate",

                                [
                                    "linear"
                                ],

                                [
                                    "heatmap-density"
                                ],

                                0,
                                "rgba(0, 0, 255, 0)",

                                0.1,
                                "rgba(0, 128, 255, 0.20)",

                                0.25,
                                "rgba(0, 255, 255, 0.35)",

                                0.4,
                                "rgba(0, 255, 0, 0.45)",

                                0.55,
                                "rgba(255, 255, 0, 0.55)",

                                0.7,
                                "rgba(255, 165, 0, 0.65)",

                                0.85,
                                "rgba(255, 60, 0, 0.75)",

                                1,
                                "rgba(180, 0, 0, 0.85)",

                            ],

                        }}

                    />

                </Source>

                {/* ==================================================
                    MARCADORES
                ================================================== */}

                {registrosConUbicacion.map((afectado) => {

                    const coordenadas =
                        obtenerCoordenadasValidas(
                            afectado.latitud,
                            afectado.longitud
                        );

                    if (!coordenadas) {

                        return null;
                    }

                    return (

                        <Marker

                            key={
                                afectado.id
                            }

                            latitude={
                                coordenadas.latitude
                            }

                            longitude={
                                coordenadas.longitude
                            }

                            anchor="bottom"

                        >

                            <button

                                type="button"

                                onClick={() =>
                                    seleccionarAfectado(
                                        afectado
                                    )
                                }

                                title={
                                    afectado.nombre ??
                                    "Afectado"
                                }

                                className="group relative"

                            >

                                <div

                                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-lg shadow-lg transition-transform group-hover:scale-110 ${obtenerColorEstatus(
                                        afectado.estatus
                                    )}`}

                                >

                                    📍

                                </div>

                            </button>

                        </Marker>

                    );
                })}

                {/* ==================================================
                    POPUP
                ================================================== */}

                {seleccionado && (

                    <Popup

                        longitude={
                            seleccionado.longitude
                        }

                        latitude={
                            seleccionado.latitude
                        }

                        anchor="bottom"

                        closeOnClick={false}

                        onClose={
                            cerrarPopup
                        }

                        maxWidth="420px"

                        closeButton={
                            true
                        }

                    >

                        <div className="w-[350px] max-w-full">

                            {/* ======================================
                                CABECERA
                            ====================================== */}

                            <div className="flex items-start justify-between gap-3">

                                <div>

                                    <h3 className="text-base font-bold text-slate-900">

                                        {
                                            seleccionado
                                                .afectado
                                                .nombre ||
                                            "Afectado sin nombre"
                                        }

                                    </h3>

                                    <div className="mt-2">

                                        <span

                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-white ${obtenerColorEstatus(
                                                seleccionado
                                                    .afectado
                                                    .estatus
                                            )}`}

                                        >

                                            {
                                                obtenerTextoEstatus(
                                                    seleccionado
                                                        .afectado
                                                        .estatus
                                                )
                                            }

                                        </span>

                                    </div>

                                </div>

                            </div>

                            {/* ======================================
                                MODO EDICIÓN
                            ====================================== */}

                            {editando ? (

                                <div className="mt-4 space-y-4">

                                    {/* NOMBRE */}

                                    <div>

                                        <label className="mb-1 block text-xs font-semibold text-slate-600">

                                            Nombre

                                        </label>

                                        <input

                                            type="text"

                                            value={
                                                formulario.nombre
                                            }

                                            onChange={(e) =>
                                                cambiarFormulario(
                                                    "nombre",
                                                    e.target.value
                                                )
                                            }

                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"

                                        />

                                    </div>

                                    {/* TELÉFONO */}

                                    <div>

                                        <label className="mb-1 block text-xs font-semibold text-slate-600">

                                            Teléfono

                                        </label>

                                        <input

                                            type="text"

                                            value={
                                                formulario.telefono
                                            }

                                            onChange={(e) =>
                                                cambiarFormulario(
                                                    "telefono",
                                                    e.target.value
                                                )
                                            }

                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"

                                        />

                                    </div>

                                    {/* DIRECCIÓN */}

                                    <div>

                                        <label className="mb-1 block text-xs font-semibold text-slate-600">

                                            Dirección

                                        </label>

                                        <textarea

                                            value={
                                                formulario.direccion
                                            }

                                            onChange={(e) =>
                                                cambiarFormulario(
                                                    "direccion",
                                                    e.target.value
                                                )
                                            }

                                            rows={3}

                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"

                                        />

                                    </div>

                                    {/* ZONA / CIRCUITO */}

                                    <div className="grid grid-cols-2 gap-2">

                                        <div>

                                            <label className="mb-1 block text-xs font-semibold text-slate-600">

                                                Zona

                                            </label>

                                            <input

                                                type="text"

                                                value={
                                                    formulario.zona
                                                }

                                                onChange={(e) =>
                                                    cambiarFormulario(
                                                        "zona",
                                                        e.target.value
                                                    )
                                                }

                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"

                                            />

                                        </div>

                                        <div>

                                            <label className="mb-1 block text-xs font-semibold text-slate-600">

                                                Circuito

                                            </label>

                                            <input

                                                type="text"

                                                value={
                                                    formulario.circuito
                                                }

                                                onChange={(e) =>
                                                    cambiarFormulario(
                                                        "circuito",
                                                        e.target.value
                                                    )
                                                }

                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"

                                            />

                                        </div>

                                    </div>

                                    {/* CONGREGACIÓN */}

                                    <div>

                                        <label className="mb-1 block text-xs font-semibold text-slate-600">

                                            Congregación

                                        </label>

                                        <input

                                            type="text"

                                            value={
                                                formulario.congregacion
                                            }

                                            onChange={(e) =>
                                                cambiarFormulario(
                                                    "congregacion",
                                                    e.target.value
                                                )
                                            }

                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"

                                        />

                                    </div>

                                    {/* TIPO CONSTRUCCIÓN */}

                                    <div>

                                        <label className="mb-1 block text-xs font-semibold text-slate-600">

                                            Tipo de construcción

                                        </label>

                                        <input

                                            type="text"

                                            value={
                                                formulario.tipo_construccion
                                            }

                                            onChange={(e) =>
                                                cambiarFormulario(
                                                    "tipo_construccion",
                                                    e.target.value
                                                )
                                            }

                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"

                                        />

                                    </div>

                                    {/* ESTATUS */}

                                    <div>

                                        <label className="mb-1 block text-xs font-semibold text-slate-600">

                                            Estatus

                                        </label>

                                        <select

                                            value={
                                                formulario.estatus
                                            }

                                            onChange={(e) =>
                                                cambiarFormulario(
                                                    "estatus",
                                                    e.target.value
                                                )
                                            }

                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"

                                        >

                                            <option value="">

                                                Sin estatus

                                            </option>

                                            <option value="pendiente">

                                                Pendiente

                                            </option>

                                            <option value="visitado">

                                                Visitado

                                            </option>

                                            <option value="inspeccionado">

                                                Inspeccionado

                                            </option>

                                            <option value="atendido">

                                                Atendido

                                            </option>

                                            <option value="reconstruido">

                                                Reconstruido

                                            </option>

                                        </select>

                                    </div>

                                    {/* DAÑOS */}

                                    <div>

                                        <label className="mb-1 block text-xs font-semibold text-slate-600">

                                            Nivel de daños

                                        </label>

                                        <select

                                            value={
                                                formulario.nivel_danios
                                            }

                                            onChange={(e) =>
                                                cambiarFormulario(
                                                    "nivel_danios",
                                                    e.target.value
                                                )
                                            }

                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"

                                        >

                                            <option value="">

                                                No especificado

                                            </option>

                                            <option value="sin_danos">

                                                Sin daños

                                            </option>

                                            <option value="leve">

                                                Daños leves

                                            </option>

                                            <option value="moderado">

                                                Daños moderados

                                            </option>

                                            <option value="grave">

                                                Daños graves

                                            </option>

                                            <option value="destruccion_total">

                                                Destrucción total

                                            </option>

                                        </select>

                                    </div>

                                    {/* FECHAS */}

                                    <div>

                                        <p className="mb-2 text-sm font-bold text-slate-900">

                                            Fechas

                                        </p>

                                        <div className="space-y-3">

                                            <div>

                                                <label className="mb-1 block text-xs font-semibold text-slate-600">

                                                    Fecha 1

                                                </label>

                                                <input

                                                    type="date"

                                                    value={
                                                        formulario.fecha1
                                                    }

                                                    onChange={(e) =>
                                                        cambiarFormulario(
                                                            "fecha1",
                                                            e.target.value
                                                        )
                                                    }

                                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"

                                                />

                                            </div>

                                            <div>

                                                <label className="mb-1 block text-xs font-semibold text-slate-600">

                                                    Fecha 2

                                                </label>

                                                <input

                                                    type="date"

                                                    value={
                                                        formulario.fecha2
                                                    }

                                                    onChange={(e) =>
                                                        cambiarFormulario(
                                                            "fecha2",
                                                            e.target.value
                                                        )
                                                    }

                                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"

                                                />

                                            </div>

                                            <div>

                                                <label className="mb-1 block text-xs font-semibold text-slate-600">

                                                    Fecha 3

                                                </label>

                                                <input

                                                    type="date"

                                                    value={
                                                        formulario.fecha3
                                                    }

                                                    onChange={(e) =>
                                                        cambiarFormulario(
                                                            "fecha3",
                                                            e.target.value
                                                        )
                                                    }

                                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"

                                                />

                                            </div>

                                        </div>

                                    </div>

                                    {/* NOTAS */}

                                    <div>

                                        <label className="mb-1 block text-xs font-semibold text-slate-600">

                                            Notas

                                        </label>

                                        <textarea

                                            value={
                                                formulario.notas
                                            }

                                            onChange={(e) =>
                                                cambiarFormulario(
                                                    "notas",
                                                    e.target.value
                                                )
                                            }

                                            rows={4}

                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"

                                        />

                                    </div>

                                    {/* ERROR */}

                                    {errorGuardado && (

                                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">

                                            <p className="text-sm text-red-700">

                                                {errorGuardado}

                                            </p>

                                        </div>

                                    )}

                                    {/* BOTONES */}

                                    <div className="flex gap-2 border-t border-slate-200 pt-4">

                                        <button

                                            type="button"

                                            onClick={
                                                cancelarEdicion
                                            }

                                            disabled={
                                                guardando
                                            }

                                            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"

                                        >

                                            Cancelar

                                        </button>

                                        <button

                                            type="button"

                                            onClick={
                                                guardarCambios
                                            }

                                            disabled={
                                                guardando
                                            }

                                            className="flex-1 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"

                                        >

                                            {guardando
                                                ? "Guardando..."
                                                : "Guardar cambios"}

                                        </button>

                                    </div>

                                </div>

                            ) : (

                                /* ==================================
                                   MODO VISUALIZACIÓN
                                ================================== */

                                <div>

                                    {/* DIRECCIÓN */}

                                    {seleccionado
                                        .afectado
                                        .direccion && (

                                        <div className="mt-3">

                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                                                Dirección

                                            </p>

                                            <p className="mt-1 text-sm text-slate-700">

                                                {
                                                    seleccionado
                                                        .afectado
                                                        .direccion
                                                }

                                            </p>

                                        </div>

                                    )}

                                    {/* TELÉFONO */}

                                    {seleccionado
                                        .afectado
                                        .telefono && (

                                        <div className="mt-3">

                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                                                Teléfono

                                            </p>

                                            <p className="mt-1 text-sm text-slate-700">

                                                {
                                                    seleccionado
                                                        .afectado
                                                        .telefono
                                                }

                                            </p>

                                        </div>

                                    )}

                                    {/* ZONA / CIRCUITO */}

                                    <div className="mt-3 grid grid-cols-2 gap-2">

                                        <div>

                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                                                Zona

                                            </p>

                                            <p className="text-sm text-slate-700">

                                                {
                                                    seleccionado
                                                        .afectado
                                                        .zona ||
                                                    "—"
                                                }

                                            </p>

                                        </div>

                                        <div>

                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                                                Circuito

                                            </p>

                                            <p className="text-sm text-slate-700">

                                                {
                                                    seleccionado
                                                        .afectado
                                                        .circuito ||
                                                    "—"
                                                }

                                            </p>

                                        </div>

                                    </div>

                                    {/* CONGREGACIÓN */}

                                    {seleccionado
                                        .afectado
                                        .congregacion && (

                                        <div className="mt-3">

                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                                                Congregación

                                            </p>

                                            <p className="mt-1 text-sm text-slate-700">

                                                {
                                                    seleccionado
                                                        .afectado
                                                        .congregacion
                                                }

                                            </p>

                                        </div>

                                    )}

                                    {/* DAÑOS */}

                                    <div className="mt-3 rounded-lg bg-slate-50 p-3">

                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                                            Nivel de daños

                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-slate-900">

                                            {
                                                obtenerTextoDanios(
                                                    seleccionado
                                                        .afectado
                                                        .nivel_danios
                                                )
                                            }

                                        </p>

                                    </div>

                                    {/* TIPO CONSTRUCCIÓN */}

                                    {seleccionado
                                        .afectado
                                        .tipo_construccion && (

                                        <div className="mt-3">

                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                                                Tipo de construcción

                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-900">

                                                {
                                                    seleccionado
                                                        .afectado
                                                        .tipo_construccion
                                                }

                                            </p>

                                        </div>

                                    )}

                                    {/* FECHAS */}

                                    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">

                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">

                                            Fechas de seguimiento

                                        </p>

                                        <div className="grid grid-cols-3 gap-2">

                                            <div className="rounded-lg bg-slate-50 p-2">

                                                <p className="text-[10px] font-semibold uppercase text-slate-500">

                                                    Fecha 1

                                                </p>

                                                <p className="mt-1 text-xs font-medium text-slate-800">

                                                    {
                                                        seleccionado
                                                            .afectado
                                                            .fecha1 ||
                                                        "—"
                                                    }

                                                </p>

                                            </div>

                                            <div className="rounded-lg bg-slate-50 p-2">

                                                <p className="text-[10px] font-semibold uppercase text-slate-500">

                                                    Fecha 2

                                                </p>

                                                <p className="mt-1 text-xs font-medium text-slate-800">

                                                    {
                                                        seleccionado
                                                            .afectado
                                                            .fecha2 ||
                                                        "—"
                                                    }

                                                </p>

                                            </div>

                                            <div className="rounded-lg bg-slate-50 p-2">

                                                <p className="text-[10px] font-semibold uppercase text-slate-500">

                                                    Fecha 3

                                                </p>

                                                <p className="mt-1 text-xs font-medium text-slate-800">

                                                    {
                                                        seleccionado
                                                            .afectado
                                                            .fecha3 ||
                                                        "—"
                                                    }

                                                </p>

                                            </div>

                                        </div>

                                    </div>

                                    {/* NOTAS */}

                                    {seleccionado
                                        .afectado
                                        .notas && (

                                        <div className="mt-3">

                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                                                Notas

                                            </p>

                                            <p className="mt-1 text-sm text-slate-700">

                                                {
                                                    seleccionado
                                                        .afectado
                                                        .notas
                                                }

                                            </p>

                                        </div>

                                    )}

                                    {/* COORDENADAS */}

                                    <div className="mt-3 border-t border-slate-200 pt-3">

                                        <p className="text-xs text-slate-500">

                                            Coordenadas

                                        </p>

                                        <p className="mt-1 font-mono text-xs text-slate-700">

                                            {
                                                seleccionado
                                                    .latitude
                                                    .toFixed(
                                                        6
                                                    )
                                            }

                                            {" , "}

                                            {
                                                seleccionado
                                                    .longitude
                                                    .toFixed(
                                                        6
                                                    )
                                            }

                                        </p>

                                    </div>

                                    {/* EDITAR */}

                                    <div className="mt-4 border-t border-slate-200 pt-3">

                                        <button

                                            type="button"

                                            onClick={
                                                iniciarEdicion
                                            }

                                            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"

                                        >

                                            ✏️ Editar registro

                                        </button>

                                    </div>

                                </div>

                            )}

                        </div>

                    </Popup>

                )}

            </Map>

            {/* ==================================================
                PANEL DE FILTROS
            ================================================== */}

            <div className="absolute left-4 right-4 top-4 z-10">

                <div className="rounded-xl bg-white p-4 shadow-xl">

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                        <div>

                            <h1 className="text-lg font-bold text-slate-900">

                                Mapa de afectados

                            </h1>

                            <p className="text-sm text-slate-500">

                                Caracas y Estado Miranda

                            </p>

                        </div>

                        <div className="flex items-center gap-2">

                            <div className="rounded-lg bg-slate-100 px-3 py-2 text-center">

                                <p className="text-xs text-slate-500">

                                    Registros

                                </p>

                                <p className="text-lg font-bold text-slate-900">

                                    {
                                        totalRegistros
                                    }

                                </p>

                            </div>

                            <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">

                                <p className="text-xs text-blue-600">

                                    Ubicados

                                </p>

                                <p className="text-lg font-bold text-blue-700">

                                    {
                                        totalConUbicacion
                                    }

                                </p>

                            </div>

                        </div>

                    </div>

                    {/* FILTROS */}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

                        <select

                            value={
                                filtroZona
                            }

                            onChange={(e) =>
                                setFiltroZona(
                                    e.target.value
                                )
                            }

                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"

                        >

                            <option value="">

                                Todas las zonas

                            </option>

                            {zonas.map(
                                (zona) => (

                                    <option
                                        key={
                                            zona
                                        }
                                        value={
                                            zona
                                        }
                                    >

                                        {zona}

                                    </option>

                                )
                            )}

                        </select>

                        <select

                            value={
                                filtroCircuito
                            }

                            onChange={(e) =>
                                setFiltroCircuito(
                                    e.target.value
                                )
                            }

                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"

                        >

                            <option value="">

                                Todos los circuitos

                            </option>

                            {circuitos.map(
                                (circuito) => (

                                    <option
                                        key={
                                            circuito
                                        }
                                        value={
                                            circuito
                                        }
                                    >

                                        {circuito}

                                    </option>

                                )
                            )}

                        </select>

                        <select

                            value={
                                filtroCongregacion
                            }

                            onChange={(e) =>
                                setFiltroCongregacion(
                                    e.target.value
                                )
                            }

                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"

                        >

                            <option value="">

                                Todas las congregaciones

                            </option>

                            {congregaciones.map(
                                (
                                    congregacion
                                ) => (

                                    <option
                                        key={
                                            congregacion
                                        }
                                        value={
                                            congregacion
                                        }
                                    >

                                        {
                                            congregacion
                                        }

                                    </option>

                                )
                            )}

                        </select>

                        <select

                            value={
                                filtroEstatus
                            }

                            onChange={(e) =>
                                setFiltroEstatus(
                                    e.target.value
                                )
                            }

                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"

                        >

                            <option value="">

                                Todos los estatus

                            </option>

                            <option value="pendiente">

                                Pendiente

                            </option>

                            <option value="visitado">

                                Visitado

                            </option>

                            <option value="inspeccionado">

                                Inspeccionado

                            </option>

                            <option value="atendido">

                                Atendido

                            </option>

                            <option value="reconstruido">

                                Reconstruido

                            </option>

                        </select>

                        <select

                            value={
                                filtroDanios
                            }

                            onChange={(e) =>
                                setFiltroDanios(
                                    e.target.value
                                )
                            }

                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"

                        >

                            <option value="">

                                Todos los daños

                            </option>

                            <option value="sin_danos">

                                Sin daños

                            </option>

                            <option value="leve">

                                Daños leves

                            </option>

                            <option value="moderado">

                                Daños moderados

                            </option>

                            <option value="grave">

                                Daños graves

                            </option>

                            <option value="destruccion_total">

                                Destrucción total

                            </option>

                        </select>

                    </div>

                    {/* FILTROS ACTIVOS */}

                    {hayFiltros && (

                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">

                            <p className="text-sm text-slate-500">

                                Mostrando{" "}

                                <strong className="text-slate-800">

                                    {
                                        totalRegistros
                                    }

                                </strong>{" "}

                                de{" "}

                                <strong className="text-slate-800">

                                    {
                                        afectados.length
                                    }

                                </strong>{" "}

                                registros.

                            </p>

                            <button

                                type="button"

                                onClick={
                                    limpiarFiltros
                                }

                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"

                            >

                                Limpiar filtros

                            </button>

                        </div>

                    )}

                    {!hayFiltros && (

                        <div className="mt-3 flex items-center justify-between">

                            <p className="text-xs text-slate-500">

                                {
                                    totalSinUbicacion
                                }{" "}

                                registro(s) sin coordenadas.

                            </p>

                            <button

                                type="button"

                                onClick={
                                    cargarAfectados
                                }

                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"

                            >

                                ↻ Actualizar

                            </button>

                        </div>

                    )}

                </div>

            </div>

            {/* ==================================================
                LEYENDA
            ================================================== */}

            <div className="absolute bottom-4 left-4 z-10">

                <div className="rounded-xl bg-white p-4 shadow-xl">

                    <p className="mb-3 text-sm font-bold text-slate-900">

                        Estatus

                    </p>

                    <div className="space-y-2">

                        <div className="flex items-center gap-2">

                            <span className="h-3 w-3 rounded-full bg-slate-500" />

                            <span className="text-xs text-slate-700">

                                Pendiente

                            </span>

                        </div>

                        <div className="flex items-center gap-2">

                            <span className="h-3 w-3 rounded-full bg-blue-600" />

                            <span className="text-xs text-slate-700">

                                Visitado

                            </span>

                        </div>

                        <div className="flex items-center gap-2">

                            <span className="h-3 w-3 rounded-full bg-orange-500" />

                            <span className="text-xs text-slate-700">

                                Inspeccionado

                            </span>

                        </div>

                        <div className="flex items-center gap-2">

                            <span className="h-3 w-3 rounded-full bg-green-600" />

                            <span className="text-xs text-slate-700">

                                Atendido

                            </span>

                        </div>

                        <div className="flex items-center gap-2">

                            <span className="h-3 w-3 rounded-full bg-purple-600" />

                            <span className="text-xs text-slate-700">

                                Reconstruido

                            </span>

                        </div>

                    </div>

                </div>

            </div>

            {/* ==================================================
                CARGANDO
            ================================================== */}

            {cargando && (

                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20">

                    <div className="rounded-xl bg-white px-6 py-4 shadow-xl">

                        <p className="text-sm font-medium text-slate-700">

                            🔄 Cargando registros...

                        </p>

                    </div>

                </div>

            )}

            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (

                <div className="absolute left-1/2 top-4 z-40 w-[90%] max-w-lg -translate-x-1/2">

                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-xl">

                        <p className="font-semibold text-red-800">

                            Error

                        </p>

                        <p className="mt-1 text-sm text-red-700">

                            {error}

                        </p>

                        <button

                            type="button"

                            onClick={
                                cargarAfectados
                            }

                            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"

                        >

                            Reintentar

                        </button>

                    </div>

                </div>

            )}

        </div>

    );
}