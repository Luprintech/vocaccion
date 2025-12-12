<?php
    namespace App\Policies;

    use App\Models\Guia;
    use App\Models\Usuario;

    class GuiaPolicy {
        /**
         * Determinar si el usuario puede ver el listado de modelos
         */
        public function viewAny (): bool {
            return true;
        }

        /**
         * Determinar si el usuario puede ver el modelo
         */
        public function view (?Usuario $user, Guia $guia): bool {
            //  Si es público, todos pueden ver
            if ($guia->visibilidad === 'publico' && $guia->esta_publicado) {
                return true;
            }

            // Sin usuario no puede ver contenido privado
            if (!$user) {
                return false;
            }

            //  Si la guia es privada
            if ($guia->visibilidad === 'privado' && $guia->esta_publicado) {
                //  Si es el autor, puede ver
                if ($user->id === $guia->usuario_id) {
                    return true;
                }

                //  Si es admin, puede ver
                if ($user->tieneRol('admin')) {
                    return true;
                }

                //  Si es estudiante premium
                if ($user->tieneRol('estudiante') && $user->es_premium) {
                    // Verificar que el premium no haya expirado
                    if (!$user->fecha_expiracion_premium || $user->fecha_expiracion_premium >= now()) {
                        return true;
                    }
                }
                return false;
            }
            //  El admin puede ver incluso las guías no publicadas, a diferencia del orientador que solo puede ver las suyas y públicas
            return $user->id === $guia->usuario_id || $user->tieneRol('admin');
        }

        /**
         * Determinar si el usuario puede crear modelos
         */
        public function create (Usuario $user): bool {
            return $user->tieneRol('orientador');
        }

        /**
         * Determinar si el usuario puede actualizar el modelo
         */
        public function update (Usuario $user, Guia $guia): bool {
            $authorized = $user->id === $guia->usuario_id || $user->tieneRol('admin');
            \Illuminate\Support\Facades\Log::info('GuiaPolicy::update', [
                'user_id' => $user->id,
                'guia_usuario_id' => $guia->usuario_id,
                'user_role' => $user->roles[0]->nombre ?? 'sin rol',
                'authorized' => $authorized
            ]);
            return $authorized;
        }

        /**
         * Determinar si el usuario puede descargar el modelo
         */
        public function download (Usuario $user, Guia $guia): bool {
            return $this->view($user, $guia);
        }

        /**
         * Determinar si el usuario puede restaurar el modelo
         */
        public function restore (Usuario $user, Guia $guia): bool {
            return $user->tieneRol('admin');
        }

        /**
         * Determinar si el usuario puede eliminar el modelo
         */
        public function delete (Usuario $user, Guia $guia): bool {
            return $user->id === $guia->usuario_id || $user->tieneRol('admin');
        }

        /**
         * Determinar si el usuario puede eliminar permanentemente el modelo
         */
        public function forceDelete (Usuario $user, Guia $guia): bool {
            return $user->tieneRol('admin');
        }
    }
?>
