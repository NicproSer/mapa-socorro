"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Search,
    Plus,
    Pencil,
    Trash2,
    X,
    Save,
    RefreshCw,
    ExternalLink,
    AlertTriangle,
    MapPin,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

interface Afectado {
    id: string;
    created_at?: string | null;

    zona?: string | null;
    circuito?: string | null;
    congregacion?: string | null;
    nombre?: string | null;
    telefono?: string | null;
    direccion?: string | null;

    latitud?: number | null;
    longitud?: number | null;
    precision_gps?: number | null;

    tipo_construccion?: string | null;
    estatus?: string | null;
    nivel_danios?: string | null;

    notas?: string | null;

    s183?: string | null;
    photoreport?: string | null;

    fecha1?: string | null;
    fecha2?: string | null;
    fecha3?: string | null;

    metodo_ubicacion?: string | null;
    nivel_precision?: string | null;
}

type FormularioAfectado = Omit<
    Afectado,
    "id" | "created_at"
>;

const FORMULARIO_VACIO: FormularioAfectado = {
    zona: "",
    circuito: "",
    congregacion: "",
    nombre: "",
    telefono: "",
    direccion: "",

    latitud: null,
    longitud: null,
    precision_gps: null,

    tipo_construccion: "",
    estatus: "pendiente",
    nivel_danios: "",

    notas: "",

    s183: "",
    photoreport: "",

    fecha1: null,
    fecha2: null,
    fecha3: null,

    metodo_ubicacion: "",
    nivel_precision: "",
};

