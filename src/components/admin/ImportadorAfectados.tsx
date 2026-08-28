"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

interface FilaImportacion {
    [key: string]: any;
}

interface RegistroPreparado {
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

interface Campo {
    key: keyof RegistroPreparado;
    label: string;
}

const CAMPOS: Campo[] = [
    {
        key: "zona",
        label: "Zona",
    },
    {
        key: "circuito",
        label: "Circuito",
    },
    {
        key: "congregacion",
        label: "Congregación",
    },
    {
        key: "nombre",
        label: "Nombre",
    },
    {
        key: "telefono",
        label: "Teléfono",
    },
    {
        key: "direccion",
        label: "Dirección",
    },
    {
        key: "latitud",
        label: "Latitud",
    },
    {
        key: "longitud",
        label: "Longitud",
    },
    {
        key: "precision_gps",
        label: "Precisión GPS",
    },
    {
        key: "tipo_construccion",
        label: "Tipo de construcción",
    },
    {
        key: "estatus",
        label: "Estatus",
    },
    {
        key: "nivel_danios",
        label: "Nivel de daños",
    },
    {
        key: "notas",
        label: "Notas",
    },
    {
        key: "s183",
        label: "S-183",
    },
    {
        key: "photoreport",
        label: "Photo Report",
    },
    {
        key: "fecha1",
        label: "Fecha 1",
    },
    {
        key: "fecha2",
        label: "Fecha 2",
    },
    {
        key: "fecha3",
        label: "Fecha 3",
    },
    {
        key: "metodo_ubicacion",
        label: "Método de ubicación",
    },
    {
        key: "nivel_precision",
        label: "Nivel de precisión",
    },
];

const normalizarTexto = (valor: any) => {
    if (
        valor === null ||
        valor === undefined
    ) {
        return "";
    }

    return String(valor)
        .trim()
        .replace(/\s+/g, " ");
};

const normalizarClave = (
    valor: string
) => {
    return valor
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
};

const convertirNumero = (
    valor: any
) => {
    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return null;
    }

    const numero = Number(
        String(valor)
            .replace(",", ".")
            .trim()
    );

    return Number.isFinite(numero)
        ? numero
        : null;
};

const convertirFecha = (
    valor: any
) => {
    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return null;
    }

    if (valor instanceof Date) {
        return valor
            .toISOString()
            .split("T")[0];
    }

    if (
        typeof valor === "number" &&
        Number.isFinite(valor)
    ) {
        const fecha =
            XLSX.SSF.parse_date_code(
                valor
            );

        if (fecha) {
            return `${fecha.y}-${String(
                fecha.m
            ).padStart(
                2,
                "0"
            )}-${String(
                fecha.d
            ).padStart(
                2,
                "0"
            )}`;
        }
    }

    const texto = String(valor).trim();

    const partes = texto.split(
        /[\/\-]/
    );

    if (partes.length === 3) {
        let dia = partes[0];
        let mes = partes[1];
        let anio = partes[2];

        if (anio.length === 2) {
            anio = `20${anio}`;
        }

        if (
            dia.length <= 2 &&
            mes.length <= 2 &&
            anio.length === 4
        ) {
            return `${anio}-${mes.padStart(
                2,
                "0"
            )}-${dia.padStart(
                2,
                "0"
            )}`;
        }
    }

    const fecha = new Date(
        texto
    );

    if (
        !Number.isNaN(
            fecha.getTime()
        )
    ) {
        return fecha
            .toISOString()
            .split("T")[0];
    }

    return null;
};

const normalizarEstatus = (
    valor: any
) => {
    const texto = normalizarClave(
        valor ?? ""
    );

    switch (texto) {
        case "visitado":
            return "visitado";

        case "inspeccionado":
        case "inspeccion":
            return "inspeccionado";

        case "atendido":
            return "atendido";

        case "reconstruido":
            return "reconstruido";

        case "pendiente":
            return "pendiente";

        default:
            return valor
                ? normalizarTexto(valor)
                : null;
    }
};

