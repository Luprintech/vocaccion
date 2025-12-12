FROM php:8.2-fpm

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    git zip unzip libpq-dev libonig-dev libxml2-dev curl

# Extensiones PHP necesarias
RUN docker-php-ext-install pdo pdo_pgsql mbstring xml

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Crear directorio de la app
WORKDIR /var/www/html

# Copiar el código al contenedor
COPY . .

# Instalar dependencias de Laravel
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Render usa este puerto
EXPOSE 10000

# Comando al arrancar el contenedor
CMD php artisan migrate --force && \
    php artisan config:clear && \
    php artisan serve --host=0.0.0.0 --port=$PORT
