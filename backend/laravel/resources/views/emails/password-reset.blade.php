<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperar Contraseña - Vocacción</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #7c3aed;
        }
        .content {
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            background-color: #7c3aed;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            color: #856404;
            padding: 12px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .link-text {
            word-break: break-all;
            color: #7c3aed;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎓 Vocacción</div>
            <h2>Recuperar Contraseña</h2>
        </div>

        <div class="content">
            <p>Hola <strong>{{ $usuario->nombre }}</strong>,</p>

            <p>Hemos recibido una solicitud para recuperar la contraseña de tu cuenta en Vocacción.</p>

            <p>Haz clic en el botón de abajo para establecer una nueva contraseña:</p>

            <div style="text-align: center;">
                <a href="{{ $resetUrl }}" class="button">Recuperar Contraseña</a>
            </div>

            <p>O copia y pega este enlace en tu navegador:</p>
            <p class="link-text">{{ $resetUrl }}</p>

            <div class="warning">
                <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por tu seguridad.
            </div>

            <p>Si no solicitaste recuperar tu contraseña, puedes ignorar este email de forma segura.</p>

            <p>Saludos,<br><strong>El equipo de Vocacción</strong></p>
        </div>

        <div class="footer">
            <p>Este es un email automatizado. No respondas a este mensaje.</p>
            <p>&copy; 2025 Vocacción. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
