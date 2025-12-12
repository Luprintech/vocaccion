<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Cashier\Billable;

class Usuario extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, Billable;

    /**
     * Nombre de la tabla en la base de datos.
     */
    protected $table = 'usuarios';

    /**
     * Los atributos que se pueden asignar masivamente.
     */
    protected $fillable = [
        'nombre',
        'email',
        'password',
        'google_id',
        'profile_image'
    ];

    /**
     * Los atributos que deben ocultarse para la serialización.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Los atributos que deben ser convertidos.
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * Relación uno a uno con el perfil
     */
    public function perfil(): HasOne
    {
        return $this->hasOne(Perfil::class, 'usuario_id');
    }

    /**
     * Crear un perfil vacío para el usuario si no existe
     */
    public function crearPerfilSiNoExiste(): Perfil
    {
        return $this->perfil ?? $this->perfil()->create();
    }

    /**
     * Obtener el perfil completo del usuario
     */
    public function getPerfilCompleto(): ?Perfil
    {
        $perfil = $this->perfil;
        if ($perfil) {
            return $perfil->getPerfilCompleto();
        }
        return null;
    }

    /**
     * Verificar si el usuario tiene perfil completo
     */
    public function tienePerfilCompleto(): bool
    {
        return !empty($this->nombre) && !empty($this->apellidos) && !empty($this->ciudad)
            && !empty($this->dni) && !empty($this->fecha_nacimiento) && !empty($this->telefono);
    }

    /**
     * Relación muchos a muchos con Rol.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Rol::class, 'rol_usuario', 'usuario_id', 'rol_id')->withTimestamps();
    }

    /**
     * Relación uno a muchos con CuentaSocial.
     */
    public function cuentasSociales(): HasMany
    {
        return $this->hasMany(CuentaSocial::class, 'usuario_id');
    }

    /**
     * Relación uno a uno con ObjetivoProfesional.
     */
    public function objetivo(): HasOne
    {
        return $this->hasOne(ObjetivoProfesional::class, 'user_id');
    }

    /**
     * Override the default Cashier subscriptions relationship
     * to use 'user_id' instead of 'usuario_id'.
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(\Laravel\Cashier\Subscription::class, 'user_id');
    }

    /**
     * Verificar si el usuario tiene un rol específico.
     */
    public function tieneRol($rol): bool
    {
        return $this->roles()->where('nombre', $rol)->exists();
    }

    /**
     * Verificar si el usuario tiene alguno de los roles especificados.
     */
    public function tieneAlgunRol($roles): bool
    {
        return $this->roles()->whereIn('nombre', $roles)->exists();
    }
}
