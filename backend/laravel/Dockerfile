FROM php:8.2-cli

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    git zip unzip curl libzip-dev libpq-dev libonig-dev libxml2-dev libpng-dev

# Instalar extensiones PHP requeridas por Laravel
RUN docker-php-ext-install pdo pdo_pgsql mbstring zip xml gd bcmath

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copiar archivos
COPY . .

# Instalar dependencias de Laravel
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Cachear config (si falla, continuar)
RUN php artisan config:cache || true
RUN php artisan route:cache || true

EXPOSE ${PORT}

CMD php artisan migrate --force && \
    php artisan serve --host=0.0.0.0 --port=$PORT
