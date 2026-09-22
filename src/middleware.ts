import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.next();
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Obtener la cookie de sesión
    const authCookie = request.cookies.get('sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token')?.value;
    
    // Rutas que requieren autenticación
    const protectedRoutes = ['/mapa', '/admin', '/prueba-realtime', '/prueba-supabase'];
    
    const { pathname } = request.nextUrl;
    
    // Verificar si la ruta está protegida
    const isProtectedRoute = protectedRoutes.some(route => 
        pathname.startsWith(route)
    );
    
    // Si es una ruta protegida y no hay sesión, redirigir al login
    if (isProtectedRoute) {
        // Intentar obtener la sesión
        let session = null;
        
        if (authCookie) {
            try {
                const { data } = await supabase.auth.getSession();
                session = data.session;
            } catch (e) {
                // Error obteniendo sesión
            }
        }
        
        if (!session) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: ['/mapa/:path*', '/admin/:path*', '/prueba-realtime/:path*', '/prueba-supabase/:path*'],
};
