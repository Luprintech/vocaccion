<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuevo Contacto desde Web Vocacción</title>
</head>
<body style='margin: 0; padding: 0; font-family: Arial, sans-serif;'>
    <table>
        <tr>
            <td align='center' style='padding: 20px 0;'>
                <table role='presentation' style='width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);'>
                    <tr>
                        <td>
                            <h1 style='margin: 0; font-size: 24px; font-weight: bold;'>Has recibido un nuevo mensaje de contacto</h1>
                        </td>
                    </tr>

                    <tr>
                        <td style='padding: 20px;'>
                            <p style="margin: 0 0 10px 0; color: #666;">Has recibido una nueva solicitud de contacto desde <strong>Vocacción</strong>.</p>
                            <hr style='border: 0; border-top: 2px solid #eeeeee; margin: 10px 0;'/>
                            <p style="margin: 5px 0;"><strong>Nombre:</strong> {{ $data['nombre'] }}</p>
                            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:{{ $data['email'] }}">{{ $data['email'] }}</a></p>
                            <p style="margin: 5px 0;"><strong>Tipo de consulta:</strong> {{ $data['tipoConsulta'] }}</p>
                            <div style='margin-top: 20px;'>
                                <p style='font-weight: bold; margin-bottom: 5px;'>Mensaje:</p>
                                <div style='background-color: #f8f9fa; border-left: 2px solid #007bff; padding: 10px; color: #333;'>
                                    {{ $data['mensaje'] }}
                                </div>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style='background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #999;'>
                            Este correo fue enviado automáticamente desde tu sitio web. <br>
                            Recuerda que puedes responder directamente a este correo para contactar con el usuario.
                        </td>
                    </tr>

                    <tr>
                        <td style='background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #999;'>
                            &copy; {{ date('Y') }} Vocacción. Todos los derechos reservados.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
