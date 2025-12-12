<?php
    namespace App\Http\Middleware;

    use Closure;
    use Illuminate\Http\Request;
    use Symfony\Component\HttpFoundation\Response;

    class SobreescribirMetodoHttp {
        /**
         * Handle an incoming request.
         * Convierte _method en FormData a HTTP method real, evitando problemas de compatibilidad con métodos PUT/DElETE
         *
         * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
         */
        public function handle(Request $request, Closure $next): Response {
            // Si viene un _method en el request, usarlo
            if ($request->has('_method')) {
                $method = strtoupper($request->input('_method'));
                $request->setMethod($method);
            }

            return $next($request);
        }
    }
?>
