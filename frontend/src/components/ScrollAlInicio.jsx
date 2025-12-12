import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollAlInicio - Componente que restaura el scroll al inicio en TODAS las navegaciones
 * 
 * Utiliza useLayoutEffect para garantizar que el scroll ocurra de forma síncrona
 * ANTES de que el navegador pinte el nuevo contenido, evitando cualquier salto visual.
 */
export default function ScrollAlInicio() {
    const { pathname } = useLocation();

    useLayoutEffect(() => {
        // Fuerza scroll al inicio en TODAS las rutas
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant'
        });
    }, [pathname]);

    return null;
}
