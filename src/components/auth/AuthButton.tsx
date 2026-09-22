'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { useState } from 'react';

export default function AuthButton() {
    const { user, signOut, loading } = useAuth();
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
        setShowMenu(false);
    };

    if (loading) {
        return (
            <div className="animate-pulse h-10 w-10 bg-gray-200 rounded-full"></div>
        );
    }

    if (!user) {
        return (
            <button
                onClick={() => router.push('/login')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
                Iniciar Sesión
            </button>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md transition-colors"
            >
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                    {user.email?.split('@')[0]}
                </span>
            </button>

            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                        <div className="py-1">
                            <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                                {user.email}
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