const normalizarDanios = (
    valor: any
) => {
    const texto = normalizarClave(
        valor ?? ""
    );

    switch (texto) {
        case "sindanos":
        case "sindano":
            return "sin_danos";

        case "leve":
        case "danosleves":
            return "leve";

        case "moderado":
        case "danosmoderados":
            return "moderado";

        case "grave":
        case "danosgraves":
            return "grave";

        case "destrucciontotal":
        case "total":
            return "destruccion_total";

        default:
            return valor
                ? normalizarTexto(valor)
                : null;
    }
};

const detectarColumna = (
    columnas: string[],
    campo: string
) => {
    const equivalencias: Record<
        string,
        string[]
    > = {
        zona: [
            "zona",
        ],

        circuito: [
            "circuito",
        ],

        congregacion: [
            "congregacion",
            "congregación",
        ],

        nombre: [
            "nombre",
            "nombredelfamiliar",
            "familiar",
            "contacto",
        ],

        telefono: [
            "telefono",
            "teléfono",
            "telefon",
            "celular",
            "movil",
        ],

        direccion: [
            "direccion",
            "dirección",
            "ubicacion",
            "ubicación",
            "lugar",
            "direccionubicacion",
        ],

        latitud: [
            "latitud",
            "lat",
        ],

        longitud: [
            "longitud",
            "lon",
            "lng",
        ],

        precision_gps: [
            "precisiongps",
            "precision",
            "precisionubicacion",
        ],

        tipo_construccion: [
            "tipodeconstruccion",
            "tipoconstruccion",
            "construccion",
        ],

        estatus: [
            "estatus",
            "estado",
            "status",
        ],

        nivel_danios: [
            "niveldedanos",
            "niveldeanos",
            "danos",
            "daños",
            "nivel",
        ],

        notas: [
            "notas",
            "observaciones",
            "comentarios",
        ],

        s183: [
            "s183",
            "s-183",
            "s183documento",
        ],

        photoreport: [
            "photoreport",
            "photo report",
            "fotoreport",
            "fotoreporte",
        ],

        fecha1: [
            "fecha1",
            "fecha",
            "fechavisita",
        ],

        fecha2: [
            "fecha2",
            "fechainspeccion",
        ],

        fecha3: [
            "fecha3",
            "fechaatencion",
        ],

        metodo_ubicacion: [
            "metodoubicacion",
            "metododeubicacion",
        ],

        nivel_precision: [
            "nivelprecision",
            "precisionnivel",
        ],
    };

    const posibles =
        equivalencias[campo] ??
        [];

    for (
        const columna of columnas
    ) {
        const normalizada =
            normalizarClave(
                columna
            );

        for (
            const posible of posibles
        ) {
            if (
                normalizada ===
                normalizarClave(
                    posible
                )
            ) {
                return columna;
            }
        }
    }

    return "";
};

const tieneCoordenadas = (
    registro: RegistroPreparado
) => {
    return (
        registro.latitud !== null &&
        registro.longitud !== null &&
        registro.latitud >= -90 &&
        registro.latitud <= 90 &&
        registro.longitud >= -180 &&
        registro.longitud <= 180
    );
};

const obtenerEstadoUbicacion = (
    registro: RegistroPreparado
) => {
    if (
        registro.metodo_ubicacion ===
        "GPS"
    ) {
        return "gps";
    }

    if (
        registro.metodo_ubicacion ===
        "geocodificada"
    ) {
        return "geocodificada";
    }

    if (
        registro.metodo_ubicacion ===
        "aproximada"
    ) {
        return "aproximada";
    }

    if (
        tieneCoordenadas(registro)
    ) {
        return "gps";
    }

    return "sin";
};

