"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
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
  MapPinned,
  Map,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ============================================================
 * TIPOS
 * ============================================================ */
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

type FormularioAfectado = Omit<Afectado, "id" | "created_at">;

type ModoModal = "crear" | "editar";
type FiltroUbicacion = "" | "con_ubicacion" | "sin_ubicacion";

/* ============================================================
 * CONSTANTES
 * ============================================================ */
const REGISTROS_POR_PAGINA = 100;

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
  placeholder?: string;
  multiline?: boolean;
  fullWidth?: boolean;
}> = [
  { key: "zona", label: "Zona" },
  { key: "circuito", label: "Circuito" },
  { key: "congregacion", label: "Congregación" },
  { key: "nombre", label: "Nombre" },
  { key: "telefono", label: "Teléfono" },
  { key: "direccion", label: "Dirección", fullWidth: true },
  { key: "tipo_construccion", label: "Tipo de construcción" },
  { key: "notas", label: "Notas", multiline: true, fullWidth: true },
];

const OPCIONES_ESTATUS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "visitado", label: "Visitado" },
  { value: "inspeccionado", label: "Inspeccionado" },
  { value: "atendido", label: "Atendido" },
  { value: "reconstruido", label: "Reconstruido" },
];

const OPCIONES_DANOS = [
  { value: "sin_danos", label: "Sin daños" },
  { value: "leve", label: "Leve" },
  { value: "moderado", label: "Moderado" },
  { value: "grave", label: "Grave" },
  { value: "destruccion_total", label: "Destrucción total" },
];

/* ============================================================
 * HELPERS
 * ============================================================ */
const normalizarTexto = (valor: unknown): string => {
  if (valor === null || valor === undefined) return "";
  return String(valor).trim().replace(/\s+/g, " ");
};

const normalizarNumero = (valor: unknown): number | null => {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(String(valor).replace(",", ".").trim());
  return Number.isFinite(numero) ? numero : null;
};

const prepararParaGuardar = (
  formulario: FormularioAfectado
): Partial<Afectado> => ({
  zona: normalizarTexto(formulario.zona) || null,
  circuito: normalizarTexto(formulario.circuito) || null,
  congregacion: normalizarTexto(formulario.congregacion) || null,
  nombre: normalizarTexto(formulario.nombre) || null,
  telefono: normalizarTexto(formulario.telefono) || null,
  direccion: normalizarTexto(formulario.direccion) || null,
  latitud: normalizarNumero(formulario.latitud),
  longitud: normalizarNumero(formulario.longitud),
  precision_gps: normalizarNumero(formulario.precision_gps),
  tipo_construccion: normalizarTexto(formulario.tipo_construccion) || null,
  estatus: normalizarTexto(formulario.estatus) || null,
  nivel_danios: normalizarTexto(formulario.nivel_danios) || null,
  notas: normalizarTexto(formulario.notas) || null,
  s183: normalizarTexto(formulario.s183) || null,
  photoreport: normalizarTexto(formulario.photoreport) || null,
  fecha1: formulario.fecha1 || null,
  fecha2: formulario.fecha2 || null,
  fecha3: formulario.fecha3 || null,
  metodo_ubicacion: normalizarTexto(formulario.metodo_ubicacion) || null,
  nivel_precision: normalizarTexto(formulario.nivel_precision) || null,
});

const formatearFecha = (fecha?: string | null): string => {
  if (!fecha) return "—";
  try {
    const partes = fecha.split("-");
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return fecha;
  } catch {
    return fecha;
  }
};

