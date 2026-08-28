"use client";

import Map, {
    NavigationControl,
} from "react-map-gl/maplibre";

import "maplibre-gl/dist/maplibre-gl.css";

export default function Mapa() {
    return (
        <Map
            initialViewState={{
                longitude: -66.9036,
                latitude: 10.4806,
                zoom: 11,
            }}
            style={{
                width: "100%",
                height: "100%",
            }}
            mapStyle="https://tiles.openfreemap.org/styles/bright"
        >
            <NavigationControl position="top-right" />
        </Map>
    );
}