export default function ImportadorAfectados() {
    const [archivo, setArchivo] =
        useState<File | null>(
            null
        );

    const [columnas, setColumnas] =
        useState<string[]>([]);

    const [filas, setFilas] =
        useState<FilaImportacion[]>(
            []
        );

    const [mapeo, setMapeo] =
        useState<
            Record<string, string>
        >({});

    const [
        registrosEditados,
        setRegistrosEditados,
    ] = useState<
        RegistroPreparado[]
    >([]);

    const [cargando, setCargando] =
        useState(false);

    const [importando, setImportando] =
        useState(false);

    const [
        geocodificando,
        setGeocodificando,
    ] = useState<number | null>(
        null
    );

    const [mensaje, setMensaje] =
        useState("");

    const [error, setError] =
        useState("");

    const [
        mostrarTodas,
        setMostrarTodas,
    ] = useState(false);

    const [
        filtroUbicacion,
        setFiltroUbicacion,
    ] = useState("todas");

    const [
        borrandoTodo,
        setBorrandoTodo,
    ] = useState(false);

    const [
        eliminandoId,
        setEliminandoId,
    ] = useState<string | null>(
        null
    );

    const procesarArchivo =
        async (
            file: File
        ) => {
            setCargando(true);
            setError("");
            setMensaje("");

            try {
                const buffer =
                    await file.arrayBuffer();

                const workbook =
                    XLSX.read(
                        buffer,
                        {
                            type: "array",
                            cellDates: true,
                        }
                    );

                const primeraHoja =
                    workbook
                        .SheetNames[0];

                if (!primeraHoja) {
                    throw new Error(
                        "El archivo no contiene hojas."
                    );
                }

                const hoja =
                    workbook.Sheets[
                        primeraHoja
                    ];

                const datos =
                    XLSX.utils.sheet_to_json<FilaImportacion>(
                        hoja,
                        {
                            defval: "",
                        }
                    );

                if (!datos.length) {
                    throw new Error(
                        "El archivo no contiene registros."
                    );
                }

                const nombresColumnas =
                    Object.keys(
                        datos[0]
                    );

                const nuevoMapeo: Record<
                    string,
                    string
                > = {};

                for (
                    const campo of CAMPOS
                ) {
                    nuevoMapeo[
                        campo.key
                    ] =
                        detectarColumna(
                            nombresColumnas,
                            campo.key
                        );
                }

                setArchivo(file);
                setColumnas(
                    nombresColumnas
                );
                setFilas(datos);
                setMapeo(
                    nuevoMapeo
                );

                setMensaje(
                    `Archivo cargado correctamente. ${datos.length} registros encontrados.`
                );
            } catch (e: any) {
                console.error(e);

                setError(
                    e?.message ||
                        "No se pudo procesar el archivo."
                );
            } finally {
                setCargando(false);
            }
        };

    const obtenerValor = (
        fila: FilaImportacion,
        campo: string
    ) => {
        const columna =
            mapeo[campo];

        if (!columna) {
            return null;
        }

        return fila[columna];
    };

    const prepararRegistro = (
        fila: FilaImportacion
    ): RegistroPreparado => {
        const latitud =
            convertirNumero(
                obtenerValor(
                    fila,
                    "latitud"
                )
            );

        const longitud =
            convertirNumero(
                obtenerValor(
                    fila,
                    "longitud"
                )
            );

        const direccion =
            normalizarTexto(
                obtenerValor(
                    fila,
                    "direccion"
                )
            );

        const metodoOriginal =
            normalizarTexto(
                obtenerValor(
                    fila,
                    "metodo_ubicacion"
                )
            );

        let metodo =
            metodoOriginal ||
            null;

        let precision =
            normalizarTexto(
                obtenerValor(
                    fila,
                    "nivel_precision"
                )
            ) || null;

        if (
            latitud !== null &&
            longitud !== null
        ) {
            metodo = "GPS";
            precision =
                precision ||
                "alta";
        }

        if (
            !latitud ||
            !longitud
        ) {
            if (
                !metodo
            ) {
                metodo =
                    direccion
                        ? "pendiente"
                        : "sin_ubicacion";
            }

            if (!precision) {
                precision =
                    direccion
                        ? "pendiente"
                        : "sin_precision";
            }
        }

        return {
            zona:
                normalizarTexto(
                    obtenerValor(
                        fila,
                        "zona"
                    )
                ) || null,

            circuito:
                normalizarTexto(
                    obtenerValor(
                        fila,
                        "circuito"
                    )
                ) || null,

            congregacion:
                normalizarTexto(
                    obtenerValor(
                        fila,
                        "congregacion"
                    )
                ) || null,

            nombre:
                normalizarTexto(
                    obtenerValor(
                        fila,
                        "nombre"
                    )
                ) || null,

            telefono:
                normalizarTexto(
                    obtenerValor(
                        fila,
                        "telefono"
                    )
                ) || null,

            direccion:
                direccion || null,

            latitud,

            longitud,

            precision_gps:
                convertirNumero(
                    obtenerValor(
                        fila,
                        "precision_gps"
                    )
                ),

            tipo_construccion:
                normalizarTexto(
                    obtenerValor(
                        fila,
                        "tipo_construccion"
                    )
                ) || null,

            estatus:
                normalizarEstatus(
                    obtenerValor(
                        fila,
                        "estatus"
                    )
                ),

            nivel_danios:
                normalizarDanios(
                    obtenerValor(
                        fila,
                        "nivel_danios"
                    )
                ),

            notas:
                normalizarTexto(
                    obtenerValor(
                        fila,
                        "notas"
                    )
                ) || null,

            s183:
                normalizarTexto(
                    obtenerValor(
                        fila,
                        "s183"
                    )
                ) || null,

            photoreport:
                normalizarTexto(
                    obtenerValor(
                        fila,
                        "photoreport"
                    )
                ) || null,

            fecha1:
                convertirFecha(
                    obtenerValor(
                        fila,
                        "fecha1"
                    )
                ),

            fecha2:
                convertirFecha(
                    obtenerValor(
                        fila,
                        "fecha2"
                    )
                ),

            fecha3:
                convertirFecha(
                    obtenerValor(
                        fila,
                        "fecha3"
                    )
                ),

            metodo_ubicacion:
                metodo,

            nivel_precision:
                precision,
        };
    };

    const registrosPreparados =
        useMemo(() => {
            if (
                registrosEditados.length
            ) {
                return registrosEditados;
            }

            return filas.map(
                prepararRegistro
            );
        }, [
            filas,
            mapeo,
            registrosEditados,
        ]);

    const actualizarRegistro =
        (
            index: number,
            campo: keyof RegistroPreparado,
            valor: any
        ) => {
            setRegistrosEditados(
                (actuales) => {
                    const base =
                        actuales.length
                            ? actuales
                            : filas.map(
                                  prepararRegistro
                              );

                    return base.map(
                        (
                            registro,
                            i
                        ) => {
                            if (
                                i !==
                                index
                            ) {
                                return registro;
                            }

                            return {
                                ...registro,
                                [campo]:
                                    campo ===
                                        "latitud" ||
                                    campo ===
                                        "longitud"
                                        ? convertirNumero(
                                              valor
                                          )
                                        : valor,
                            };
                        }
                    );
                }
            );
        };

    /*
     * GEOCODIFICACIÓN
     *
     * Utilizamos Nominatim/OpenStreetMap
     * para buscar la dirección.
     *
     * No hacemos geocodificación masiva
     * automática para evitar saturar
     * el servicio.
     */
    const geocodificar =
        async (
            index: number
        ) => {
            const registro =
                registrosPreparados[
                    index
                ];

            if (
                !registro.direccion
            ) {
                setError(
                    "Este registro no tiene dirección."
                );
                return;
            }

            setGeocodificando(
                index
            );
            setError("");
            setMensaje("");

            try {
                const partes = [
                    registro.direccion,
                    registro.zona,
                    registro.congregacion,
                    registro.circuito,
                    "Caracas",
                    "Miranda",
                    "Venezuela",
                ].filter(Boolean);

                const query =
                    encodeURIComponent(
                        partes.join(
                            ", "
                        )
                    );

                const respuesta =
                    await fetch(
                        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=ve&q=${query}`
                    );

                if (
                    !respuesta.ok
                ) {
                    throw new Error(
                        "No se pudo consultar el servicio de ubicación."
                    );
                }

                const resultados =
                    await respuesta.json();

                if (
                    !resultados.length
                ) {
                    setError(
                        `No se encontró una ubicación para: ${registro.direccion}`
                    );

                    actualizarRegistro(
                        index,
                        "metodo_ubicacion",
                        "sin_ubicacion"
                    );

                    actualizarRegistro(
                        index,
                        "nivel_precision",
                        "sin_precision"
                    );

                    return;
                }

                const resultado =
                    resultados[0];

                const lat =
                    Number(
                        resultado.lat
                    );

                const lon =
                    Number(
                        resultado.lon
                    );

                actualizarRegistro(
                    index,
                    "latitud",
                    lat
                );

                actualizarRegistro(
                    index,
                    "longitud",
                    lon
                );

                actualizarRegistro(
                    index,
                    "metodo_ubicacion",
                    "geocodificada"
                );

                actualizarRegistro(
                    index,
                    "nivel_precision",
                    "media"
                );

                setMensaje(
                    `Ubicación encontrada para ${registro.nombre || "el registro"}.`
                );
            } catch (e: any) {
                console.error(e);

                setError(
                    e?.message ||
                        "No se pudo obtener la ubicación."
                );
            } finally {
                setGeocodificando(
                    null
                );
            }
        };

    /*
     * IMPORTAR
     */
    const importar =
        async () => {
            if (
                !registrosPreparados.length
            ) {
                return;
            }

            setImportando(true);
            setError("");
            setMensaje("");

            try {
                const TAMANO_LOTE =
                    100;

                let total = 0;

                for (
                    let i = 0;
                    i <
                    registrosPreparados.length;
                    i +=
                        TAMANO_LOTE
                ) {
                    const lote =
                        registrosPreparados.slice(
                            i,
                            i +
                                TAMANO_LOTE
                        );

                    const {
                        error,
                    } =
                        await supabase
                            .from(
                                "afectados"
                            )
                            .insert(
                                lote
                            );

                    if (error) {
                        throw error;
                    }

                    total +=
                        lote.length;

                    setMensaje(
                        `Importando... ${total} de ${registrosPreparados.length}`
                    );
                }

                setMensaje(
                    `Importación completada: ${total} registros agregados.`
                );

                setArchivo(
                    null
                );

                setFilas([]);
                setColumnas([]);
                setMapeo({});
                setRegistrosEditados(
                    []
                );
            } catch (e: any) {
                console.error(e);

                setError(
                    e?.message ||
                        "Ocurrió un error durante la importación."
                );
            } finally {
                setImportando(
                    false
                );
            }
        };

    /*
     * ELIMINAR UN REGISTRO
     *
     * Este botón elimina un registro
     * que ya está guardado en Supabase.
     */
    const eliminarRegistro =
        async (
            id: string
        ) => {
            const confirmar =
                window.confirm(
                    "¿Seguro que deseas eliminar este registro? Esta acción no se puede deshacer."
                );

            if (
                !confirmar
            ) {
                return;
            }

            setEliminandoId(
                id
            );
            setError("");
            setMensaje("");

            try {
                const {
                    error,
                } =
                    await supabase
                        .from(
                            "afectados"
                        )
                        .delete()
                        .eq(
                            "id",
                            id
                        )
                        .select();

                if (error) {
                    throw error;
                }

                setMensaje(
                    "Registro eliminado correctamente."
                );
            } catch (e: any) {
                console.error(e);

                setError(
                    e?.message ||
                        "No se pudo eliminar el registro."
                );
            } finally {
                setEliminandoId(
                    null
                );
            }
        };

    /*
     * ELIMINAR TODOS
     *
     * Importante:
     * Supabase requiere una condición
     * para ejecutar DELETE.
     *
     * id.not.is.null permite eliminar
     * todos los registros.
     */
    const eliminarTodos =
        async () => {
            const confirmar =
                window.confirm(
                    "⚠️ ATENCIÓN\n\nVas a eliminar TODOS los registros de la tabla afectados.\n\nEsta acción NO se puede deshacer.\n\n¿Deseas continuar?"
                );

            if (
                !confirmar
            ) {
                return;
            }

            const confirmar2 =
                window.confirm(
                    "CONFIRMACIÓN FINAL\n\n¿REALMENTE deseas eliminar todos los afectados?"
                );

            if (
                !confirmar2
            ) {
                return;
            }

            setBorrandoTodo(
                true
            );

            setError("");
            setMensaje("");

            try {
                const {
                    error,
                } =
                    await supabase
                        .from(
                            "afectados"
                        )
                        .delete()
                        .not(
                            "id",
                            "is",
                            null
                        );

                if (error) {
                    throw error;
                }

                setMensaje(
                    "Todos los registros de afectados fueron eliminados."
                );
            } catch (e: any) {
                console.error(e);

                setError(
                    e?.message ||
                        "No se pudieron eliminar los registros."
                );
            } finally {
                setBorrandoTodo(
                    false
                );
            }
        };

    const estadisticas =
        useMemo(() => {
            let gps = 0;
            let geocodificadas = 0;
            let aproximadas = 0;
            let sinUbicacion = 0;

            for (
                const registro of registrosPreparados
            ) {
                const estado =
                    obtenerEstadoUbicacion(
                        registro
                    );

                if (
                    estado ===
                    "gps"
                ) {
                    gps++;
                } else if (
                    estado ===
                    "geocodificada"
                ) {
                    geocodificadas++;
                } else if (
                    estado ===
                    "aproximada"
                ) {
                    aproximadas++;
                } else {
                    sinUbicacion++;
                }
            }

            return {
                total:
                    registrosPreparados.length,
                gps,
                geocodificadas,
                aproximadas,
                sinUbicacion,
            };
        }, [
            registrosPreparados,
        ]);

    const registrosFiltrados =
        useMemo(() => {
            return registrosPreparados
                .map(
                    (
                        registro,
                        index
                    ) => ({
                        registro,
                        index,
                    })
                )
                .filter(
                    ({
                        registro,
                    }) => {
                        if (
                            filtroUbicacion ===
                            "todas"
                        ) {
                            return true;
                        }

                        return (
                            obtenerEstadoUbicacion(
                                registro
                            ) ===
                            filtroUbicacion
                        );
                    }
                );
        }, [
            registrosPreparados,
            filtroUbicacion,
        ]);

    const columnasVisibles =
        mostrarTodas
            ? CAMPOS
            : CAMPOS.slice(
                  0,
                  10
              );

    return (
        <div className="min-h-full bg-slate-50 p-6">
            <div className="mx-auto max-w-7xl">

                {/* HEADER */}

                <div className="mb-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Importar afectados
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Importa, limpia,
                                ubica y revisa
                                los registros
                                antes de
                                agregarlos al
                                mapa.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={
                                eliminarTodos
                            }
                            disabled={
                                borrandoTodo
                            }
                            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {borrandoTodo
                                ? "Eliminando..."
                                : "Eliminar TODOS los registros"}
                        </button>
                    </div>
                </div>

                {/* SUBIR ARCHIVO */}

                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Archivo Excel o CSV
                    </label>

                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => {
                            const file =
                                e
                                    .target
                                    .files?.[0];

                            if (
                                file
                            ) {
                                procesarArchivo(
                                    file
                                );
                            }
                        }}
                        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"
                    />

                    {archivo && (
                        <p className="mt-2 text-sm text-slate-500">
                            Archivo:{" "}
                            <strong>
                                {
                                    archivo.name
                                }
                            </strong>
                        </p>
                    )}

                    {cargando && (
                        <p className="mt-3 text-sm text-blue-600">
                            Procesando
                            archivo...
                        </p>
                    )}

                    {mensaje && (
                        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                            {
                                mensaje
                            }
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {
                                error
                            }
                        </div>
                    )}
                </div>

                {filas.length >
                    0 && (
                    <>
                        {/* MAPEO */}

                        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Mapeo de columnas
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Revisa cómo
                                        se están
                                        asignando
                                        las columnas
                                        del archivo.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setMostrarTodas(
                                            !mostrarTodas
                                        )
                                    }
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
                                >
                                    {mostrarTodas
                                        ? "Mostrar menos"
                                        : "Mostrar todos"}
                                </button>
                            </div>

                            <div className="mt-5 overflow-x-auto">
                                <table className="w-full min-w-[700px] text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="px-3 py-3">
                                                Campo del sistema
                                            </th>

                                            <th className="px-3 py-3">
                                                Columna del archivo
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {columnasVisibles.map(
                                            (
                                                campo
                                            ) => (
                                                <tr
                                                    key={
                                                        campo.key
                                                    }
                                                    className="border-b border-slate-100"
                                                >
                                                    <td className="px-3 py-3 font-medium">
                                                        {
                                                            campo.label
                                                        }
                                                    </td>

                                                    <td className="px-3 py-3">
                                                        <select
                                                            value={
                                                                mapeo[
                                                                    campo.key
                                                                ] ||
                                                                ""
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                setMapeo(
                                                                    (
                                                                        actual
                                                                    ) => ({
                                                                        ...actual,
                                                                        [campo.key]:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                            }
                                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                                                        >
                                                            <option value="">
                                                                No
                                                                importar
                                                            </option>

                                                            {columnas.map(
                                                                (
                                                                    columna
                                                                ) => (
                                                                    <option
                                                                        key={
                                                                            columna
                                                                        }
                                                                        value={
                                                                            columna
                                                                        }
                                                                    >
                                                                        {
                                                                            columna
                                                                        }
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ESTADÍSTICAS DE UBICACIÓN */}

                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                            <div className="rounded-xl bg-white p-5 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Total
                                </p>

                                <p className="mt-2 text-3xl font-bold text-slate-900">
                                    {
                                        estadisticas.total
                                    }
                                </p>
                            </div>

                            <div className="rounded-xl bg-white p-5 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    GPS
                                </p>

                                <p className="mt-2 text-3xl font-bold text-green-600">
                                    {
                                        estadisticas.gps
                                    }
                                </p>
                            </div>

                            <div className="rounded-xl bg-white p-5 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Geocodificadas
                                </p>

                                <p className="mt-2 text-3xl font-bold text-blue-600">
                                    {
                                        estadisticas.geocodificadas
                                    }
                                </p>
                            </div>

                            <div className="rounded-xl bg-white p-5 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Sin ubicación
                                </p>

                                <p className="mt-2 text-3xl font-bold text-red-600">
                                    {
                                        estadisticas.sinUbicacion
                                    }
                                </p>
                            </div>
                        </div>

                        {/* FILTROS */}

                        <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                                <div>
                                    <h2 className="font-bold text-slate-900">
                                        Revisión de ubicaciones
                                    </h2>

                                    <p className="text-sm text-slate-500">
                                        Puedes
                                        corregir
                                        manualmente
                                        las
                                        coordenadas.
                                    </p>
                                </div>

                                <select
                                    value={
                                        filtroUbicacion
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setFiltroUbicacion(
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                >
                                    <option value="todas">
                                        Todas las ubicaciones
                                    </option>

                                    <option value="gps">
                                        GPS
                                    </option>

                                    <option value="geocodificada">
                                        Geocodificadas
                                    </option>

                                    <option value="aproximada">
                                        Aproximadas
                                    </option>

                                    <option value="sin">
                                        Sin ubicación
                                    </option>
                                </select>
                            </div>
                        </div>

                        {/* TABLA PRINCIPAL */}

                        <div className="mt-4 rounded-xl bg-white shadow-sm">

                            <div className="overflow-x-auto">

                                <table className="w-full min-w-[1500px] text-left text-sm">

                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50">

                                            <th className="px-4 py-3">
                                                #
                                            </th>

                                            <th className="px-4 py-3">
                                                Nombre
                                            </th>

                                            <th className="px-4 py-3">
                                                Dirección
                                            </th>

                                            <th className="px-4 py-3">
                                                Latitud
                                            </th>

                                            <th className="px-4 py-3">
                                                Longitud
                                            </th>

                                            <th className="px-4 py-3">
                                                Ubicación
                                            </th>

                                            <th className="px-4 py-3">
                                                Método
                                            </th>

                                            <th className="px-4 py-3">
                                                Acción
                                            </th>

                                        </tr>
                                    </thead>

                                    <tbody>

                                        {registrosFiltrados.map(
                                            ({
                                                registro,
                                                index,
                                            }) => {

                                                const estado =
                                                    obtenerEstadoUbicacion(
                                                        registro
                                                    );

                                                return (
                                                    <tr
                                                        key={
                                                            index
                                                        }
                                                        className="border-b border-slate-100 align-top"
                                                    >

                                                        <td className="px-4 py-4 text-slate-400">
                                                            {
                                                                index +
                                                                1
                                                            }
                                                        </td>

                                                        <td className="px-4 py-4 font-medium text-slate-900">
                                                            {
                                                                registro.nombre ||
                                                                "—"
                                                            }
                                                        </td>

                                                        <td className="w-[350px] px-4 py-4">

                                                            <input
                                                                value={
                                                                    registro.direccion ||
                                                                    ""
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) =>
                                                                    actualizarRegistro(
                                                                        index,
                                                                        "direccion",
                                                                        e
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                            />

                                                            <div className="mt-2 flex gap-2">

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        geocodificar(
                                                                            index
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        geocodificando ===
                                                                        index
                                                                    }
                                                                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                                                >
                                                                    {geocodificando ===
                                                                    index
                                                                        ? "Buscando..."
                                                                        : "📍 Ubicar"}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setError(
                                                                            "La edición directamente sobre el mapa la conectaremos con MapaAfectados. Por ahora puedes editar las coordenadas manualmente."
                                                                        );
                                                                    }}
                                                                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                                >
                                                                    🗺️ Mapa
                                                                </button>

                                                            </div>

                                                        </td>

                                                        <td className="px-4 py-4">

                                                            <input
                                                                type="number"
                                                                step="any"
                                                                value={
                                                                    registro.latitud ??
                                                                    ""
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) =>
                                                                    actualizarRegistro(
                                                                        index,
                                                                        "latitud",
                                                                        e
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-36 rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                                                            />

                                                        </td>

                                                        <td className="px-4 py-4">

                                                            <input
                                                                type="number"
                                                                step="any"
                                                                value={
                                                                    registro.longitud ??
                                                                    ""
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) =>
                                                                    actualizarRegistro(
                                                                        index,
                                                                        "longitud",
                                                                        e
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-36 rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                                                            />

                                                        </td>

                                                        <td className="px-4 py-4">

                                                            {estado ===
                                                                "gps" && (
                                                                <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                                                    🟢 GPS
                                                                </span>
                                                            )}

                                                            {estado ===
                                                                "geocodificada" && (
                                                                <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                                                    🔵 Geocodificada
                                                                </span>
                                                            )}

                                                            {estado ===
                                                                "aproximada" && (
                                                                <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                                                                    🟡 Aproximada
                                                                </span>
                                                            )}

                                                            {estado ===
                                                                "sin" && (
                                                                <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                                                    🔴 Sin ubicación
                                                                </span>
                                                            )}

                                                        </td>

                                                        <td className="px-4 py-4">

                                                            <select
                                                                value={
                                                                    registro.metodo_ubicacion ||
                                                                    ""
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) =>
                                                                    actualizarRegistro(
                                                                        index,
                                                                        "metodo_ubicacion",
                                                                        e
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                                                            >

                                                                <option value="">
                                                                    Seleccionar
                                                                </option>

                                                                <option value="GPS">
                                                                    GPS
                                                                </option>

                                                                <option value="geocodificada">
                                                                    Geocodificada
                                                                </option>

                                                                <option value="aproximada">
                                                                    Aproximada
                                                                </option>

                                                                <option value="sin_ubicacion">
                                                                    Sin ubicación
                                                                </option>

                                                            </select>

                                                        </td>

                                                        <td className="px-4 py-4">

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const nueva =
                                                                        [
                                                                            ...registrosPreparados,
                                                                        ];

                                                                    nueva.splice(
                                                                        index,
                                                                        1
                                                                    );

                                                                    setRegistrosEditados(
                                                                        nueva
                                                                    );
                                                                }}
                                                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                                            >
                                                                Quitar
                                                            </button>

                                                        </td>

                                                    </tr>
                                                );
                                            }
                                        )}

                                    </tbody>

                                </table>

                            </div>

                            {registrosFiltrados.length ===
                                0 && (
                                <div className="p-10 text-center text-sm text-slate-500">
                                    No hay registros
                                    que coincidan
                                    con este filtro.
                                </div>
                            )}

                        </div>

                        {/* IMPORTAR */}

                        <div className="mt-6 flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">

                            <div>
                                <p className="font-semibold text-slate-900">
                                    ¿Todo correcto?
                                </p>

                                <p className="text-sm text-slate-500">
                                    Se importarán{" "}
                                    <strong>
                                        {
                                            registrosPreparados.length
                                        }
                                    </strong>{" "}
                                    registros a
                                    la tabla{" "}
                                    <code>
                                        afectados
                                    </code>
                                    .
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled={
                                    importando ||
                                    !registrosPreparados.length
                                }
                                onClick={
                                    importar
                                }
                                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {importando
                                    ? "Importando..."
                                    : "Importar registros"}
                            </button>

                        </div>

                    </>
                )}
            </div>
        </div>
    );
}