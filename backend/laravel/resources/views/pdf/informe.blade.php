<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Itinerario Vocacional: {{ $data['profesion_titulo'] }}</title>
    <style>
        @page {
            margin: 0cm 0cm;
        }

        body {
            font-family: 'Helvetica', sans-serif;
            color: #1f2937;
            line-height: 1.5;
            margin-top: 4cm;
            margin-bottom: 2cm;
            margin-left: 2cm;
            margin-right: 2cm;
        }



        /* Header Decorativo */
        .header-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 2.5cm;
            background: rgb(124, 58, 237);
            background: linear-gradient(90deg, rgba(124, 58, 237, 1) 0%, rgba(16, 185, 129, 1) 100%);
            color: white;
            padding-top: 0.5cm;
            padding-left: 2cm;
        }

        .logo {
            font-size: 24px;
            font-weight: bold;
            color: white;
            text-transform: uppercase;
        }

        .subtitle {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.9);
            margin-top: 2px;
        }

        /* Footer */
        .footer {
            position: fixed;
            bottom: 0px;
            left: 0px;
            right: 0px;
            height: 50px;
            text-align: center;
            line-height: 35px;
            font-size: 10px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            background-color: white;
        }

        /* Estilos Generales */
        h1,
        h2,
        h3,
        h4 {
            color: #4c1d95;
        }

        .main-title {
            font-size: 26px;
            margin-bottom: 15px;
            color: #5b21b6;
        }

        .section {
            margin-bottom: 30px;
        }

        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #4b5563;
            border-bottom: 2px solid #ddd6fe;
            padding-bottom: 8px;
            margin-bottom: 15px;
            display: inline-block;
        }

        /* Tarjeta de Usuario */
        .user-info {
            background-color: #f5f3ff;
            border: 1px solid #ddd6fe;
            padding: 15px;
            border-radius: 12px;
            margin-bottom: 30px;
            font-size: 13px;
        }

        /* Tarjetas de Vías */
        .via-card {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            background-color: #fff;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            page-break-after: always;
        }

        .via-card:last-child {
            page-break-after: auto;
        }

        .via-title {
            font-weight: bold;
            color: #7c3aed;
            font-size: 18px;
            margin-bottom: 8px;
            border-bottom: 1px solid #f3f4f6;
            padding-bottom: 5px;
        }

        /* Pasos */
        .step-list {
            list-style-type: none;
            padding: 0;
            margin-top: 15px;
        }

        .step-item {
            margin-bottom: 12px;
            padding-left: 15px;
            border-left: 3px solid #10b981;
            /* Verde VocAccion */
            background: #f9fafb;
            padding: 10px;
            border-radius: 0 8px 8px 0;
        }

        .step-number {
            font-weight: bold;
            font-size: 11px;
            color: #059669;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Habilidades (Badges) */
        .badges {
            margin-top: 10px;
        }

        .badge {
            display: inline-block;
            background: #ede9fe;
            color: #5b21b6;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            margin-right: 5px;
            margin-bottom: 5px;
            font-weight: bold;
        }

        /* Recomendaciones (Salto de Página forzado) */
        .page-break-before {
            page-break-before: always;
        }

        .recommendations-box {
            background-color: #ecfdf5;
            border: 1px solid #a7f3d0;
            border-radius: 12px;
            padding: 20px;
        }

        .rec-item {
            margin-bottom: 8px;
            font-size: 13px;
        }

        /* Consejo Final */
        .final-quote {
            background: linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%);
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            border: 1px solid #f0abfc;
            margin-top: 30px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        }

        .img-container {
            margin-bottom: 25px;
            text-align: center;
        }

        .img-profesion {
            max-width: 100%;
            max-height: 250px;
            border-radius: 12px;
            border: 4px solid white;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
    </style>
</head>

<body>
    <!-- Header Fijo -->
    <div class="header-bg">
        <div class="logo">VocAcción</div>
        <div class="subtitle">Informe de Itinerario Académico Personalizado</div>
    </div>

    <!-- Footer Fijo -->
    <div class="footer">
        Generado por VocAcción · Tu futuro profesional empieza aquí
    </div>

    <div class="user-info">
        <table style="width: 100%;">
            <tr>
                <td style="width: 60%;">
                    <strong>Estudiante:</strong> <span style="color: #4b5563;">{{ $data['user_name'] }}</span>
                </td>
                <td style="width: 40%; text-align: right;">
                    <strong>Fecha:</strong> {{ $data['date'] }}
                </td>
            </tr>
            <tr>
                <td colspan="2" style="padding-top: 8px;">
                    <strong>Perfil:</strong> <span style="color: #7c3aed; font-weight: bold;">{{ $data['area'] }}</span>
                    <span style="color: #9ca3af;">&gt;</span> {{ $data['subarea'] }}
                </td>
            </tr>
        </table>
    </div>

    <!-- PROFESIÓN PRINCIPAL -->
    <div class="section">
        <h1 class="main-title">{{ $data['profesion_titulo'] }}</h1>

        @if(!empty($data['image']))
            <div class="img-container">
                <img src="{{ $data['image'] }}" class="img-profesion">
            </div>
        @endif

        <p style="font-size: 14px; color: #374151;">{{ $data['resumen'] }}</p>
    </div>

    <!-- ANÁLISIS PERFIL -->
    <div class="section page-break-before">
        <div class="section-title">Análisis de Afinidad</div>
        <p
            style="font-size: 13px; color: #555; background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #7c3aed;">
            {{ $data['analysis'] }}
        </p>
    </div>

    <!-- VÍAS FORMATIVAS -->
    <div class="section page-break-before">
        <div class="section-title">Ruta Formativa Sugerida</div>
        @foreach($data['vias_formativas'] as $via)
            <div class="via-card">
                <div class="via-title">{{ $via['nombre_via'] ?? ($via['titulo'] ?? 'Vía Formativa') }}</div>
                <p style="font-size: 13px; margin-bottom: 15px; color: #4b5563;">{{ $via['descripcion'] }}</p>

                @if(isset($via['pasos']) && count($via['pasos']) > 0)
                    <div style="font-size: 12px; font-weight: bold; color: #6b7280; text-transform: uppercase;">Pasos clave a
                        seguir:</div>
                    <ul class="step-list">
                        @foreach($via['pasos'] as $paso)
                            <li class="step-item">
                                <div class="step-number">PASO {{ $paso['orden'] ?? $loop->iteration }}</div>
                                <div style="font-weight: bold; color: #1f2937; margin-bottom: 2px;">{{ $paso['titulo'] }}</div>
                                <div style="font-size: 12px; color: #4b5563;">{{ $paso['descripcion'] }}</div>
                                @if(isset($paso['opciones']) && count($paso['opciones']) > 0)
                                    <div style="margin-top: 4px; font-size: 11px; color: #7c3aed;">
                                        <em>Opciones: {{ implode(', ', array_column($paso['opciones'], 'nombre')) }}</em>
                                    </div>
                                @endif
                            </li>
                        @endforeach
                    </ul>
                @endif
            </div>
        @endforeach
    </div>

    <!-- HABILIDADES -->
    <div class="section page-break-before">
        <div class="section-title">Habilidades Clave</div>
        <div class="badges">
            @foreach($data['habilidades'] as $skill)
                <span class="badge">{{ is_array($skill) ? ($skill['nombre'] ?? $skill) : $skill }}</span>
            @endforeach
        </div>
    </div>

    <!-- RECOMENDACIONES (NUEVA PÁGINA) -->
    @if(count($data['recomendaciones']) > 0)
        <div class="section page-break-before">
            <div class="section-title">Recomendaciones Estratégicas</div>
            <div class="recommendations-box">
                <ul style="padding-left: 20px; color: #065f46;">
                    @foreach($data['recomendaciones'] as $rec)
                        <li class="rec-item">
                            @if(is_array($rec))
                                <strong>{{ $rec['titulo'] ?? 'Consejo' }}:</strong> <span
                                    style="color: #374151;">{{ $rec['descripcion'] ?? '' }}</span>
                            @else
                                {{ $rec }}
                            @endif
                        </li>
                    @endforeach
                </ul>
            </div>
        </div>
    @endif

    <!-- CONSEJO FINAL -->
    @if(!empty($data['consejo']))
        <div class="final-quote">
            <strong style="color: #db2777; font-size: 16px; display: block; margin-bottom: 10px;">Consejo Final</strong>
            <p style="margin: 0; font-style: italic; font-size: 14px; color: #555;">"{{ $data['consejo'] }}"</p>
        </div>
    @endif

</body>

</html>