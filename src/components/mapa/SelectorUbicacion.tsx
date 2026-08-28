"use client";

import { useRef, useState } from "react";
import Map, {
    Marker,
    NavigationControl,
    MapMouseEvent,
} from "react-map-gl/maplibre";

import "maplibre-gl/dist/maplibre-gl.css";

// ======================================================
// TIPOS
// ======================================================

type MetodoUbicacion =
    | "mapa"
    | "gps"
    | "direccion";

type NivelPrecision =
    | "exacta"
    | "aproximada";

export interface Ubicacion {
    latitude: number;
    longitude: number;
    precision?: number;
    metodo: MetodoUbicacion;
    nivelPrecision: NivelPrecision;
    direccion?: string;
}

interface UbicacionInicial {
    latitude: number;
    longitude: number;
    precision?: number;
    metodo?: MetodoUbicacion;
    nivelPrecision?: NivelPrecision;
    direccion?: string;
}

interface ResultadoBusqueda {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
    name?: string;
    type?: string;
    category?: string;
}

interface PuntoReferencia {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
    name?: string;
    type?: string;
    category?: string;
}

interface SelectorUbicacionProps {
    ubicacionInicial?: UbicacionInicial;

    onConfirmar?: (
        ubicacion: Ubicacion
    ) => void;
}

// ======================================================
// COMPONENTE
// ======================================================

