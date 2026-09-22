import CrudAfectados from "@/components/mapa/CrudAfectados";
import ProtectedPage from "@/components/auth/ProtectedPage";

export default function AfectadosAdminPage() {
    return (
        <ProtectedPage>
            <CrudAfectados />
        </ProtectedPage>
    );
}