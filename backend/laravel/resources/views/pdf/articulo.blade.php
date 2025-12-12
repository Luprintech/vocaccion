<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $articulo['titulo'] }} - VocAcción</title>
    <style>
        @page {
            margin: 60px 50px;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            line-height: 1.6;
            color: #374151;
            /* gray-700 */
            background-color: #ffffff;
            font-size: 14px;
        }

        /* Contenedor principal */
        .container {
            width: 100%;
            margin: 0 auto;
        }

        /* Header Principal del Documento */
        .main-header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
        }

        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #7e22ce;
            /* purple-700 */
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .categoria-badge {
            display: inline-block;
            background-color: #f3e8ff;
            /* purple-100 */
            color: #7e22ce;
            /* purple-700 */
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 15px;
            border: 1px solid #d8b4fe;
        }

        .titulo {
            font-size: 28px;
            line-height: 1.2;
            font-weight: bold;
            color: #111827;
            /* gray-900 */
            margin-bottom: 15px;
        }

        .descripcion {
            font-size: 16px;
            color: #4b5563;
            /* gray-600 */
            margin-bottom: 25px;
            max-width: 90%;
            margin-left: auto;
            margin-right: auto;
        }

        /* Metadatos */
        .meta-table {
            width: 100%;
            margin-top: 20px;
            border-collapse: collapse;
        }

        .meta-table td {
            text-align: center;
            width: 33%;
            vertical-align: top;
        }

        .meta-label {
            font-size: 10px;
            text-transform: uppercase;
            color: #9ca3af;
            /* gray-400 */
            font-weight: bold;
            margin-bottom: 4px;
            display: block;
        }

        .meta-value {
            font-size: 12px;
            color: #374151;
            /* gray-700 */
            font-weight: bold;
        }

        /* Bloques de Contenido */
        .content {
            margin-top: 20px;
        }

        /* Reglas de Paginación */
        .bloque {
            margin-bottom: 30px;
            page-break-inside: avoid;
            /* EVITAR CORTES INTERNOS */
        }

        /* Intro */
        .intro {
            font-size: 15px;
            color: #4b5563;
            margin-bottom: 30px;
            text-align: justify;
        }

        /* Sección */
        .seccion-header {
            margin-bottom: 15px;
            border-bottom: 1px solid #f3f4f6;
            padding-bottom: 8px;
        }

        .seccion-titulo {
            font-size: 20px;
            color: #7e22ce;
            /* purple-700 */
            font-weight: bold;
        }

        .seccion-numero {
            color: #d1d5db;
            /* gray-300 */
            font-size: 24px;
            margin-right: 10px;
            font-weight: 900;
        }

        .seccion-contenido {
            text-align: justify;
            color: #374151;
        }

        /* Alerta / Nota */
        .alerta {
            background-color: #fffbeb;
            /* amber-50 */
            border-left: 4px solid #f59e0b;
            /* amber-500 */
            padding: 15px 20px;
            border-radius: 4px;
        }

        .alerta-titulo {
            color: #b45309;
            /* amber-700 */
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 15px;
        }

        .alerta-texto {
            color: #b45309;
            font-size: 13px;
        }

        /* Comparativa / Tablas */
        .comparativa {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 25px;
        }

        .comparativa-header {
            background-color: #f9fafb;
            padding: 12px 15px;
            border-bottom: 1px solid #e5e7eb;
            font-weight: bold;
            color: #111827;
            font-size: 16px;
        }

        .comparativa-body {
            padding: 15px;
        }

        .list-group {
            margin-bottom: 10px;
        }

        .list-title {
            font-size: 12px;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 8px;
            display: block;
        }

        .ventajas-title {
            color: #059669;
        }

        /* emerald-600 */
        .desventajas-title {
            color: #dc2626;
        }

        /* red-600 */

        .check-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .check-list li {
            position: relative;
            padding-left: 20px;
            margin-bottom: 6px;
            font-size: 13px;
            color: #4b5563;
        }

        .check-list li:before {
            position: absolute;
            left: 0;
            font-weight: bold;
        }

        .check-list.pros li:before {
            content: "+";
            color: #059669;
        }

        .check-list.cons li:before {
            content: "-";
            color: #dc2626;
        }

        /* Recomendación */
        .recomendacion {
            background-color: #f3e8ff;
            /* purple-100 */
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            border: 1px solid #d8b4fe;
        }

        .recomendacion-titulo {
            color: #6b21a8;
            /* purple-800 */
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 8px;
        }

        .recomendacion-contenido {
            color: #6b21a8;
            font-style: italic;
        }

        /* Fuentes */
        .fuentes {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            page-break-inside: avoid;
        }

        .fuentes h3 {
            font-size: 14px;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 15px;
        }

        .fuente-item {
            font-size: 12px;
            margin-bottom: 8px;
            color: #6b7280;
        }

        .fuente-link {
            color: #7e22ce;
            text-decoration: none;
        }

        /* Footer */
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
    </style>
