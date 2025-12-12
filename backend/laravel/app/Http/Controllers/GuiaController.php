<?php
    namespace App\Http\Controllers;

    use App\Http\Controllers\Controller;
    use App\Models\Guia;
    use App\Models\Usuario;
    use App\Models\Tags;
    use Illuminate\Auth\Access\AuthorizationException;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Storage;
    use Illuminate\Support\Facades\Auth;
    use Illuminate\Support\Str;
    use Illuminate\Support\Facades\Log;
    use Smalot\PdfParser\Parser as PdfParser;
    use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

    class GuiaController extends Controller {
        use AuthorizesRequests;

        /**
         * Helper: Obtiene el número de página del PDF incluído
         */
        private function getPdfPageCount($pdfFile): int {
            try {
                $parser = new PdfParser();
                $pdf = $parser->parseFile($pdfFile->getRealPath());
                $pages = count($pdf->getPages());
                Log::info('Páginas del PDF extraídas correctamente', ['pages' => $pages]);
                return $pages;
            } catch (\Exception $e) {
                Log::warning('No se pudo extraer el número de páginas del PDF: ' . $e->getMessage());
                // Retornar 0 por defecto en lugar de null
                return 0;
            }
        }

        /**
         * Helper: Obtiene el número de página del PDF desde una ruta del filesystem
         */
        private function getPdfPageCountFromPath($pdfPath): int {
            try {
                if (!file_exists($pdfPath)) {
                    Log::warning('Archivo PDF no encontrado', ['path' => $pdfPath]);
                    return 0;
                }

                $parser = new PdfParser();
                $pdf = $parser->parseFile($pdfPath);
                $pages = count($pdf->getPages());
                Log::info('Páginas del PDF extraídas correctamente', ['pages' => $pages, 'path' => $pdfPath]);
                return $pages;
            } catch (\Exception $e) {
                Log::warning('No se pudo extraer el número de páginas del PDF: ' . $e->getMessage(), ['path' => $pdfPath]);
                // Retornar 0 por defecto en lugar de null
                return 0;
            }
        }

        /**
         * Listar guías visibles según permisos del usuario
         * GET /api/guias/visible
         */
        public function visible(Request $request): JsonResponse {
            try {
                $user = Auth::user();

                /** @var Usuario $user */
                Log::info('Obteniendo guías visibles', ['user_id' => $user->id]);
                //  Administrador puede ver todas las guías estén publicadas o no
                if ($user->tieneRol('admin')) {
                    $query = Guia::query();
                } else {
                    $query = Guia::where('esta_publicado', true)->where(function ($query) use ($user) {
                        //  Guías públicas
                        $query->where('visibilidad', 'publico');

                        //  Guías del usuario autenticado (orientador puede ver sus propias guías)
                        if ($user) {
                            $query->orWhere('usuario_id', $user->id);
                        }

                        //  Guías premium
                        if ($user && $user->es_premium) {
                            //  Verificar que no haya expirado
                            if (!$user->fecha_expiracion_premium || $user->fecha_expiracion_premium >= now()) {
                                $query->orWhere('visibilidad', 'privado');
                            }
                        }
                    });
                }

                //  Filtros opcionales
                if ($request->has('categoria')) {
                    $query->where('categoria', $request->categoria);
                }

                if ($request->has('tag')) {
                    $query->whereHas('tags', function ($q) use ($request) {
                        $q->where('nombre', $request->tag);
                    });
                }

                if ($request->has('search')) {
                    $query->search($request->search);
                }

                if ($request->has('sort')) {
                    $sort = $request->sort;
                    if ($sort === 'popular') {
                        $query->orderByDesc('descargas');
                    } elseif ($sort === 'recent') {
                        $query->latest();
                    } elseif ($sort === 'rating') {
                        $query->orderByDesc('valoracion_media');
                    }
                } else {
                    $query->latest();
                }

                //  Consultar guías con autor y tags, paginadas, y devolver en formato JSON
                // Seleccionar columnas específicas incluyendo siempre el id
                $guias = $query->select('id', 'titulo', 'slug', 'descripcion', 'categoria', 'imagen_portada', 'visibilidad', 'esta_publicado', 'fecha_publicacion', 'usuario_id', 'numero_paginas', 'descargas', 'vistas')
                    ->with(['author:id,nombre,email', 'tags:id,nombre,slug'])
                    ->paginate(12);
                Log::info('Guías visibles obtenidas correctamente', ['total' => $guias->total()]);
                return response()->json($guias);
            } catch (\Exception $e) {
                Log::error('Error obteniendo guías visibles: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Error al obtener guías visibles',
                    'error' => $e->getMessage()
                ], 500);
            }
        }

        /**
         * Obtener detalle de una guía
         * GET /api/guias/{slug}
         */
        public function show($idOrSlug): JsonResponse {
            try {
                Log::info('Mostrando detalle de guía', ['id_or_slug' => $idOrSlug, 'user_id' => Auth::id()]);

                // Intentar obtener por ID primero, luego por slug
                $guia = is_numeric($idOrSlug)
                    ? Guia::findOrFail($idOrSlug)
                    : Guia::where('slug', $idOrSlug)->firstOrFail();

                // Autorizar acceso
                $this->authorize('view', $guia);

                // Incrementar contadores de vistas
                $guia->increment('vistas');

                Log::info('Guía mostrada correctamente', ['guia_id' => $guia->id]);
                return response()->json($guia->load(['author:id,nombre,email', 'tags:id,nombre,slug']));
            } catch (AuthorizationException $e) {
                Log::error('No autorizado: ' . $e->getMessage());
                return response()->json([
                    'message' => 'No autorizado',
                    'error' => $e->getMessage()
                ], 403);
            } catch (\Exception $e) {
                Log::error('Error al mostrar los detalles de la guía: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Error al mostrar los detalles de la guía',
                    'error' => $e->getMessage()
                ], 500);
            }
        }

        /**
         * Listar guías del orientador autenticado
         * GET /api/guias/mis-guias (orientador)
         */
        public function myGuides(Request $request): JsonResponse {
            try {
                /** @var Usuario $user */
                $user = Auth::user();
                Log::info('Obteniendo guías del orientador', ['user_id' => $user->id]);

                //  En principio solo el orientador tiene acceso al panel mis guías, donde podrá crearlas, editarlas y eliminarlas
                if (!$user->tieneRol('orientador')) {
                    Log::error('No autorizado: usuario no es orientador');
                    return response()->json([
                        'message' => 'No autorizado',
                        'error'   => 'Solo orientadores pueden acceder'
                    ], 403);
                }

                $guia = Guia::where('usuario_id', $user->id)->when($request->esta_publicado, function ($query) {
                    return $query->where('esta_publicado', true);
                })->with('tags:id,nombre,slug')->latest()->get();
                Log::info('Guías del orientador obtenidas correctamente', ['total' => $guia->count()]);
                return response()->json($guia);
            } catch (\Exception $e) {
                Log::error('Error al obtener las guías del orientador: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Error al obtener las guías del orientador',
                    'error' => $e->getMessage()
                ], 500);
            }
        }

        /**
         * Descargar PDF (protegido)
         * GET /api/guias/{id}/download
         */
        public function download(Guia $guia) {
            try {
                //  Comprobamos que tenga permisos de descarga sobre la guía
                $this->authorize('download', $guia);
                $user = Auth::user();
                Log::info('Descargando guía', ['guia_id' => $guia->id, 'user_id' => $user->id]);

                //  Verificar si es la primera descarga del usuario antes de registrar
                $esPrimeraDescarga = !$guia->hasUserDownloaded($user);

                //  Registramos la descarga o actualizamos los datos si no es la primera descarga del usuario sobre la misma guía
                $guia->recordDownload($user);

                //  Incrementar contador solo si es la primera vez
                if ($esPrimeraDescarga) {
                    $guia->incrementDownloadCount();
                    Log::info('Primera descarga del usuario, contador incrementado', ['guia_id' => $guia->id, 'user_id' => $user->id]);
                }

                //  Descargar PDF de la guía desde el storage privado
                $nombreArchivo = $guia->slug . '.pdf';
                /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
                $disk = Storage::disk('private');
                Log::info('Descarga exitosa', ['guia_id' => $guia->id, 'archivo' => $nombreArchivo]);
                return $disk->download(
                    $guia->path_pdf,
                    $nombreArchivo
                );
            } catch (AuthorizationException $e) {
                Log::error('No autorizado para descarga: ' . $e->getMessage());
                return response()->json([
                    'message' => 'No autorizado',
                    'error' => $e->getMessage()
                ], 403);
            } catch (\Exception $e) {
                Log::error('Error al descargar el PDF: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Error al descargar el PDF',
                    'error' => $e->getMessage()
                ], 500);
            }
        }

        /**
         * Visualizar PDF (en línea)
         * GET /api/guias/{id}/preview
         */
        public function preview(Guia $guia) {
            try {
                Log::info('Previsualizando guía', ['guia_id' => $guia->id, 'user_id' => Auth::id()]);
                //  Si tenemos permisos de lectura y se ha ejecutado la función visualizamos el PDF
                $this->authorize('view', $guia);
                $rutaPdf = Storage::disk('private')->path($guia->path_pdf);
                Log::info('Preview exitoso', ['guia_id' => $guia->id]);
                return response()->file($rutaPdf, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'inline; filename="' . $guia->slug . '.pdf"'
                ]);
            } catch (AuthorizationException $e) {
                Log::error('No autorizado: ' . $e->getMessage());
                return response()->json([
                    'message' => 'No autorizado',
                    'error' => $e->getMessage()
                ], 403);
            } catch (\Exception $e) {
                Log::error('Error al visualizar el PDF: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Error al visualizar el PDF',
                    'error' => $e->getMessage()
                ], 500);
            }
        }

        /**
         * Crear nueva guía
         * POST /api/guias
         */
        public function store(Request $request): JsonResponse {
            try {
                $user = Auth::user();
                Log::info('Creando nueva guía', ['user_id' => $user->id]);

                //  Validar autorización
                /** @var Usuario $user */
                if (!$user->tieneRol('orientador')) {
                    Log::error('No autorizado, el usuario no tiene rol orientador.');
                    return response()->json([
                        'message' => 'No autorizado',
                        'error' => 'Solo orientadores pueden crear guías'
                    ], 403);
                }

                //  Validar campos
                $data = $request->validate([
                    'titulo'                  =>  'required|string|max:255',
                    'categoria'               =>  'required|string|in:profesiones,estudios,competencias,tecnicas,otro',
                    'descripcion'             =>  'required|string',
                    'pdf'                     =>  'required|file|mimes:pdf|max:10240',
                    'imagen_portada'          =>  'required|image|mimes:jpeg,png,jpg,webp|max:5120',
                    'palabras_clave'          =>  'nullable|string|max:50',
                    'visibilidad'             =>  'required|in:publico,privado',
                    'esta_publicado'          =>  'boolean'
                ], [
                    'titulo.required'         =>  'El título es obligatorio',
                    'descripcion.required'    =>  'La descripción es obligatoria',
                    'categoria.required'      =>  'La categoría es obligatoria',
                    'pdf.required'            =>  'Debes subir un archivo PDF',
                    'pdf.mimes'               =>  'El tipo de archivo no es válido, solo se permiten PDFs',
                    'pdf.max'                 =>  'El tamaño máximo del PDF es 10MB',
                    'imagen_portada.required' =>  'Debes subir una imagen de portada',
                    'imagen_portada.image'    =>  'La portada debe ser una imagen válida',
                    'visibilidad.required'    =>  'Debe especificar la visibilidad'
                ]);

                //  Almacenar PDF
                $archivoPdf = $request->file('pdf');
                $nombrePdf  = date('Y-m-d-His') . '_' . Str::slug($data['titulo']) . '.pdf';
                $rutaPdf    = $archivoPdf->storeAs('guias/pdfs', $nombrePdf, 'private');

                //  Almacenar imagen de portada (opcional)
                $archivoImg = $request->file('imagen_portada');
                $nombreImg  = date('Y-m-d-His') . '_' . Str::slug($data['titulo']) . '.' . $archivoImg->extension();
                $rutaImg    = $archivoImg->storeAs('guias/portadas', $nombreImg, 'public');

                //  Extraer metadatos del pdf (desde el archivo almacenado)
                $pdfSize  = $archivoPdf->getSize();
                $pdfPath  = Storage::disk('private')->path($rutaPdf);
                $pdfPages = $this->getPdfPageCountFromPath($pdfPath);

                // Establecer fecha_publicacion si se publica
                $fechaPublicacion = null;
                if ($data['esta_publicado'] ?? false) {
                    $fechaPublicacion = now();
                }

                //  Crear guía
                $guia = Guia::create([
                    'titulo'            =>  $data['titulo'],
                    'categoria'         =>  $data['categoria'],
                    'descripcion'       =>  $data['descripcion'],
                    'path_pdf'          =>  $rutaPdf,
                    'tamanio'           =>  $pdfSize,
                    'numero_paginas'    =>  $pdfPages,
                    'imagen_portada'    =>  $rutaImg,
                    'visibilidad'       =>  $data['visibilidad'],
                    'esta_publicado'    =>  $data['esta_publicado'] ?? false,
                    'fecha_publicacion' =>  $fechaPublicacion,
                    'usuario_id'        =>  $user->id,
                ]);

                // Crear/sincronizar tags desde palabras clave
                $tagIds = [];
                if (!empty($data['palabras_clave'])) {
                    $palabrasClave = array_map('trim', explode(',', $data['palabras_clave']));

                    foreach ($palabrasClave as $palabra) {
                        if (!empty($palabra)) {
                            // Buscar o crear tag
                            $tag = Tags::firstOrCreate(
                                ['nombre' => $palabra],
                                ['slug' => Str::slug($palabra)]
                            );
                            $tagIds[] = $tag->id;
                        }
                    }

                    // Sincronizar tags si hay
                    if (!empty($tagIds)) {
                        $guia->tags()->sync($tagIds);
                        Log::info('Tags sincronizados en creación', ['guia_id' => $guia->id, 'tags' => $tagIds]);
                    }
                }

                Log::info('Guía creada correctamente', ['guia_id' => $guia->id]);
                return response()->json([
                    'message' => 'Guía creada correctamente',
                    'data' => $guia->load(['author:id,nombre,email', 'tags:id,nombre,slug'])
                ], 201);
            } catch (\Exception $e) {
                if ($e->getCode() == 422) {
                    Log::error('Error de validación: ' . $e->getMessage());
                    return response()->json([
                        'message' => 'Error de validación.',
                        'error' => $e->getMessage()
                    ], 422);
                }
                Log::error('Error al crear la guía: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Error al crear la guía',
                    'error' => $e->getMessage()
                ], 500);
            }
        }

        /**
         * Actualizar guía
         * PUT /api/guias/{id}
         */
        public function update(Request $request, Guia $guia): JsonResponse {
            try {
                $user = Auth::user();
                Log::info('Actualizando guía', ['guia_id' => $guia->id, 'user_id' => $user->id, 'guia_usuario_id' => $guia->usuario_id]);
                Log::info('Request headers:', ['content-type' => $request->header('Content-Type')]);
                Log::info('Request method:', ['method' => $request->getMethod()]);
                Log::info('Request getContent size:', ['size' => strlen($request->getContent())]);
                Log::info('Request all input:', $request->all());
                Log::info('Request files:', $request->files->all());

                // Log raw content
                $raw = $request->getContent();
                Log::info('Raw request content (first 500 chars):', ['content' => substr($raw, 0, 500)]);

                $this->authorize('update', $guia);

                // Validar campos (permitir que algunos vengan vacíos)
                $datosValidados = $request->validate([
                    'titulo'         =>  'nullable|string|max:255',
                    'categoria'      =>  'nullable|string|in:profesiones,estudios,competencias,tecnicas,otro',
                    'descripcion'    =>  'nullable|string',
                    'pdf'            =>  'nullable|file|mimes:pdf|max:10240',
                    'imagen_portada' =>  'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                    'palabras_clave' =>  'nullable|string|max:50',
                    'visibilidad'    =>  'nullable|string|in:publico,privado',
                    'esta_publicado' =>  'nullable|string|in:0,1'
                ]);

                Log::info('Datos Validados:', $datosValidados);

                // Filtrar solo los campos que vinieron no vacíos
                $data = array_filter($datosValidados, function($value) {
                    return $value !== null && $value !== '';
                });

                Log::info('Datos filtrados:', $data);

                // Convertir esta_publicado a boolean
                if (isset($data['esta_publicado'])) {
                    $data['esta_publicado'] = $data['esta_publicado'] === '1' || $data['esta_publicado'] === true;
                }

                // Establecer fecha_publicacion si se publica por primera vez
                if (isset($data['esta_publicado']) && $data['esta_publicado'] && !$guia->esta_publicado) {
                    $data['fecha_publicacion'] = now();
                }

                // Actualizar campos de texto
                $camposTexto = ['titulo', 'categoria', 'descripcion', 'visibilidad', 'esta_publicado', 'fecha_publicacion'];
                $datosTexto = array_intersect_key($data, array_flip($camposTexto));

                if (!empty($datosTexto)) {
                    Log::info('Actualizando campos de texto:', $datosTexto);
                    $guia->update($datosTexto);
                }

                // Actualizar PDF
                if ($request->hasFile('pdf')) {
                    Log::info('Actualizando PDF');
                    if ($guia->path_pdf) {
                        Storage::disk('private')->delete($guia->path_pdf);
                    }

                    $archivoPdf = $request->file('pdf');
                    $nombrePdf  = date('Y-m-d-His') . '_' . Str::slug($guia->titulo) . '.pdf';
                    $rutaPdf    = $archivoPdf->storeAs('guias/pdfs', $nombrePdf, 'private');
                    $pdfPath  = Storage::disk('private')->path($rutaPdf);
                    $pdfPages = $this->getPdfPageCountFromPath($pdfPath);
                    $pdfSize  = $archivoPdf->getSize();

                    $guia->update([
                        'path_pdf'       => $rutaPdf,
                        'numero_paginas' => $pdfPages,
                        'tamanio'        => $pdfSize,
                    ]);
                    Log::info('PDF actualizado');
                }

                // Actualizar imagen portada
                if ($request->hasFile('imagen_portada')) {
                    Log::info('Actualizando imagen portada');
                    if ($guia->imagen_portada) {
                        Storage::disk('public')->delete($guia->imagen_portada);
                    }

                    $archivoImg = $request->file('imagen_portada');
                    $nombreImg = date('Y-m-d-His') . '_' . Str::slug($guia->titulo) . '.' . $archivoImg->extension();
                    $rutaImg = $archivoImg->storeAs('guias/portadas', $nombreImg, 'public');

                    $guia->update(['imagen_portada' => $rutaImg]);
                    Log::info('Imagen actualizada');
                }

                // Sincronizar tags desde palabras_clave si se actualizan
                if (isset($data['palabras_clave'])) {
                    $palabras = array_map('trim', explode(',', $data['palabras_clave']));
                    $tagIds = [];

                    foreach ($palabras as $palabra) {
                        if (!empty($palabra)) {
                            // Buscar o crear tag
                            $tag = Tags::firstOrCreate(
                                ['nombre' => $palabra],
                                ['slug' => Str::slug($palabra)]
                            );
                            $tagIds[] = $tag->id;
                        }
                    }

                    // Sincronizar todos los tags
                    if (!empty($tagIds)) {
                        $guia->tags()->sync($tagIds);
                        Log::info('Tags sincronizados:', $tagIds);
                    }
                }

                // Recargar la guía
                $guia = $guia->fresh()->load(['author:id,nombre,email', 'tags:id,nombre,slug']);

                Log::info('Guía actualizada correctamente', ['guia_id' => $guia->id]);

                return response()->json([
                    'message' => 'Guía actualizada correctamente',
                    'data' => $guia
                ]);
            } catch (\Exception $e) {
                Log::error('Error en update:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
                return response()->json([
                    'message' => 'Error al actualizar la guía',
                    'error' => $e->getMessage()
                ], 500);
            }
        }

        /**
         * Eliminar guía
         * DELETE /api/guias/{id}
         */
        public function destroy(Guia $guia): JsonResponse {
            try {
                $this->authorize('delete', $guia);

                // Log del intento de eliminación
                Log::info('Eliminando guía', ['guia_id' => $guia->id, 'usuario_id' => Auth::id()]);

                // Eliminar archivos
                if ($guia->path_pdf) {
                    if (Storage::disk('private')->exists($guia->path_pdf)) {
                        Storage::disk('private')->delete($guia->path_pdf);
                        Log::info('PDF eliminado', ['ruta' => $guia->path_pdf]);
                    }
                }
                if ($guia->imagen_portada) {
                    if (Storage::disk('public')->exists($guia->imagen_portada)) {
                        Storage::disk('public')->delete($guia->imagen_portada);
                        Log::info('Imagen eliminada', ['ruta' => $guia->imagen_portada]);
                    }
                }

                // Eliminar tags si existen
                if ($guia->tags()->exists()) {
                    $guia->tags()->detach();
                }

                // Hard delete (eliminación permanente)
                $guia->forceDelete();
                return response()->json([
                    'message' => 'Guía eliminada exitosamente'
                ]);
            } catch (\Exception $e) {
                Log::error('Error al eliminar guía: ' . $e->getMessage(), ['exception' => $e]);
                return response()->json([
                    'message' => 'Error al eliminar la guía',
                    'error' => $e->getMessage()
                ], 500);
            }
        }

        /**
         * Obtener tags más usados del orientador
         * GET /api/guias/palabras-clave
         */
        public function getPalabrasClaves(): JsonResponse {
            try {
                /** @var Usuario $user */
                $user = Auth::user();
                Log::info('Obteniendo tags más usados', ['user_id' => $user->id]);

                if (!$user->tieneRol('orientador')) {
                    Log::error('No autorizado: usuario no es orientador');
                    return response()->json([
                        'message' => 'No autorizado',
                        'error' => 'Solo orientadores pueden acceder'
                    ], 403);
                }

                // Obtener tags más usados en las guías publicadas del orientador
                $tags = Tags::whereHas('guias', function ($query) use ($user) {
                    $query->where('usuario_id', $user->id)->where('esta_publicado', true);
                })->withCount(['guias' => function ($query) use ($user) {
                    $query->where('usuario_id', $user->id)->where('esta_publicado', true);
                }])->orderByDesc('guias_count')->limit(5)->pluck('nombre')->toArray();

                Log::info('Tags más usados obtenidos correctamente', ['total' => count($tags)]);
                return response()->json([
                    'palabras_clave' => $tags
                ]);
            } catch (\Exception $e) {
                Log::error('Error obteniendo tags más usados: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Error al obtener tags',
                    'error' => $e->getMessage()
                ], 500);
            }
        }
    }
?>
