import ImportadorAfectados from "@/components/admin/ImportadorAfectados";
import ProtectedPage from "@/components/auth/ProtectedPage";

export default function ImportacionPage() {
    return (
        <ProtectedPage>
            <ImportadorAfectados />
        </ProtectedPage>
    );
}