const CAMPOS_TEXTO: Array<{
    key: keyof FormularioAfectado;
    label: string;
}> = [
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
        key: "tipo_construccion",
        label: "Tipo de construcción",
    },
    {
        key: "notas",
        label: "Notas",
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

const normalizarNumero = (
    valor: any
): number | null => {
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

const prepararParaGuardar = (
    formulario: FormularioAfectado
) => {
    return {
        zona:
            normalizarTexto(
                formulario.zona
            ) || null,

        circuito:
            normalizarTexto(
                formulario.circuito
            ) || null,

        congregacion:
            normalizarTexto(
                formulario.congregacion
            ) || null,

        nombre:
            normalizarTexto(
                formulario.nombre
            ) || null,

        telefono:
            normalizarTexto(
                formulario.telefono
            ) || null,

        direccion:
            normalizarTexto(
                formulario.direccion
            ) || null,

        latitud:
            normalizarNumero(
                formulario.latitud
            ),

        longitud:
            normalizarNumero(
                formulario.longitud
            ),

        precision_gps:
            normalizarNumero(
                formulario.precision_gps
            ),

        tipo_construccion:
            normalizarTexto(
                formulario.tipo_construccion
            ) || null,

        estatus:
            normalizarTexto(
                formulario.estatus
            ) || null,

        nivel_danios:
            normalizarTexto(
                formulario.nivel_danios
            ) || null,

        notas:
            normalizarTexto(
                formulario.notas
            ) || null,

        s183:
            normalizarTexto(
                formulario.s183
            ) || null,

        photoreport:
            normalizarTexto(
                formulario.photoreport
            ) || null,

        fecha1:
            formulario.fecha1 || null,

        fecha2:
            formulario.fecha2 || null,

        fecha3:
            formulario.fecha3 || null,

        metodo_ubicacion:
            normalizarTexto(
                formulario.metodo_ubicacion
            ) || null,

        nivel_precision:
            normalizarTexto(
                formulario.nivel_precision
            ) || null,
    };
};

const formatearFecha = (
    fecha?: string | null
) => {
    if (!fecha) {
        return "—";
    }

    try {
        const partes = fecha.split("-");

        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }

        return fecha;
    } catch {
        return fecha;
    }
};

const claseEstatus = (
    estatus?: string | null
) => {
    switch (estatus) {
        case "visitado":
            return "bg-blue-100 text-blue-700";

        case "inspeccionado":
            return "bg-purple-100 text-purple-700";

        case "atendido":
            return "bg-green-100 text-green-700";

        case "reconstruido":
            return "bg-emerald-100 text-emerald-700";

        case "pendiente":
            return "bg-yellow-100 text-yellow-700";

        default:
            return "bg-slate-100 text-slate-700";
    }
};

const claseDanios = (
    danos?: string | null
) => {
    switch (danos) {
        case "sin_danos":
            return "bg-green-100 text-green-700";

        case "leve":
            return "bg-yellow-100 text-yellow-700";

        case "moderado":
            return "bg-orange-100 text-orange-700";

        case "grave":
            return "bg-red-100 text-red-700";

        case "destruccion_total":
            return "bg-red-200 text-red-800";

        default:
            return "bg-slate-100 text-slate-700";
    }
};

export default function CrudAfectados() {
    const [afectados, setAfectados] =
        useState<Afectado[]>([]);

    const [cargando, setCargando] =
        useState(true);

    const [guardando, setGuardando] =
        useState(false);

    const [busqueda, setBusqueda] =
        useState("");

    const [filtroEstatus, setFiltroEstatus] =
        useState("");

    const [filtroDanios, setFiltroDanios] =
        useState("");

    const [filtroZona, setFiltroZona] =
        useState("");

    const [modalAbierto, setModalAbierto] =
        useState(false);

    const [modo, setModo] =
        useState<"crear" | "editar">(
            "crear"
        );

    const [seleccionado, setSeleccionado] =
        useState<Afectado | null>(null);

    const [formulario, setFormulario] =
        useState<FormularioAfectado>(
            FORMULARIO_VACIO
        );

    const [mensaje, setMensaje] =
        useState("");

    const [error, setError] =
        useState("");

    const [eliminandoTodo, setEliminandoTodo] =
        useState(false);

    const cargarAfectados = async () => {
        setCargando(true);
        setError("");

        const {
            data,
            error,
        } = await supabase
            .from("afectados")
            .select("*")
            .order("created_at", {
                ascending: false,
            });

        if (error) {
            console.error(
                "Error cargando afectados:",
                error
            );

            setError(
                "No se pudieron cargar los afectados."
            );
        } else {
            setAfectados(
                (data ?? []) as Afectado[]
            );
        }

        setCargando(false);
    };

    useEffect(() => {
        cargarAfectados();
    }, []);

    /*
     * REALTIME
     */
    useEffect(() => {
        const canal =
            supabase
                .channel(
                    "crud-afectados-realtime"
                )
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "afectados",
                    },
                    (payload) => {
                        if (
                            payload.eventType ===
                            "INSERT"
                        ) {
                            setAfectados(
                                (actuales) => [
                                    payload.new as Afectado,
                                    ...actuales,
                                ]
                            );
                        }

                        if (
                            payload.eventType ===
                            "UPDATE"
                        ) {
                            setAfectados(
                                (actuales) =>
                                    actuales.map(
                                        (afectado) =>
                                            afectado.id ===
                                            payload.new.id
                                                ? (payload.new as Afectado)
                                                : afectado
                                    )
                            );
                        }

                        if (
                            payload.eventType ===
                            "DELETE"
                        ) {
                            setAfectados(
                                (actuales) =>
                                    actuales.filter(
                                        (afectado) =>
                                            afectado.id !==
                                            payload.old.id
                                    )
                            );
                        }
                    }
                )
                .subscribe();

        return () => {
            supabase.removeChannel(
                canal
            );
        };
    }, []);

    const zonas = useMemo(() => {
        return Array.from(
            new Set(
                afectados
                    .map(
                        (afectado) =>
                            afectado.zona
                    )
                    .filter(Boolean)
            )
        ).sort();
    }, [afectados]);

    const afectadosFiltrados =
        useMemo(() => {
            const texto =
                busqueda
                    .toLowerCase()
                    .trim();

            return afectados.filter(
                (afectado) => {
                    const coincideTexto =
                        !texto ||
                        [
                            afectado.nombre,
                            afectado.telefono,
                            afectado.direccion,
                            afectado.zona,
                            afectado.circuito,
                            afectado.congregacion,
                            afectado.estatus,
                            afectado.nivel_danios,
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase()
                            .includes(texto);

                    const coincideEstatus =
                        !filtroEstatus ||
                        afectado.estatus ===
                            filtroEstatus;

                    const coincideDanios =
                        !filtroDanios ||
                        afectado.nivel_danios ===
                            filtroDanios;

                    const coincideZona =
                        !filtroZona ||
                        afectado.zona ===
                            filtroZona;

                    return (
                        coincideTexto &&
                        coincideEstatus &&
                        coincideDanios &&
                        coincideZona
                    );
                }
            );
        }, [
            afectados,
            busqueda,
            filtroEstatus,
            filtroDanios,
            filtroZona,
        ]);

    const abrirCrear = () => {
        setModo("crear");
        setSeleccionado(null);
        setFormulario({
            ...FORMULARIO_VACIO,
        });
        setError("");
        setMensaje("");
        setModalAbierto(true);
    };

    const abrirEditar = (
        afectado: Afectado
    ) => {
        setModo("editar");
        setSeleccionado(afectado);

        setFormulario({
            zona:
                afectado.zona ?? "",

            circuito:
                afectado.circuito ?? "",

            congregacion:
                afectado.congregacion ?? "",

            nombre:
                afectado.nombre ?? "",

            telefono:
                afectado.telefono ?? "",

            direccion:
                afectado.direccion ?? "",

            latitud:
                afectado.latitud ?? null,

            longitud:
                afectado.longitud ?? null,

            precision_gps:
                afectado.precision_gps ??
                null,

            tipo_construccion:
                afectado.tipo_construccion ??
                "",

            estatus:
                afectado.estatus ??
                "pendiente",

            nivel_danios:
                afectado.nivel_danios ??
                "",

            notas:
                afectado.notas ?? "",

            s183:
                afectado.s183 ?? "",

            photoreport:
                afectado.photoreport ??
                "",

            fecha1:
                afectado.fecha1 ??
                null,

            fecha2:
                afectado.fecha2 ??
                null,

            fecha3:
                afectado.fecha3 ??
                null,

            metodo_ubicacion:
                afectado.metodo_ubicacion ??
                "",

            nivel_precision:
                afectado.nivel_precision ??
                "",
        });

        setError("");
        setMensaje("");
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        if (guardando) {
            return;
        }

        setModalAbierto(false);
        setSeleccionado(null);
    };

    const cambiarCampo = (
        campo: keyof FormularioAfectado,
        valor: any
    ) => {
        setFormulario(
            (actual) => ({
                ...actual,
                [campo]: valor,
            })
        );
    };

    const guardar = async () => {
        setGuardando(true);
        setError("");
        setMensaje("");

        try {
            const datos =
                prepararParaGuardar(
                    formulario
                );

            if (modo === "crear") {
                const {
                    data,
                    error,
                } = await supabase
                    .from("afectados")
                    .insert(datos)
                    .select()
                    .single();

                if (error) {
                    throw error;
                }

                if (data) {
                    setAfectados(
                        (actuales) => [
                            data as Afectado,
                            ...actuales.filter(
                                (item) =>
                                    item.id !==
                                    data.id
                            ),
                        ]
                    );
                }

                setMensaje(
                    "Afectado creado correctamente."
                );
            } else {
                if (
                    !seleccionado?.id
                ) {
                    throw new Error(
                        "No se encontró el ID del afectado."
                    );
                }

                /*
                 * IMPORTANTE:
                 * No usamos .single() aquí.
                 *
                 * Esto evita el PGRST116 que
                 * apareció anteriormente.
                 */
                const {
                    data,
                    error,
                } = await supabase
                    .from("afectados")
                    .update(datos)
                    .eq(
                        "id",
                        seleccionado.id
                    )
                    .select()
                    .maybeSingle();

                if (error) {
                    throw error;
                }

                if (!data) {
                    throw new Error(
                        "No se encontró el registro que se intentó actualizar."
                    );
                }

                setAfectados(
                    (actuales) =>
                        actuales.map(
                            (item) =>
                                item.id ===
                                seleccionado.id
                                    ? (data as Afectado)
                                    : item
                        )
                );

                setMensaje(
                    "Afectado actualizado correctamente."
                );
            }

            setTimeout(() => {
                setModalAbierto(false);
                setSeleccionado(null);
            }, 500);
        } catch (e: any) {
            console.error(
                "Error guardando afectado:",
                e
            );

            setError(
                e?.message ||
                    "No se pudo guardar el registro."
            );
        } finally {
            setGuardando(false);
        }
    };

    const eliminar = async (
        afectado: Afectado
    ) => {
        const confirmar =
            window.confirm(
                `¿Seguro que quieres eliminar a "${
                    afectado.nombre ||
                    "este registro"
                }"?`
            );

        if (!confirmar) {
            return;
        }

        setError("");

        const {
            error,
        } = await supabase
            .from("afectados")
            .delete()
            .eq("id", afectado.id);

        if (error) {
            console.error(
                "Error eliminando afectado:",
                error
            );

            setError(
                "No se pudo eliminar el registro."
            );

            return;
        }

        setAfectados(
            (actuales) =>
                actuales.filter(
                    (item) =>
                        item.id !==
                        afectado.id
                )
        );

        setMensaje(
            "Registro eliminado correctamente."
        );
    };

    const eliminarTodos = async () => {
        if (!afectados.length) {
            return;
        }

        const confirmar =
            window.confirm(
                `⚠️ ATENCIÓN\n\nVas a eliminar TODOS los registros de afectados.\n\nTotal: ${afectados.length}\n\nEsta acción no se puede deshacer.\n\n¿Continuar?`
            );

        if (!confirmar) {
            return;
        }

        const confirmar2 =
            window.confirm(
                "CONFIRMACIÓN FINAL\n\n¿Realmente quieres borrar TODOS los afectados?"
            );

        if (!confirmar2) {
            return;
        }

        setEliminandoTodo(true);
        setError("");

        try {
            /*
             * Usamos un filtro que abarque
             * todos los UUID.
             */
            const {
                error,
            } = await supabase
                .from("afectados")
                .delete()
                .not(
                    "id",
                    "is",
                    null
                );

            if (error) {
                throw error;
            }

            setAfectados([]);

            setMensaje(
                "Todos los registros fueron eliminados."
            );
        } catch (e: any) {
            console.error(
                "Error eliminando todos:",
                e
            );

            setError(
                e?.message ||
                    "No se pudieron eliminar todos los registros."
            );
        } finally {
            setEliminandoTodo(false);
        }
    };

    const limpiarFiltros = () => {
        setBusqueda("");
        setFiltroEstatus("");
        setFiltroDanios("");
        setFiltroZona("");
    };

    return (
        <div className="min-h-full bg-slate-50 p-6">
            <div className="mx-auto max-w-[1600px]">
                {/* HEADER */}
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Gestión de afectados
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Administra todos los
                            registros que aparecen
                            en el mapa.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={
                                cargarAfectados
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            <RefreshCw
                                size={17}
                            />

                            Actualizar
                        </button>

                        <button
                            type="button"
                            onClick={
                                abrirCrear
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            <Plus
                                size={18}
                            />

                            Nuevo afectado
                        </button>

                        <button
                            type="button"
                            onClick={
                                eliminarTodos
                            }
                            disabled={
                                eliminandoTodo ||
                                !afectados.length
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Trash2
                                size={17}
                            />

                            {eliminandoTodo
                                ? "Eliminando..."
                                : "Eliminar todos"}
                        </button>
                    </div>
                </div>

                {/* MENSAJES */}

                {mensaje && (
                    <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                        {mensaje}
                    </div>
                )}

                {error && (
                    <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <AlertTriangle
                            size={18}
                            className="mt-0.5 shrink-0"
                        />

                        <span>{error}</span>
                    </div>
                )}

                {/* FILTROS */}

                <div className="mb-5 rounded-xl bg-white p-5 shadow-sm">
                    <div className="grid gap-3 lg:grid-cols-5">
                        <div className="relative lg:col-span-2">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={
                                    busqueda
                                }
                                onChange={(
                                    e
                                ) =>
                                    setBusqueda(
                                        e
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Buscar nombre, dirección, teléfono..."
                                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <select
                            value={
                                filtroZona
                            }
                            onChange={(e) =>
                                setFiltroZona(
                                    e.target.value
                                )
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
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
                                            zona!
                                        }
                                    >
                                        {zona}
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
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
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
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                        >
                            <option value="">
                                Todos los daños
                            </option>

                            <option value="sin_danos">
                                Sin daños
                            </option>

                            <option value="leve">
                                Leve
                            </option>

                            <option value="moderado">
                                Moderado
                            </option>

                            <option value="grave">
                                Grave
                            </option>

                            <option value="destruccion_total">
                                Destrucción total
                            </option>
                        </select>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Mostrando{" "}
                            <strong className="text-slate-800">
                                {
                                    afectadosFiltrados.length
                                }
                            </strong>{" "}
                            de{" "}
                            <strong className="text-slate-800">
                                {
                                    afectados.length
                                }
                            </strong>{" "}
                            registros
                        </p>

                        {(busqueda ||
                            filtroZona ||
                            filtroEstatus ||
                            filtroDanios) && (
                            <button
                                type="button"
                                onClick={
                                    limpiarFiltros
                                }
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>

                {/* TABLA */}

                <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                    {cargando ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="text-center">
                                <RefreshCw
                                    size={28}
                                    className="mx-auto animate-spin text-blue-600"
                                />

                                <p className="mt-3 text-sm text-slate-500">
                                    Cargando afectados...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1900px] text-left text-sm">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">
                                            Nombre
                                        </th>

                                        <th className="px-4 py-3 font-semibold">
                                            Zona
                                        </th>

                                        <th className="px-4 py-3 font-semibold">
                                            Circuito
                                        </th>

                                        <th className="px-4 py-3 font-semibold">
                                            Congregación
                                        </th>

                                        <th className="px-4 py-3 font-semibold">
                                            Teléfono
                                        </th>

                                        <th className="px-4 py-3 font-semibold">
                                            Dirección
                                        </th>

                                        <th className="px-4 py-3 font-semibold">
                                            Ubicación
                                        </th>

                                        <th className="px-4 py-3 font-semibold">
                                            Estatus
                                        </th>

                                        <th className="px-4 py-3 font-semibold">
                                            Daños
                                        </th>

                                        <th className="px-4 py-3 font-semibold">
                                            Fechas
                                        </th>

                                        <th className="px-4 py-3 font-semibold">
                                            Documentos
                                        </th>

                                        <th className="px-4 py-3 text-right font-semibold">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {afectadosFiltrados.map(
                                        (
                                            afectado
                                        ) => (
                                            <tr
                                                key={
                                                    afectado.id
                                                }
                                                className="border-t border-slate-100 hover:bg-slate-50"
                                            >
                                                {/* NOMBRE */}

                                                <td className="px-4 py-4">
                                                    <div className="font-semibold text-slate-900">
                                                        {afectado.nombre ||
                                                            "Sin nombre"}
                                                    </div>

                                                    {afectado.tipo_construccion && (
                                                        <div className="mt-1 text-xs text-slate-500">
                                                            {
                                                                afectado.tipo_construccion
                                                            }
                                                        </div>
                                                    )}
                                                </td>

                                                {/* ZONA */}

                                                <td className="px-4 py-4">
                                                    {
                                                        afectado.zona ||
                                                        "—"
                                                    }
                                                </td>

                                                {/* CIRCUITO */}

                                                <td className="px-4 py-4">
                                                    {
                                                        afectado.circuito ||
                                                        "—"
                                                    }
                                                </td>

                                                {/* CONGREGACION */}

                                                <td className="px-4 py-4">
                                                    {
                                                        afectado.congregacion ||
                                                        "—"
                                                    }
                                                </td>

                                                {/* TELEFONO */}

                                                <td className="px-4 py-4">
                                                    {
                                                        afectado.telefono ||
                                                        "—"
                                                    }
                                                </td>

                                                {/* DIRECCION */}

                                                <td className="max-w-[300px] px-4 py-4">
                                                    <div className="truncate">
                                                        {
                                                            afectado.direccion ||
                                                            "—"
                                                        }
                                                    </div>
                                                </td>

                                                {/* UBICACION */}

                                                <td className="px-4 py-4">
                                                    {afectado.latitud !==
                                                        null &&
                                                    afectado.latitud !==
                                                        undefined &&
                                                    afectado.longitud !==
                                                        null &&
                                                    afectado.longitud !==
                                                        undefined ? (
                                                        <div className="flex items-start gap-2">
                                                            <MapPin
                                                                size={
                                                                    16
                                                                }
                                                                className="mt-0.5 text-blue-600"
                                                            />

                                                            <div>
                                                                <div className="font-mono text-xs">
                                                                    {
                                                                        afectado.latitud
                                                                    }
                                                                    ,{" "}
                                                                    {
                                                                        afectado.longitud
                                                                    }
                                                                </div>

                                                                {afectado.metodo_ubicacion && (
                                                                    <div className="mt-1 text-xs text-slate-500">
                                                                        {
                                                                            afectado.metodo_ubicacion
                                                                        }
                                                                    </div>
                                                                )}

                                                                {afectado.nivel_precision && (
                                                                    <div className="text-xs text-slate-500">
                                                                        {
                                                                            afectado.nivel_precision
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-orange-600">
                                                            Sin
                                                            ubicación
                                                        </span>
                                                    )}
                                                </td>

                                                {/* ESTATUS */}

                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${claseEstatus(
                                                            afectado.estatus
                                                        )}`}
                                                    >
                                                        {afectado.estatus ||
                                                            "—"}
                                                    </span>
                                                </td>

                                                {/* DAÑOS */}

                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${claseDanios(
                                                            afectado.nivel_danios
                                                        )}`}
                                                    >
                                                        {afectado.nivel_danios ||
                                                            "—"}
                                                    </span>
                                                </td>

                                                {/* FECHAS */}

                                                <td className="px-4 py-4">
                                                    <div className="space-y-1 text-xs">
                                                        <div>
                                                            <span className="font-semibold">
                                                                F1:
                                                            </span>{" "}
                                                            {formatearFecha(
                                                                afectado.fecha1
                                                            )}
                                                        </div>

                                                        <div>
                                                            <span className="font-semibold">
                                                                F2:
                                                            </span>{" "}
                                                            {formatearFecha(
                                                                afectado.fecha2
                                                            )}
                                                        </div>

                                                        <div>
                                                            <span className="font-semibold">
                                                                F3:
                                                            </span>{" "}
                                                            {formatearFecha(
                                                                afectado.fecha3
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* DOCUMENTOS */}

                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col gap-2">
                                                        {afectado.photoreport && (
                                                            <a
                                                                href={
                                                                    afectado.photoreport
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                                                            >
                                                                Photo
                                                                Report
                                                                <ExternalLink
                                                                    size={
                                                                        13
                                                                    }
                                                                />
                                                            </a>
                                                        )}

                                                        {afectado.s183 && (
                                                            <a
                                                                href={
                                                                    afectado.s183
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800"
                                                            >
                                                                S-183
                                                                <ExternalLink
                                                                    size={
                                                                        13
                                                                    }
                                                                />
                                                            </a>
                                                        )}

                                                        {!afectado.photoreport &&
                                                            !afectado.s183 && (
                                                                <span className="text-xs text-slate-400">
                                                                    Sin
                                                                    documentos
                                                                </span>
                                                            )}
                                                    </div>
                                                </td>

                                                {/* ACCIONES */}

                                                <td className="px-4 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                abrirEditar(
                                                                    afectado
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                                        >
                                                            <Pencil
                                                                size={
                                                                    14
                                                                }
                                                            />

                                                            Editar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                eliminar(
                                                                    afectado
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                                                        >
                                                            <Trash2
                                                                size={
                                                                    14
                                                                }
                                                            />

                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>

                            {!afectadosFiltrados.length && (
                                <div className="p-12 text-center">
                                    <p className="font-semibold text-slate-700">
                                        No hay registros.
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Prueba cambiando
                                        los filtros o
                                        crea un nuevo
                                        afectado.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL */}

            {modalAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[95vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                        {/* HEADER MODAL */}

                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {modo ===
                                    "crear"
                                        ? "Nuevo afectado"
                                        : "Editar afectado"}
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Completa o modifica
                                    la información
                                    del registro.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    cerrarModal
                                }
                                disabled={
                                    guardando
                                }
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            >
                                <X
                                    size={22}
                                />
                            </button>
                        </div>

                        {/* CONTENIDO */}

                        <div className="max-h-[calc(95vh-140px)] overflow-y-auto p-6">
                            {error && (
                                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="grid gap-5 md:grid-cols-2">
                                {CAMPOS_TEXTO.map(
                                    ({
                                        key,
                                        label,
                                    }) => (
                                        <div
                                            key={
                                                key
                                            }
                                            className={
                                                key ===
                                                "direccion"
                                                    ? "md:col-span-2"
                                                    : ""
                                            }
                                        >
                                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                                {
                                                    label
                                                }
                                            </label>

                                            {key ===
                                            "notas" ? (
                                                <textarea
                                                    value={
                                                        (formulario[
                                                            key
                                                        ] as string) ??
                                                        ""
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        cambiarCampo(
                                                            key,
                                                            e
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    rows={
                                                        4
                                                    }
                                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={
                                                        (formulario[
                                                            key
                                                        ] as string) ??
                                                        ""
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        cambiarCampo(
                                                            key,
                                                            e
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                            )}
                                        </div>
                                    )
                                )}

                                {/* LATITUD */}

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Latitud
                                    </label>

                                    <input
                                        type="number"
                                        step="any"
                                        value={
                                            formulario.latitud ??
                                            ""
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            cambiarCampo(
                                                "latitud",
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm"
                                    />
                                </div>

                                {/* LONGITUD */}

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Longitud
                                    </label>

                                    <input
                                        type="number"
                                        step="any"
                                        value={
                                            formulario.longitud ??
                                            ""
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            cambiarCampo(
                                                "longitud",
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm"
                                    />
                                </div>

                                {/* PRECISION GPS */}

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Precisión GPS
                                    </label>

                                    <input
                                        type="number"
                                        step="any"
                                        value={
                                            formulario.precision_gps ??
                                            ""
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            cambiarCampo(
                                                "precision_gps",
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                                    />
                                </div>

                                {/* ESTATUS */}

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Estatus
                                    </label>

                                    <select
                                        value={
                                            formulario.estatus ??
                                            ""
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            cambiarCampo(
                                                "estatus",
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                                    >
                                        <option value="">
                                            Seleccionar
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
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Nivel de daños
                                    </label>

                                    <select
                                        value={
                                            formulario.nivel_danios ??
                                            ""
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            cambiarCampo(
                                                "nivel_danios",
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                                    >
                                        <option value="">
                                            Seleccionar
                                        </option>

                                        <option value="sin_danos">
                                            Sin daños
                                        </option>

                                        <option value="leve">
                                            Leve
                                        </option>

                                        <option value="moderado">
                                            Moderado
                                        </option>

                                        <option value="grave">
                                            Grave
                                        </option>

                                        <option value="destruccion_total">
                                            Destrucción
                                            total
                                        </option>
                                    </select>
                                </div>

                                {/* FECHA 1 */}

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Fecha 1
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            formulario.fecha1 ??
                                            ""
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            cambiarCampo(
                                                "fecha1",
                                                e
                                                    .target
                                                    .value ||
                                                    null
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                                    />
                                </div>

                                {/* FECHA 2 */}

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Fecha 2
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            formulario.fecha2 ??
                                            ""
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            cambiarCampo(
                                                "fecha2",
                                                e
                                                    .target
                                                    .value ||
                                                    null
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                                    />
                                </div>

                                {/* FECHA 3 */}

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Fecha 3
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            formulario.fecha3 ??
                                            ""
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            cambiarCampo(
                                                "fecha3",
                                                e
                                                    .target
                                                    .value ||
                                                    null
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                                    />
                                </div>

                                {/* METODO UBICACION */}

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Método de ubicación
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            formulario.metodo_ubicacion ??
                                            ""
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            cambiarCampo(
                                                "metodo_ubicacion",
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="GPS, aproximada, mapa, dirección..."
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                                    />
                                </div>

                                {/* NIVEL PRECISION */}

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Nivel de precisión
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            formulario.nivel_precision ??
                                            ""
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            cambiarCampo(
                                                "nivel_precision",
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Alta, media, baja..."
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                                    />
                                </div>

                                {/* S183 */}

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Enlace S-183
                                    </label>

                                    <input
                                        type="url"
                                        value={
                                            formulario.s183 ??
                                            ""
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            cambiarCampo(
                                                "s183",
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="https://..."
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                                    />

                                    {formulario.s183 && (
                                        <a
                                            href={
                                                formulario.s183
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600"
                                        >
                                            Abrir
                                            S-183
                                            <ExternalLink
                                                size={
                                                    12
                                                }
                                            />
                                        </a>
                                    )}
                                </div>

                                {/* PHOTO REPORT */}

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Enlace Photo Report
                                    </label>

                                    <input
                                        type="url"
                                        value={
                                            formulario.photoreport ??
                                            ""
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            cambiarCampo(
                                                "photoreport",
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="https://..."
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                                    />

                                    {formulario.photoreport && (
                                        <a
                                            href={
                                                formulario.photoreport
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600"
                                        >
                                            Abrir
                                            Photo
                                            Report
                                            <ExternalLink
                                                size={
                                                    12
                                                }
                                            />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}

                        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                            <button
                                type="button"
                                onClick={
                                    cerrarModal
                                }
                                disabled={
                                    guardando
                                }
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={
                                    guardar
                                }
                                disabled={
                                    guardando
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Save
                                    size={17}
                                />

                                {guardando
                                    ? "Guardando..."
                                    : modo ===
                                      "crear"
                                    ? "Crear afectado"
                                    : "Guardar cambios"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}