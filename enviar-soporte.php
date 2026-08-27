<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
    exit;
}

$datos = json_decode(file_get_contents('php://input'), true);

$asunto = str_replace(["\r", "\n"], '', trim($datos['asunto'] ?? ''));
$mensaje = trim($datos['mensaje'] ?? '');
$correoUsuario = trim($datos['correo'] ?? '');
$trampa = trim($datos['sitio_web'] ?? ''); // honeypot anti-spam

if ($trampa !== '') {
    echo json_encode(['ok' => true]);
    exit;
}

if ($asunto === '' || $mensaje === '' || $correoUsuario === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Falta el asunto, el mensaje o el correo']);
    exit;
}

if (!filter_var($correoUsuario, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'El correo no es válido']);
    exit;
}

$remitente = 'soporte@controlasistencia.co';

// --- 1. Notificación al equipo de soporte ---
$asuntoSoporte = 'Soporte ControlAsist: ' . $asunto;
$cuerpoSoporte = "Mensaje recibido desde el formulario de soporte:\n\n" . $mensaje .
    "\n\nCorreo de contacto del usuario: " . $correoUsuario;
$encabezadosSoporte = 'From: ' . $remitente . "\r\n" .
    'Reply-To: ' . $correoUsuario . "\r\n" .
    'Content-Type: text/plain; charset=UTF-8';

$envioSoporte = mail($remitente, $asuntoSoporte, $cuerpoSoporte, $encabezadosSoporte, '-f' . $remitente);

// --- 2. Respuesta automática al usuario ---
$asuntoUsuario = 'Recibimos tu mensaje — ControlAsist';
$cuerpoUsuario = "Hola,\n\nRecibimos tu mensaje sobre \"" . $asunto . "\" y nuestro equipo de soporte lo va a revisar pronto.\n\n" .
    "Tu mensaje:\n" . $mensaje .
    "\n\nSi necesitas agregar algo más, puedes responder directamente a este correo.\n\nEquipo de ControlAsist";
$encabezadosUsuario = 'From: ' . $remitente . "\r\n" .
    'Reply-To: ' . $remitente . "\r\n" .
    'Content-Type: text/plain; charset=UTF-8';

mail($correoUsuario, $asuntoUsuario, $cuerpoUsuario, $encabezadosUsuario, '-f' . $remitente);

if ($envioSoporte) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'No se pudo enviar el correo']);
}
