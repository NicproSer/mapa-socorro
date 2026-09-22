import MapaAfectados from "@/components/mapa/MapaAfectados";
import ProtectedPage from "@/components/auth/ProtectedPage";

export default function MapaPage() {
    return (
        <ProtectedPage>
            <main className="h-screen w-full">
                <MapaAfectados />
            </main>
        </ProtectedPage>
    );
}