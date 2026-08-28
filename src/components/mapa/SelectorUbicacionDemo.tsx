"use client";

import SelectorUbicacion from "./SelectorUbicacion";

export default function SelectorUbicacionDemo() {
  const manejarConfirmacion = (ubicacion: {
    latitude: number;
    longitude: number;
  }) => {
    console.log("Ubicación confirmada:", ubicacion);
  };

  return (
    <SelectorUbicacion
      onConfirmar={manejarConfirmacion}
    />
  );
}