const claseEstatus = (estatus?: string | null): string => {
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

const claseDanios = (danos?: string | null): string => {
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

const tieneUbicacion = (afectado: Afectado): boolean => {
  return (
    typeof afectado.latitud === "number" &&
    typeof afectado.longitud === "number" &&
    Number.isFinite(afectado.latitud) &&
    Number.isFinite(afectado.longitud)
  );
};

const generarPaginasVisibles = (
  actual: number,
  total: number
): Array<number | "ellipsis-start" | "ellipsis-end"> => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const paginas: Array<number | "ellipsis-start" | "ellipsis-end"> = [];
  paginas.push(1);

  if (actual > 3) paginas.push("ellipsis-start");

  const inicio = Math.max(2, actual - 1);
  const fin = Math.min(total - 1, actual + 1);
  for (let i = inicio; i <= fin; i++) paginas.push(i);

  if (actual < total - 2) paginas.push("ellipsis-end");

  paginas.push(total);
  return paginas;
};

/* ============================================================
 * COMPONENTE PRINCIPAL
 * ============================================================ */
export default function CrudAfectados() {
  const [afectados, setAfectados] = useState<Afectado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");
  const [filtroDanios, setFiltroDanios] = useState("");
  const [filtroZona, setFiltroZona] = useState("");
  const [filtroUbicacion, setFiltroUbicacion] = useState<FiltroUbicacion>("");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modo, setModo] = useState<ModoModal>("crear");
  const [seleccionado, setSeleccionado] = useState<Afectado | null>(null);
  const [formulario, setFormulario] =
    useState<FormularioAfectado>(FORMULARIO_VACIO);

  // Mensajes
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Acciones masivas
  const [eliminandoTodo, setEliminandoTodo] = useState(false);

  /* ---------- Carga inicial ---------- */
  const cargarAfectados = useCallback(async () => {
    setCargando(true);
    setError("");
    const { data, error } = await supabase
      .from("afectados")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando afectados:", error);
      setError("No se pudieron cargar los afectados.");
    } else {
      setAfectados((data ?? []) as Afectado[]);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarAfectados();
  }, [cargarAfectados]);

  /* ---------- Realtime ---------- */
  useEffect(() => {
    const canal = supabase
      .channel("crud-afectados-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "afectados" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setAfectados((actuales) => [
              payload.new as Afectado,
              ...actuales,
            ]);
          }
          if (payload.eventType === "UPDATE") {
            setAfectados((actuales) =>
              actuales.map((a) =>
                a.id === payload.new.id ? (payload.new as Afectado) : a
              )
            );
          }
          if (payload.eventType === "DELETE") {
            setAfectados((actuales) =>
              actuales.filter((a) => a.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  /* ---------- Reset de página al cambiar filtros ---------- */
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroEstatus, filtroDanios, filtroZona, filtroUbicacion]);

  /* ---------- Derivados ---------- */
  const zonas = useMemo(
    () =>
      Array.from(
        new Set(
          afectados.map((a) => a.zona).filter((z): z is string => Boolean(z))
        )
      ).sort(),
    [afectados]
  );

  const afectadosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();
    return afectados.filter((a) => {
      const coincideTexto =
        !texto ||
        [
          a.nombre,
          a.telefono,
          a.direccion,
          a.zona,
          a.circuito,
          a.congregacion,
          a.estatus,
          a.nivel_danios,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(texto);

      const coincideEstatus = !filtroEstatus || a.estatus === filtroEstatus;
      const coincideDanios = !filtroDanios || a.nivel_danios === filtroDanios;
      const coincideZona = !filtroZona || a.zona === filtroZona;

      let coincideUbicacion = true;
      if (filtroUbicacion === "con_ubicacion") {
        coincideUbicacion = tieneUbicacion(a);
      } else if (filtroUbicacion === "sin_ubicacion") {
        coincideUbicacion = !tieneUbicacion(a);
      }

      return (
        coincideTexto &&
        coincideEstatus &&
        coincideDanios &&
        coincideZona &&
        coincideUbicacion
      );
    });
  }, [afectados, busqueda, filtroEstatus, filtroDanios, filtroZona, filtroUbicacion]);

  const totalPaginas = useMemo(
    () => Math.max(1, Math.ceil(afectadosFiltrados.length / REGISTROS_POR_PAGINA)),
    [afectadosFiltrados.length]
  );

  useEffect(() => {
    if (paginaActual > totalPaginas && totalPaginas > 0) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  const afectadosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * REGISTROS_POR_PAGINA;
    const fin = inicio + REGISTROS_POR_PAGINA;
    return afectadosFiltrados.slice(inicio, fin);
  }, [afectadosFiltrados, paginaActual]);

  const rangoMostrado = useMemo(() => {
    if (afectadosFiltrados.length === 0) return { desde: 0, hasta: 0 };
    const desde = (paginaActual - 1) * REGISTROS_POR_PAGINA + 1;
    const hasta = Math.min(
      paginaActual * REGISTROS_POR_PAGINA,
      afectadosFiltrados.length
    );
    return { desde, hasta };
  }, [paginaActual, afectadosFiltrados.length]);

  const hayFiltrosActivos = Boolean(
    busqueda || filtroZona || filtroEstatus || filtroDanios || filtroUbicacion
  );

  /* ---------- Handlers de paginación ---------- */
  const irAPagina = useCallback((p: number) => {
    setPaginaActual(Math.max(1, Math.min(p, totalPaginas)));
  }, [totalPaginas]);

  const primeraPagina = useCallback(() => irAPagina(1), [irAPagina]);
  const ultimaPagina = useCallback(() => irAPagina(totalPaginas), [irAPagina, totalPaginas]);
  const paginaAnterior = useCallback(
    () => irAPagina(paginaActual - 1),
    [irAPagina, paginaActual]
  );
  const paginaSiguiente = useCallback(
    () => irAPagina(paginaActual + 1),
    [irAPagina, paginaActual]
  );

  /* ---------- Handlers de modal ---------- */
  const abrirCrear = useCallback(() => {
    setModo("crear");
    setSeleccionado(null);
    setFormulario({ ...FORMULARIO_VACIO });
    setError("");
    setMensaje("");
    setModalAbierto(true);
  }, []);

  const abrirEditar = useCallback((afectado: Afectado) => {
    setModo("editar");
    setSeleccionado(afectado);
    setFormulario({
      zona: afectado.zona ?? "",
      circuito: afectado.circuito ?? "",
      congregacion: afectado.congregacion ?? "",
      nombre: afectado.nombre ?? "",
      telefono: afectado.telefono ?? "",
      direccion: afectado.direccion ?? "",
      latitud: afectado.latitud ?? null,
      longitud: afectado.longitud ?? null,
      precision_gps: afectado.precision_gps ?? null,
      tipo_construccion: afectado.tipo_construccion ?? "",
      estatus: afectado.estatus ?? "pendiente",
      nivel_danios: afectado.nivel_danios ?? "",
      notas: afectado.notas ?? "",
      s183: afectado.s183 ?? "",
      photoreport: afectado.photoreport ?? "",
      fecha1: afectado.fecha1 ?? null,
      fecha2: afectado.fecha2 ?? null,
      fecha3: afectado.fecha3 ?? null,
      metodo_ubicacion: afectado.metodo_ubicacion ?? "",
      nivel_precision: afectado.nivel_precision ?? "",
    });
    setError("");
    setMensaje("");
    setModalAbierto(true);
  }, []);

  const cerrarModal = useCallback(() => {
    if (guardando) return;
    setModalAbierto(false);
    setSeleccionado(null);
  }, [guardando]);

  const cambiarCampo = useCallback(
    (campo: keyof FormularioAfectado, valor: string | number | null) => {
      setFormulario((actual) => ({ ...actual, [campo]: valor }));
    },
    []
  );

  /* ---------- Guardado ---------- */
  const guardar = useCallback(async () => {
    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      const datos = prepararParaGuardar(formulario);

      if (modo === "crear") {
        const { data, error } = await supabase
          .from("afectados")
          .insert(datos)
          .select()
          .single();
        if (error) throw error;
        if (data) {
          setAfectados((actuales) => [
            data as Afectado,
            ...actuales.filter((item) => item.id !== data.id),
          ]);
        }
        setMensaje("Afectado creado correctamente.");
      } else {
        if (!seleccionado?.id) {
          throw new Error("No se encontró el ID del afectado.");
        }
        const { data, error } = await supabase
          .from("afectados")
          .update(datos)
          .eq("id", seleccionado.id)
          .select()
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          throw new Error(
            "No se encontró el registro que se intentó actualizar."
          );
        }
        setAfectados((actuales) =>
          actuales.map((item) =>
            item.id === seleccionado.id ? (data as Afectado) : item
          )
        );
        setMensaje("Afectado actualizado correctamente.");
      }

      setTimeout(() => {
        setModalAbierto(false);
        setSeleccionado(null);
      }, 500);
    } catch (e: unknown) {
      const err = e as { message?: string };
      console.error("Error guardando afectado:", e);
      setError(err?.message || "No se pudo guardar el registro.");
    } finally {
      setGuardando(false);
    }
  }, [formulario, modo, seleccionado]);

  /* ---------- Eliminación ---------- */
  const eliminar = useCallback(async (afectado: Afectado) => {
    const confirmar = window.confirm(
      `¿Seguro que quieres eliminar a "${afectado.nombre || "este registro"}"?`
    );
    if (!confirmar) return;

    setError("");
    const { error } = await supabase
      .from("afectados")
      .delete()
      .eq("id", afectado.id);

    if (error) {
      console.error("Error eliminando afectado:", error);
      setError("No se pudo eliminar el registro.");
      return;
    }
    setAfectados((actuales) => actuales.filter((item) => item.id !== afectado.id));
    setMensaje("Registro eliminado correctamente.");
  }, []);

  const eliminarTodos = useCallback(async () => {
    if (!afectados.length) return;

    const confirmar = window.confirm(
      `⚠️ ATENCIÓN\n\nVas a eliminar TODOS los registros de afectados.\n\nTotal: ${afectados.length}\n\nEsta acción no se puede deshacer.\n\n¿Continuar?`
    );
    if (!confirmar) return;

    const confirmar2 = window.confirm(
      "CONFIRMACIÓN FINAL\n\n¿Realmente quieres borrar TODOS los afectados?"
    );
    if (!confirmar2) return;

    setEliminandoTodo(true);
    setError("");
    try {
      const { error } = await supabase
        .from("afectados")
        .delete()
        .not("id", "is", null);
      if (error) throw error;
      setAfectados([]);
      setPaginaActual(1);
      setMensaje("Todos los registros fueron eliminados.");
    } catch (e: unknown) {
      const err = e as { message?: string };
      console.error("Error eliminando todos:", e);
      setError(err?.message || "No se pudieron eliminar todos los registros.");
    } finally {
      setEliminandoTodo(false);
    }
  }, [afectados.length]);

  const limpiarFiltros = useCallback(() => {
    setBusqueda("");
    setFiltroEstatus("");
    setFiltroDanios("");
    setFiltroZona("");
    setFiltroUbicacion("");
  }, []);

  /* ============================================================
   * RENDER
   * ============================================================ */
  return (
    <div className="min-h-full bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto max-w-[1600px]">
        {/* HEADER */}
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Gestión de afectados
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Administra todos los registros que aparecen en el mapa.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <button
              type="button"
              onClick={cargarAfectados}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={abrirCrear}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Nuevo afectado
            </button>
            <button
              type="button"
              onClick={eliminarTodos}
              disabled={eliminandoTodo || !afectados.length}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={17} />
              {eliminandoTodo ? "Eliminando..." : "Eliminar todos"}
            </button>
          </div>
        </div>

        {/* MENSAJES */}
        {mensaje && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
          >
            {mensaje}
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* FILTROS */}
        <div className="mb-4 sm:mb-5 rounded-xl bg-white p-4 sm:p-5 shadow-sm">
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={busqueda}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setBusqueda(e.target.value)
                }
                placeholder="Buscar nombre, dirección, teléfono..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={filtroZona}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setFiltroZona(e.target.value)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">Todas las zonas</option>
              {zonas.map((zona) => (
                <option key={zona} value={zona}>
                  {zona}
                </option>
              ))}
            </select>

            <select
              value={filtroEstatus}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setFiltroEstatus(e.target.value)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">Todos los estatus</option>
              {OPCIONES_ESTATUS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={filtroDanios}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setFiltroDanios(e.target.value)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">Todos los daños</option>
              {OPCIONES_DANOS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <div className="md:col-span-2 lg:col-span-1">
              <select
                value={filtroUbicacion}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setFiltroUbicacion(e.target.value as FiltroUbicacion)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                aria-label="Filtrar por ubicación"
              >
                <option value="">Con o sin ubicación</option>
                <option value="con_ubicacion">📍 Con ubicación</option>
                <option value="sin_ubicacion">❌ Sin ubicación</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-xs sm:text-sm text-slate-500">
              Mostrando{" "}
              <strong className="text-slate-800">
                {afectadosFiltrados.length === 0
                  ? 0
                  : `${rangoMostrado.desde}–${rangoMostrado.hasta}`}
              </strong>{" "}
              de{" "}
              <strong className="text-slate-800">
                {afectadosFiltrados.length}
              </strong>{" "}
              registros (página{" "}
              <strong className="text-slate-800">{paginaActual}</strong> de{" "}
              <strong className="text-slate-800">{totalPaginas}</strong>)
            </p>
            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* LISTADO */}
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
          ) : afectadosFiltrados.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <p className="font-semibold text-slate-700">No hay registros.</p>
              <p className="mt-1 text-sm text-slate-500">
                Prueba cambiando los filtros o crea un nuevo afectado.
              </p>
            </div>
          ) : (
            <>
              {/* VISTA MÓVIL: CARDS */}
              <div className="divide-y divide-slate-100 lg:hidden">
                {afectadosPaginados.map((afectado) => (
                  <TarjetaMovil
                    key={afectado.id}
                    afectado={afectado}
                    onEditar={() => abrirEditar(afectado)}
                    onEliminar={() => eliminar(afectado)}
                  />
                ))}
              </div>

              {/* VISTA DESKTOP: TABLA */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full min-w-[1400px] text-left text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Nombre</th>
                      <th className="px-4 py-3 font-semibold">Zona</th>
                      <th className="px-4 py-3 font-semibold">Circuito</th>
                      <th className="px-4 py-3 font-semibold">Congregación</th>
                      <th className="px-4 py-3 font-semibold">Teléfono</th>
                      <th className="px-4 py-3 font-semibold">Dirección</th>
                      <th className="px-4 py-3 font-semibold">Ubicación</th>
                      <th className="px-4 py-3 font-semibold">Estatus</th>
                      <th className="px-4 py-3 font-semibold">Daños</th>
                      <th className="px-4 py-3 font-semibold">Fechas</th>
                      <th className="px-4 py-3 font-semibold">Documentos</th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {afectadosPaginados.map((afectado) => (
                      <FilaTabla
                        key={afectado.id}
                        afectado={afectado}
                        onEditar={() => abrirEditar(afectado)}
                        onEliminar={() => eliminar(afectado)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINACIÓN */}
              <Paginacion
                paginaActual={paginaActual}
                totalPaginas={totalPaginas}
                totalRegistros={afectadosFiltrados.length}
                registrosPorPagina={REGISTROS_POR_PAGINA}
                onPrimera={primeraPagina}
                onAnterior={paginaAnterior}
                onSiguiente={paginaSiguiente}
                onUltima={ultimaPagina}
                onIrAPagina={irAPagina}
              />
            </>
          )}
        </div>
      </div>

      {/* MODAL */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:h-auto sm:max-h-[95vh] sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 sm:px-6 py-4">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg sm:text-xl font-bold text-slate-900">
                  {modo === "crear" ? "Nuevo afectado" : "Editar afectado"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Completa o modifica la información del registro.
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                disabled={guardando}
                className="ml-2 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Cerrar"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {error && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2">
                {CAMPOS_TEXTO.map(({ key, label, placeholder, multiline, fullWidth }) => (
                  <div
                    key={key}
                    className={fullWidth ? "md:col-span-2" : ""}
                  >
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      {label}
                    </label>
                    {multiline ? (
                      <textarea
                        value={(formulario[key] as string) ?? ""}
                        onChange={(e) => cambiarCampo(key, e.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    ) : (
                      <input
                        type="text"
                        value={(formulario[key] as string) ?? ""}
                        onChange={(e) => cambiarCampo(key, e.target.value)}
                        placeholder={placeholder}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    )}
                  </div>
                ))}

                <CampoNumero
                  label="Latitud"
                  value={formulario.latitud}
                  onChange={(v) => cambiarCampo("latitud", v)}
                />
                <CampoNumero
                  label="Longitud"
                  value={formulario.longitud}
                  onChange={(v) => cambiarCampo("longitud", v)}
                />
                <CampoNumero
                  label="Precisión GPS"
                  value={formulario.precision_gps}
                  onChange={(v) => cambiarCampo("precision_gps", v)}
                />

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Estatus
                  </label>
                  <select
                    value={formulario.estatus ?? ""}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      cambiarCampo("estatus", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="">Seleccionar</option>
                    {OPCIONES_ESTATUS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Nivel de daños
                  </label>
                  <select
                    value={formulario.nivel_danios ?? ""}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      cambiarCampo("nivel_danios", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="">Seleccionar</option>
                    {OPCIONES_DANOS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <CampoFecha
                  label="Fecha 1"
                  value={formulario.fecha1}
                  onChange={(v) => cambiarCampo("fecha1", v)}
                />
                <CampoFecha
                  label="Fecha 2"
                  value={formulario.fecha2}
                  onChange={(v) => cambiarCampo("fecha2", v)}
                />
                <CampoFecha
                  label="Fecha 3"
                  value={formulario.fecha3}
                  onChange={(v) => cambiarCampo("fecha3", v)}
                />

                <CampoTexto
                  label="Método de ubicación"
                  value={formulario.metodo_ubicacion}
                  placeholder="GPS, aproximada, mapa, dirección..."
                  onChange={(v) => cambiarCampo("metodo_ubicacion", v)}
                />
                <CampoTexto
                  label="Nivel de precisión"
                  value={formulario.nivel_precision}
                  placeholder="Alta, media, baja..."
                  onChange={(v) => cambiarCampo("nivel_precision", v)}
                />

                <CampoUrl
                  label="Enlace S-183"
                  value={formulario.s183}
                  onChange={(v) => cambiarCampo("s183", v)}
                  linkLabel="Abrir S-183"
                />
                <CampoUrl
                  label="Enlace Photo Report"
                  value={formulario.photoreport}
                  onChange={(v) => cambiarCampo("photoreport", v)}
                  linkLabel="Abrir Photo Report"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-4">
              <button
                type="button"
                onClick={cerrarModal}
                disabled={guardando}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={17} />
                {guardando
                  ? "Guardando..."
                  : modo === "crear"
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

/* ============================================================
 * SUBCOMPONENTES
 * ============================================================ */

function Paginacion({
  paginaActual,
  totalPaginas,
  totalRegistros,
  registrosPorPagina,
  onPrimera,
  onAnterior,
  onSiguiente,
  onUltima,
  onIrAPagina,
}: {
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  registrosPorPagina: number;
  onPrimera: () => void;
  onAnterior: () => void;
  onSiguiente: () => void;
  onUltima: () => void;
  onIrAPagina: (p: number) => void;
}) {
  if (totalRegistros === 0) return null;

  const paginasVisibles = generarPaginasVisibles(paginaActual, totalPaginas);
  const puedeRetroceder = paginaActual > 1;
  const puedeAvanzar = paginaActual < totalPaginas;

  const btnBase =
    "inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  const btnNormal =
    "border-slate-300 bg-white text-slate-700 hover:bg-slate-50";
  const btnActivo =
    "border-blue-600 bg-blue-600 text-white";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4">
      <p className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
        Página <strong className="text-slate-900">{paginaActual}</strong> de{" "}
        <strong className="text-slate-900">{totalPaginas}</strong>
        <span className="hidden sm:inline">
          {" "}· {registrosPorPagina} registros por página
        </span>
      </p>

      <nav aria-label="Paginación" className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onPrimera}
          disabled={!puedeRetroceder}
          className={`${btnBase} ${btnNormal} hidden sm:inline-flex`}
          aria-label="Primera página"
          title="Primera página"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          type="button"
          onClick={onAnterior}
          disabled={!puedeRetroceder}
          className={`${btnBase} ${btnNormal}`}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
          <span className="ml-1 hidden sm:inline">Anterior</span>
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {paginasVisibles.map((p, idx) => {
            if (typeof p === "string") {
              return (
                <span
                  key={`${p}-${idx}`}
                  className="px-2 text-slate-400 select-none"
                >
                  …
                </span>
              );
            }
            const esActual = p === paginaActual;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onIrAPagina(p)}
                className={`${btnBase} min-w-[40px] ${
                  esActual ? btnActivo : btnNormal
                }`}
                aria-label={`Página ${p}`}
                aria-current={esActual ? "page" : undefined}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onSiguiente}
          disabled={!puedeAvanzar}
          className={`${btnBase} ${btnNormal}`}
          aria-label="Página siguiente"
        >
          <span className="mr-1 hidden sm:inline">Siguiente</span>
          <ChevronRight size={16} />
        </button>
        <button
          type="button"
          onClick={onUltima}
          disabled={!puedeAvanzar}
          className={`${btnBase} ${btnNormal} hidden sm:inline-flex`}
          aria-label="Última página"
          title="Última página"
        >
          <ChevronsRight size={16} />
        </button>
      </nav>
    </div>
  );
}

function FilaTabla({
  afectado,
  onEditar,
  onEliminar,
}: {
  afectado: Afectado;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50">
      <td className="px-4 py-4">
        <div className="font-semibold text-slate-900">
          {afectado.nombre || "Sin nombre"}
        </div>
        {afectado.tipo_construccion && (
          <div className="mt-1 text-xs text-slate-500">
            {afectado.tipo_construccion}
          </div>
        )}
      </td>
      <td className="px-4 py-4">{afectado.zona || "—"}</td>
      <td className="px-4 py-4">{afectado.circuito || "—"}</td>
      <td className="px-4 py-4">{afectado.congregacion || "—"}</td>
      <td className="px-4 py-4">{afectado.telefono || "—"}</td>
      <td className="max-w-[300px] px-4 py-4">
        <div className="truncate">{afectado.direccion || "—"}</div>
      </td>
      <td className="px-4 py-4">
        {tieneUbicacion(afectado) ? (
          <div className="flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 text-blue-600" />
            <div>
              <div className="font-mono text-xs">
                {afectado.latitud}, {afectado.longitud}
              </div>
              {afectado.metodo_ubicacion && (
                <div className="mt-1 text-xs text-slate-500">
                  {afectado.metodo_ubicacion}
                </div>
              )}
              {afectado.nivel_precision && (
                <div className="text-xs text-slate-500">
                  {afectado.nivel_precision}
                </div>
              )}
            </div>
          </div>
        ) : (
          <span className="text-xs text-orange-600">Sin ubicación</span>
        )}
      </td>
      <td className="px-4 py-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${claseEstatus(
            afectado.estatus
          )}`}
        >
          {afectado.estatus || "—"}
        </span>
      </td>
      <td className="px-4 py-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${claseDanios(
            afectado.nivel_danios
          )}`}
        >
          {afectado.nivel_danios || "—"}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="space-y-1 text-xs">
          <div>
            <span className="font-semibold">F1:</span>{" "}
            {formatearFecha(afectado.fecha1)}
          </div>
          <div>
            <span className="font-semibold">F2:</span>{" "}
            {formatearFecha(afectado.fecha2)}
          </div>
          <div>
            <span className="font-semibold">F3:</span>{" "}
            {formatearFecha(afectado.fecha3)}
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-col gap-2">
          {afectado.photoreport && (
            <a
              href={afectado.photoreport}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Photo Report <ExternalLink size={13} />
            </a>
          )}
          {afectado.s183 && (
            <a
              href={afectado.s183}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800"
            >
              S-183 <ExternalLink size={13} />
            </a>
          )}
          {!afectado.photoreport && !afectado.s183 && (
            <span className="text-xs text-slate-400">Sin documentos</span>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onEditar}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Pencil size={14} />
            Editar
          </button>
          <button
            type="button"
            onClick={onEliminar}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
          >
            <Trash2 size={14} />
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}

function TarjetaMovil({
  afectado,
  onEditar,
  onEliminar,
}: {
  afectado: Afectado;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const conUbicacion = tieneUbicacion(afectado);
  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-slate-900">
              {afectado.nombre || "Sin nombre"}
            </h3>
            {conUbicacion ? (
              <MapPinned size={16} className="shrink-0 text-blue-600" />
            ) : (
              <Map size={16} className="shrink-0 text-orange-500" />
            )}
          </div>
          {afectado.tipo_construccion && (
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {afectado.tipo_construccion}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${claseEstatus(
              afectado.estatus
            )}`}
          >
            {afectado.estatus || "—"}
          </span>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${claseDanios(
              afectado.nivel_danios
            )}`}
          >
            {afectado.nivel_danios || "—"}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <InfoItem label="Zona" value={afectado.zona} />
        <InfoItem label="Circuito" value={afectado.circuito} />
        <InfoItem label="Congregación" value={afectado.congregacion} />
        <InfoItem label="Teléfono" value={afectado.telefono} />
        <div className="col-span-2">
          <InfoItem label="Dirección" value={afectado.direccion} />
        </div>
        <div className="col-span-2">
          {conUbicacion ? (
            <div className="flex items-start gap-1.5">
              <MapPin size={14} className="mt-0.5 text-blue-600" />
              <div className="font-mono text-slate-700">
                {afectado.latitud}, {afectado.longitud}
              </div>
            </div>
          ) : (
            <span className="text-orange-600">Sin ubicación</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs">
        <span>
          <strong>F1:</strong> {formatearFecha(afectado.fecha1)}
        </span>
        <span>
          <strong>F2:</strong> {formatearFecha(afectado.fecha2)}
        </span>
        <span>
          <strong>F3:</strong> {formatearFecha(afectado.fecha3)}
        </span>
        {afectado.photoreport && (
          <a
            href={afectado.photoreport}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-blue-600"
          >
            Photo <ExternalLink size={12} />
          </a>
        )}
        {afectado.s183 && (
          <a
            href={afectado.s183}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-purple-600"
          >
            S-183 <ExternalLink size={12} />
          </a>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onEditar}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          <Pencil size={14} />
          Editar
        </button>
        <button
          type="button"
          onClick={onEliminar}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
        >
          <Trash2 size={14} />
          Eliminar
        </button>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="truncate text-slate-700">{value || "—"}</div>
    </div>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function CampoNumero({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null | undefined;
  onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        type="number"
        step="any"
        value={value ?? ""}
        onChange={(e) => onChange(normalizarNumero(e.target.value))}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function CampoFecha({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function CampoUrl({
  label,
  value,
  onChange,
  linkLabel,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  linkLabel: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        type="url"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://..."
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      {value && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
        >
          {linkLabel} <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}