</head>

<body>
    <div class="container">
        <!-- Header Principal -->
        <div class="main-header">
            <div class="logo">VocAcción</div>
            <div class="categoria-badge">{{ $articulo['categoria'] }}</div>
            <h1 class="titulo">{{ $articulo['titulo'] }}</h1>
            <p class="descripcion">{{ $articulo['descripcion'] }}</p>

            <table class="meta-table">
                <tr>
                    <td>
                        <span class="meta-label">AUTOR</span>
                        <div class="meta-value">{{ $articulo['autor'] }}</div>
                    </td>
                    <td>
                        <span class="meta-label">FECHA</span>
                        <div class="meta-value">{{ $articulo['fecha'] }}</div>
                    </td>
                    <td>
                        <span class="meta-label">TIEMPO LECTURA</span>
                        <div class="meta-value">{{ $articulo['tiempo_lectura'] }}</div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Contenido -->
        <div class="content">
            @foreach($articulo['contenido'] as $bloque)

                @if($bloque['tipo'] === 'intro')
                    <div class="bloque intro">
                        <p>{{ $bloque['texto'] }}</p>
                    </div>

                @elseif($bloque['tipo'] === 'alerta')
                    <div class="bloque alerta">
                        <div class="alerta-titulo">{{ $bloque['titulo'] }}</div>
                        <div class="alerta-texto">{{ $bloque['texto'] }}</div>
                    </div>

                @elseif($bloque['tipo'] === 'texto_libre')
                    <div class="bloque seccion">
                        <div class="seccion-contenido" style="white-space: pre-wrap;">{{ $bloque['contenido'] }}</div>
                    </div>

                @elseif($bloque['tipo'] === 'seccion')
                    <div class="bloque seccion">
                        <div class="seccion-header">
                            <span class="seccion-numero">{{ $bloque['numero'] }}</span>
                            <span class="seccion-titulo">{{ $bloque['titulo'] }}</span>
                        </div>
                        <div class="seccion-contenido">
                            <p>{{ $bloque['contenido'] }}</p>
                        </div>
                    </div>

                @elseif($bloque['tipo'] === 'comparativa')
                    <div class="bloque comparativa">
                        <div class="comparativa-header">{{ $bloque['titulo'] }}</div>
                        <div class="comparativa-body">
                            @if(isset($bloque['ventajas']))
                                <div class="list-group">
                                    <span class="list-title ventajas-title">Ventajas</span>
                                    <ul class="check-list pros">
                                        @foreach($bloque['ventajas'] as $ventaja)
                                            <li>{{ $ventaja }}</li>
                                        @endforeach
                                    </ul>
                                </div>
                            @endif

                            @if(isset($bloque['desventajas']))
                                <div class="list-group" style="margin-top: 15px;">
                                    <span class="list-title desventajas-title">Desventajas</span>
                                    <ul class="check-list cons">
                                        @foreach($bloque['desventajas'] as $desventaja)
                                            <li>{{ $desventaja }}</li>
                                        @endforeach
                                    </ul>
                                </div>
                            @endif
                        </div>
                    </div>

                @elseif($bloque['tipo'] === 'recomendacion')
                    <div class="bloque recomendacion">
                        <div class="recomendacion-titulo">{{ $bloque['titulo'] }}</div>
                        <div class="recomendacion-contenido">"{{ $bloque['contenido'] }}"</div>
                    </div>

                @elseif($bloque['tipo'] === 'fuentes')
                    <div class="bloque fuentes">
                        <h3>Fuentes y Referencias</h3>
                        @foreach($bloque['items'] as $fuente)
                            <div class="fuente-item">
                                <strong>{{ $fuente['nombre'] }}</strong> - {{ $fuente['descripcion'] }} <br>
                                @if(isset($fuente['url']))
                                    <a href="{{ $fuente['url'] }}" class="fuente-link">{{ $fuente['url_texto'] ?? $fuente['url'] }}</a>
                                @endif
                            </div>
                        @endforeach
                    </div>

                @endif

            @endforeach
        </div>

        <div class="footer">
            <p><strong>VocAcción</strong> - Tu futuro profesional comienza aquí</p>
            <p style="margin-top:5px;">© {{ date('Y') }} Todos los derechos reservados</p>
        </div>
    </div>
</body>

</html>