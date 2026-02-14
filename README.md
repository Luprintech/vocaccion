# VocAcción - Plataforma de Orientación Vocacional

Plataforma web de orientación vocacional que utiliza inteligencia artificial para ayudar a estudiantes y adultos a descubrir su camino profesional.

## Sobre el Proyecto

VocAcción es una aplicación web desarrollada como Proyecto Final de Ciclo del CFGS en Desarrollo de Aplicaciones Web del IES Gran Capitán (Córdoba, España). La plataforma combina tecnologías modernas con inteligencia artificial para ofrecer una experiencia de orientación vocacional personalizada y accesible.

### Características Principales

- Test vocacional adaptativo con IA (Gemini 2.0 Flash)
- Generación de itinerarios académicos personalizados por comunidad autónoma
- Sistema de recomendaciones profesionales basado en intereses y habilidades
- Informes descargables en PDF
- Dashboard de métricas para orientadores
- Mapa interactivo de recursos educativos
- Centro de recursos con artículos y guías descargables

## Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- PHP 8.2+
- Composer
- MySQL 8.0+
- XAMPP (recomendado para desarrollo)

### Configuración del Proyecto

#### 1. Clonar el repositorio

```bash
git clone https://github.com/iesgrancapitan-proyectos/202526daw-dam-septiembre-Vocacci-n.git
cd 202526daw-dam-septiembre-Vocacci-n
```

#### 2. Configurar Frontend

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

#### 3. Configurar Backend

```bash
# Navegar al directorio Laravel
cd backend/laravel

# Instalar dependencias PHP
composer install

# Copiar archivo de configuración
cp .env.example .env
```

#### 4. Configurar Base de Datos

Crear la base de datos en MySQL:

```sql
CREATE DATABASE vocaccion;
```

Configurar el archivo `.env` del backend:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=vocaccion
DB_USERNAME=root
DB_PASSWORD=

GEMINI_API_KEY=tu_api_key_de_gemini

PEXELS_API_KEY=tu_api_key_de_pexels
```

Ejecutar migraciones:

```bash
php artisan migrate
```

Crear roles y usuarios de prueba:

```bash
php artisan migrate:refresh --seed
```

Usuarios de prueba creados:

- Estudiante: `estudiante@test.com` / `12345678`
- Orientador: `orientador@test.com` / `12345678`
- Admin: `admin@test.com` / `12345678`

#### 5. Iniciar Backend

```bash
php artisan serve
```

El backend estará disponible en `http://localhost:8000`

## Despliegue

### Frontend

Para generar la versión de producción:

```bash
npm run build
```

Los archivos optimizados se generarán en la carpeta `dist/`.

### Backend

Configurar el servidor web (Apache/Nginx) para apuntar a `backend/laravel/public/`.

Asegurarse de:

- Configurar las variables de entorno en `.env` para producción
- Ejecutar `php artisan config:cache`
- Ejecutar `php artisan route:cache`
- Configurar permisos adecuados para `storage/` y `bootstrap/cache/`

## Contexto Académico

Este proyecto ha sido desarrollado como parte del Módulo de Proyecto Integrado del Ciclo Formativo de Grado Superior en Desarrollo de Aplicaciones Web (DAW) del IES Gran Capitán, Córdoba, España.

Curso académico: 2025-2026

## Licencia

Este proyecto ha sido desarrollado con fines educativos como parte del currículo del Ciclo Formativo DAW del IES Gran Capitán.

Todos los derechos reservados al equipo de desarrollo y al IES Gran Capitán.