export default function SelectorUbicacion({
    ubicacionInicial,
    onConfirmar,
}: SelectorUbicacionProps) {

    // ==================================================
    // REFERENCIA DEL MAPA
    // ==================================================

    const mapRef = useRef<any>(null);

    // ==================================================
    // UBICACIÓN
    // ==================================================

    const [ubicacion, setUbicacion] =
        useState<Ubicacion | null>(
            ubicacionInicial
                ? {
                    latitude:
                        ubicacionInicial.latitude,

                    longitude:
                        ubicacionInicial.longitude,

                    precision:
                        ubicacionInicial.precision,

                    metodo:
                        ubicacionInicial.metodo ??
                        "mapa",

                    nivelPrecision:
                        ubicacionInicial.nivelPrecision ??
                        "aproximada",

                    direccion:
                        ubicacionInicial.direccion,
                }
                : null
        );

    // ==================================================
    // GPS
    // ==================================================

    const [
        obteniendoUbicacion,
        setObteniendoUbicacion,
    ] = useState(false);

    const [
        errorUbicacion,
        setErrorUbicacion,
    ] = useState<string | null>(null);

    // ==================================================
    // BUSCADOR
    // ==================================================

    const [
        direccion,
        setDireccion,
    ] = useState("");

    const [
        buscandoDireccion,
        setBuscandoDireccion,
    ] = useState(false);

    const [
        errorBusqueda,
        setErrorBusqueda,
    ] = useState<string | null>(null);

    const [
        resultadosBusqueda,
        setResultadosBusqueda,
    ] = useState<ResultadoBusqueda[]>([]);

    // ==================================================
    // REVERSE GEOCODING
    // ==================================================

    const [
        direccionEncontrada,
        setDireccionEncontrada,
    ] = useState<string | null>(
        ubicacionInicial?.direccion ?? null
    );

    const [
        obteniendoDireccion,
        setObteniendoDireccion,
    ] = useState(false);

    // ==================================================
    // PUNTOS DE REFERENCIA
    // ==================================================

    const [
        puntosReferencia,
        setPuntosReferencia,
    ] = useState<PuntoReferencia[]>([]);

    const [
        buscandoReferencias,
        setBuscandoReferencias,
    ] = useState(false);

    const [
        errorReferencias,
        setErrorReferencias,
    ] = useState<string | null>(null);

    // ==================================================
    // MOVER CÁMARA
    // ==================================================

    const moverMapa = (
        latitude: number,
        longitude: number,
        zoom = 15
    ) => {

        mapRef.current?.flyTo({

            center: [
                longitude,
                latitude,
            ],

            zoom,

            duration: 1500,

            essential: true,
        });
    };

    // ==================================================
    // ICONO DEL PUNTO DE REFERENCIA
    // ==================================================

    const obtenerIconoReferencia = (
        punto: PuntoReferencia
    ) => {

        const texto = (
            `${punto.name ?? ""} ${punto.type ?? ""} ${punto.category ?? ""}`
        ).toLowerCase();

        if (
            texto.includes("hospital") ||
            texto.includes("clinic") ||
            texto.includes("health")
        ) {
            return "🏥";
        }

        if (
            texto.includes("school") ||
            texto.includes("college") ||
            texto.includes("university")
        ) {
            return "🏫";
        }

        if (
            texto.includes("church") ||
            texto.includes("place of worship") ||
            texto.includes("iglesia")
        ) {
            return "⛪";
        }

        if (
            texto.includes("park") ||
            texto.includes("plaza")
        ) {
            return "🌳";
        }

        if (
            texto.includes("supermarket") ||
            texto.includes("market") ||
            texto.includes("shop")
        ) {
            return "🛒";
        }

        if (
            texto.includes("restaurant") ||
            texto.includes("cafe")
        ) {
            return "🍽️";
        }

        if (
            texto.includes("police")
        ) {
            return "🚓";
        }

        if (
            texto.includes("fire")
        ) {
            return "🚒";
        }

        if (
            texto.includes("bus") ||
            texto.includes("station")
        ) {
            return "🚌";
        }

        return "📌";
    };

    // ==================================================
    // BUSCAR PUNTOS DE REFERENCIA
    // ==================================================

    const buscarPuntosReferencia = async (
        latitude: number,
        longitude: number
    ) => {

        setBuscandoReferencias(true);

        setErrorReferencias(null);

        try {

            /*
             * Buscamos lugares cercanos mediante
             * Nominatim.
             *
             * Esto NO modifica el mapa base.
             */

            const url =
                `https://nominatim.openstreetmap.org/search?` +
                `format=jsonv2` +
                `limit=20` +
                `addressdetails=1` +
                `lat=${latitude}` +
                `lon=${longitude}`;

            const respuesta =
                await fetch(url);

            if (!respuesta.ok) {

                throw new Error(
                    "No fue posible buscar puntos de referencia."
                );
            }

            const resultados:
                PuntoReferencia[] =
                await respuesta.json();

            /*
             * Eliminamos resultados que no tengan
             * coordenadas válidas.
             */

            const validos =
                resultados.filter(
                    (resultado) =>
                        resultado.lat &&
                        resultado.lon
                );

            setPuntosReferencia(
                validos
            );

        } catch (error) {

            console.error(
                "Error buscando referencias:",
                error
            );

            setErrorReferencias(
                "No fue posible obtener puntos de referencia."
            );

            setPuntosReferencia([]);

        } finally {

            setBuscandoReferencias(
                false
            );
        }
    };

    // ==================================================
    // OBTENER DIRECCIÓN DESDE COORDENADAS
    // ==================================================

    const obtenerDireccion = async (
        latitude: number,
        longitude: number
    ) => {

        setObteniendoDireccion(true);

        try {

            const respuesta =
                await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                );

            if (!respuesta.ok) {

                throw new Error(
                    "No se pudo obtener la dirección."
                );
            }

            const resultado =
                await respuesta.json();

            if (
                resultado.display_name
            ) {

                const nuevaDireccion =
                    resultado.display_name;

                setDireccionEncontrada(
                    nuevaDireccion
                );

                setUbicacion(
                    (actual) => {

                        if (!actual) {
                            return null;
                        }

                        return {
                            ...actual,
                            direccion:
                                nuevaDireccion,
                        };
                    }
                );

            } else {

                setDireccionEncontrada(
                    "No se encontró una dirección exacta."
                );
            }

        } catch (error) {

            console.error(error);

            setDireccionEncontrada(
                "No fue posible determinar la dirección."
            );

        } finally {

            setObteniendoDireccion(
                false
            );
        }
    };

    // ==================================================
    // ACTUALIZAR UBICACIÓN
    // ==================================================

    const actualizarUbicacion = (
        latitude: number,
        longitude: number,
        metodo: MetodoUbicacion,
        precision?: number
    ) => {

        setErrorUbicacion(null);

        setErrorBusqueda(null);

        setResultadosBusqueda([]);

        setUbicacion({

            latitude,

            longitude,

            precision,

            metodo,

            nivelPrecision:
                metodo === "gps" &&
                precision !== undefined &&
                precision <= 20
                    ? "exacta"
                    : "aproximada",
        });

        obtenerDireccion(
            latitude,
            longitude
        );

        buscarPuntosReferencia(
            latitude,
            longitude
        );
    };

    // ==================================================
    // CLICK EN MAPA
    // ==================================================

    const manejarClickMapa = (
        event: MapMouseEvent
    ) => {

        const latitude =
            event.lngLat.lat;

        const longitude =
            event.lngLat.lng;

        setDireccionEncontrada(null);

        actualizarUbicacion(
            latitude,
            longitude,
            "mapa"
        );
    };

    // ==================================================
    // USAR GPS
    // ==================================================

    const usarMiUbicacion = () => {

        if (
            !navigator.geolocation
        ) {

            setErrorUbicacion(
                "Tu navegador no permite obtener la ubicación."
            );

            return;
        }

        setObteniendoUbicacion(
            true
        );

        setErrorUbicacion(null);

        navigator.geolocation.getCurrentPosition(

            (position) => {

                const precisionGPS =
                    position.coords.accuracy;

                const nuevaUbicacion:
                    Ubicacion = {

                    latitude:
                        position.coords.latitude,

                    longitude:
                        position.coords.longitude,

                    precision:
                        precisionGPS,

                    metodo:
                        "gps",

                    nivelPrecision:
                        precisionGPS <= 20
                            ? "exacta"
                            : "aproximada",
                };

                setUbicacion(
                    nuevaUbicacion
                );

                setDireccionEncontrada(
                    null
                );

                setResultadosBusqueda(
                    []
                );

                obtenerDireccion(
                    nuevaUbicacion.latitude,
                    nuevaUbicacion.longitude
                );

                buscarPuntosReferencia(
                    nuevaUbicacion.latitude,
                    nuevaUbicacion.longitude
                );

                moverMapa(
                    nuevaUbicacion.latitude,
                    nuevaUbicacion.longitude,
                    17
                );

                setObteniendoUbicacion(
                    false
                );
            },

            (error) => {

                setObteniendoUbicacion(
                    false
                );

                switch (error.code) {

                    case error.PERMISSION_DENIED:

                        setErrorUbicacion(
                            "No se permitió el acceso a la ubicación."
                        );

                        break;

                    case error.POSITION_UNAVAILABLE:

                        setErrorUbicacion(
                            "No fue posible determinar tu ubicación."
                        );

                        break;

                    case error.TIMEOUT:

                        setErrorUbicacion(
                            "La solicitud de ubicación tardó demasiado."
                        );

                        break;

                    default:

                        setErrorUbicacion(
                            "No se pudo obtener tu ubicación."
                        );
                }
            },

            {
                enableHighAccuracy:
                    true,

                timeout:
                    10000,

                maximumAge:
                    0,
            }
        );
    };

    // ==================================================
    // BUSCAR DIRECCIÓN
    // ==================================================

    const buscarDireccion = async () => {

        if (
            !direccion.trim()
        ) {
            return;
        }

        setBuscandoDireccion(
            true
        );

        setErrorBusqueda(
            null
        );

        setResultadosBusqueda(
            []
        );

        try {

            const respuesta =
                await fetch(
                    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=ve&q=${encodeURIComponent(
                        direccion
                    )}`
                );

            if (!respuesta.ok) {

                throw new Error(
                    "No se pudo realizar la búsqueda."
                );
            }

            const resultados:
                ResultadoBusqueda[] =
                await respuesta.json();

            if (
                !resultados.length
            ) {

                setErrorBusqueda(
                    "No encontramos esa ubicación. Intenta con una dirección más específica."
                );

                return;
            }

            setResultadosBusqueda(
                resultados
            );

        } catch (error) {

            console.error(error);

            setErrorBusqueda(
                "Ocurrió un error al buscar la dirección."
            );

        } finally {

            setBuscandoDireccion(
                false
            );
        }
    };

    // ==================================================
    // SELECCIONAR RESULTADO
    // ==================================================

    const seleccionarResultado = (
        resultado: ResultadoBusqueda
    ) => {

        const latitude =
            Number(resultado.lat);

        const longitude =
            Number(resultado.lon);

        const nuevaDireccion =
            resultado.display_name;

        setUbicacion({

            latitude,

            longitude,

            metodo:
                "direccion",

            nivelPrecision:
                "aproximada",

            direccion:
                nuevaDireccion,
        });

        setDireccionEncontrada(
            nuevaDireccion
        );

        setResultadosBusqueda(
            []
        );

        moverMapa(
            latitude,
            longitude,
            17
        );

        buscarPuntosReferencia(
            latitude,
            longitude
        );
    };

    // ==================================================
    // ARRASTRAR MARCADOR
    // ==================================================

    const moverMarcador = (
        latitude: number,
        longitude: number
    ) => {

        setDireccionEncontrada(
            null
        );

        setUbicacion(
            (actual) => {

                if (!actual) {
                    return null;
                }

                return {

                    ...actual,

                    latitude,

                    longitude,

                    metodo:
                        "mapa",

                    nivelPrecision:
                        "aproximada",

                    precision:
                        undefined,

                    direccion:
                        undefined,
                };
            }
        );

        obtenerDireccion(
            latitude,
            longitude
        );

        buscarPuntosReferencia(
            latitude,
            longitude
        );
    };

    // ==================================================
    // SELECCIONAR REFERENCIA
    // ==================================================

    const seleccionarReferencia = (
        punto: PuntoReferencia
    ) => {

        const latitude =
            Number(punto.lat);

        const longitude =
            Number(punto.lon);

        moverMapa(
            latitude,
            longitude,
            17
        );
    };

    // ==================================================
    // CONFIRMAR
    // ==================================================

    const confirmarUbicacion = () => {

        if (!ubicacion) {
            return;
        }

        onConfirmar?.(
            ubicacion
        );
    };

    // ==================================================
    // TEXTO DEL MÉTODO
    // ==================================================

    const obtenerMetodoTexto =
        () => {

            if (!ubicacion) {
                return "";
            }

            switch (
                ubicacion.metodo
            ) {

                case "gps":

                    return "📍 GPS";

                case "direccion":

                    return "🔍 Dirección";

                case "mapa":

                    return "🗺️ Selección manual";
            }
        };

    // ==================================================
    // TEXTO DE PRECISIÓN
    // ==================================================

    const obtenerPrecisionTexto =
        () => {

            if (!ubicacion) {
                return "";
            }

            if (
                ubicacion.metodo ===
                    "gps" &&
                ubicacion.precision !==
                    undefined
            ) {

                return `±${Math.round(
                    ubicacion.precision
                )} metros`;
            }

            return ubicacion
                .nivelPrecision ===
                "exacta"
                ? "Exacta"
                : "Aproximada";
        };

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
                        ubicacionInicial?.longitude ??
                        -66.9036,

                    latitude:
                        ubicacionInicial?.latitude ??
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

                onClick={
                    manejarClickMapa
                }

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
                    PUNTOS DE REFERENCIA
                ================================================== */}

                {puntosReferencia.map(
                    (punto) => {

                        const latitude =
                            Number(
                                punto.lat
                            );

                        const longitude =
                            Number(
                                punto.lon
                            );

                        if (
                            !Number.isFinite(
                                latitude
                            ) ||
                            !Number.isFinite(
                                longitude
                            )
                        ) {
                            return null;
                        }

                        return (

                            <Marker

                                key={
                                    String(
                                        punto.place_id
                                    )
                                }

                                longitude={
                                    longitude
                                }

                                latitude={
                                    latitude
                                }

                                anchor="center"
                            >

                                <button
                                    type="button"
                                    onClick={(
                                        event
                                    ) => {

                                        event.stopPropagation();

                                        seleccionarReferencia(
                                            punto
                                        );
                                    }}
                                    className="group flex flex-col items-center"
                                >

                                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white text-base shadow-md transition group-hover:scale-110">

                                        {
                                            obtenerIconoReferencia(
                                                punto
                                            )
                                        }

                                    </span>

                                    {punto.name && (

                                        <span className="mt-1 max-w-[140px] truncate rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 shadow-sm">

                                            {
                                                punto.name
                                            }

                                        </span>

                                    )}

                                </button>

                            </Marker>
                        );
                    }
                )}

                {/* ==================================================
                    PRECISIÓN GPS
                ================================================== */}

                {ubicacion &&
                    ubicacion.metodo ===
                        "gps" &&
                    ubicacion.precision !==
                        undefined && (

                    <Marker

                        longitude={
                            ubicacion.longitude
                        }

                        latitude={
                            ubicacion.latitude
                        }

                        anchor="center"
                    >

                        <div

                            className="pointer-events-none rounded-full border border-blue-500 bg-blue-500/15"

                            style={{

                                width:
                                    Math.max(
                                        40,
                                        Math.min(
                                            ubicacion.precision *
                                                2,
                                            300
                                        )
                                    ),

                                height:
                                    Math.max(
                                        40,
                                        Math.min(
                                            ubicacion.precision *
                                                2,
                                            300
                                        )
                                    ),
                            }}
                        />

                    </Marker>
                )}

                {/* ==================================================
                    MARCADOR PRINCIPAL
                ================================================== */}

                {ubicacion && (

                    <Marker

                        longitude={
                            ubicacion.longitude
                        }

                        latitude={
                            ubicacion.latitude
                        }

                        anchor="bottom"

                        draggable

                        onDragEnd={
                            (event) => {

                                moverMarcador(

                                    event.lngLat.lat,

                                    event.lngLat.lng

                                );
                            }
                        }
                    >

                        <div className="relative flex flex-col items-center">

                            {/* ETIQUETA */}

                            {direccionEncontrada && (

                                <div className="mb-2 max-w-[260px] rounded-lg bg-white px-3 py-2 text-center text-xs font-medium text-slate-700 shadow-lg">

                                    📍 Ubicación seleccionada

                                </div>

                            )}

                            {/* PIN */}

                            <div className="relative flex h-12 w-12 cursor-grab items-center justify-center rounded-full border-4 border-white bg-red-600 text-2xl shadow-xl transition-transform hover:scale-110 active:cursor-grabbing">

                                📍

                            </div>

                            {/* PUNTA */}

                            <div className="-mt-2 h-3 w-3 rotate-45 bg-red-600" />

                        </div>

                    </Marker>
                )}

            </Map>

            {/* ==================================================
                PANEL INFERIOR
            ================================================== */}

            <div className="absolute bottom-4 left-4 right-4 max-h-[70%] overflow-y-auto rounded-xl bg-white p-4 shadow-xl">

                {/* ==================================================
                    BUSCADOR
                ================================================== */}

                <div className="mb-3">

                    <label
                        htmlFor="direccion"
                        className="mb-1 block text-sm font-semibold text-gray-900"
                    >

                        Dirección o referencia

                    </label>

                    <div className="flex gap-2">

                        <input

                            id="direccion"

                            type="text"

                            value={
                                direccion
                            }

                            onChange={
                                (event) =>
                                    setDireccion(
                                        event.target.value
                                    )
                            }

                            onKeyDown={
                                (event) => {

                                    if (
                                        event.key ===
                                        "Enter"
                                    ) {

                                        buscarDireccion();
                                    }
                                }
                            }

                            placeholder="Ej. Plaza Venezuela, Caracas"

                            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />

                        <button

                            type="button"

                            onClick={
                                buscarDireccion
                            }

                            disabled={
                                buscandoDireccion ||
                                !direccion.trim()
                            }

                            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                            {buscandoDireccion
                                ? "..."
                                : "🔍"}

                        </button>

                    </div>

                </div>

                {/* ==================================================
                    RESULTADOS
                ================================================== */}

                {resultadosBusqueda.length >
                    0 && (

                    <div className="mb-3 max-h-60 overflow-y-auto rounded-lg border border-gray-200">

                        {resultadosBusqueda.map(
                            (
                                resultado,
                                index
                            ) => (

                                <button

                                    key={`${resultado.place_id}-${index}`}

                                    type="button"

                                    onClick={() =>
                                        seleccionarResultado(
                                            resultado
                                        )
                                    }

                                    className="block w-full border-b border-gray-200 p-3 text-left transition last:border-b-0 hover:bg-gray-50"
                                >

                                    <div className="flex gap-3">

                                        <span className="text-lg">
                                            📍
                                        </span>

                                        <div className="min-w-0">

                                            <p className="text-sm font-semibold text-gray-900">

                                                {resultado.name ||
                                                    "Ubicación encontrada"}

                                            </p>

                                            <p className="mt-1 text-xs text-gray-600">

                                                {
                                                    resultado.display_name
                                                }

                                            </p>

                                        </div>

                                    </div>

                                </button>
                            )
                        )}

                    </div>
                )}

                {/* ==================================================
                    ERROR BÚSQUEDA
                ================================================== */}

                {errorBusqueda && (

                    <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">

                        {errorBusqueda}

                    </div>
                )}

                {/* ==================================================
                    REFERENCIAS
                ================================================== */}

                {ubicacion && (

                    <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm font-semibold text-slate-900">

                                    📌 Puntos de referencia

                                </p>

                                <p className="text-xs text-slate-500">

                                    Lugares cercanos a la ubicación

                                </p>

                            </div>

                            {buscandoReferencias && (

                                <span className="text-xs text-slate-500">

                                    🔄 Buscando...

                                </span>

                            )}

                        </div>

                        {errorReferencias && (

                            <p className="mt-2 text-xs text-red-600">

                                {errorReferencias}

                            </p>

                        )}

                        {!buscandoReferencias &&
                            !errorReferencias &&
                            puntosReferencia.length ===
                                0 && (

                            <p className="mt-2 text-xs text-slate-500">

                                No se encontraron referencias cercanas.

                            </p>

                        )}

                        {puntosReferencia.length >
                            0 && (

                            <div className="mt-3 grid max-h-36 gap-2 overflow-y-auto">

                                {puntosReferencia
                                    .slice(0, 10)
                                    .map(
                                        (punto) => (

                                            <button

                                                key={
                                                    punto.place_id
                                                }

                                                type="button"

                                                onClick={() =>
                                                    seleccionarReferencia(
                                                        punto
                                                    )
                                                }

                                                className="flex items-center gap-2 rounded-lg bg-white p-2 text-left text-xs shadow-sm transition hover:bg-blue-50"
                                            >

                                                <span className="text-base">

                                                    {
                                                        obtenerIconoReferencia(
                                                            punto
                                                        )
                                                    }

                                                </span>

                                                <span className="min-w-0 flex-1 truncate font-medium text-slate-700">

                                                    {
                                                        punto.name ||
                                                        punto.display_name
                                                    }

                                                </span>

                                            </button>

                                        )
                                    )}

                            </div>
                        )}

                    </div>
                )}

                {/* ==================================================
                    GPS
                ================================================== */}

                <button

                    type="button"

                    onClick={
                        usarMiUbicacion
                    }

                    disabled={
                        obteniendoUbicacion
                    }

                    className="mb-3 w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                    {obteniendoUbicacion

                        ? "Obteniendo ubicación..."

                        : "📍 Usar mi ubicación"}

                </button>

                {/* ==================================================
                    ERROR GPS
                ================================================== */}

                {errorUbicacion && (

                    <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">

                        {errorUbicacion}

                    </div>
                )}

                {/* ==================================================
                    INFORMACIÓN
                ================================================== */}

                {ubicacion && (

                    <div className="mb-3 rounded-lg bg-gray-50 p-3 text-sm">

                        <p className="mb-2 font-semibold text-gray-900">

                            Ubicación seleccionada

                        </p>

                        <p className="text-gray-600">

                            Latitud:{" "}

                            {ubicacion.latitude.toFixed(
                                6
                            )}

                        </p>

                        <p className="text-gray-600">

                            Longitud:{" "}

                            {ubicacion.longitude.toFixed(
                                6
                            )}

                        </p>

                        <div className="mt-3 border-t border-gray-200 pt-3">

                            <p className="font-semibold text-gray-900">

                                Dirección aproximada

                            </p>

                            {obteniendoDireccion ? (

                                <p className="mt-1 text-sm text-gray-500">

                                    🔄 Obteniendo dirección...

                                </p>

                            ) : (

                                <p className="mt-1 text-sm text-gray-600">

                                    {direccionEncontrada ??
                                        "No disponible"}

                                </p>
                            )}

                        </div>

                        <p className="mt-3 text-gray-700">

                            Método:{" "}

                            <strong>

                                {
                                    obtenerMetodoTexto()
                                }

                            </strong>

                        </p>

                        <p className="text-gray-700">

                            Precisión:{" "}

                            <strong>

                                {
                                    obtenerPrecisionTexto()
                                }

                            </strong>

                        </p>

                    </div>
                )}

                {/* ==================================================
                    CONFIRMAR
                ================================================== */}

                <button

                    type="button"

                    onClick={
                        confirmarUbicacion
                    }

                    disabled={
                        !ubicacion
                    }

                    className="w-full rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                    ✓ Confirmar ubicación

                </button>

            </div>

        </div>
    );
}