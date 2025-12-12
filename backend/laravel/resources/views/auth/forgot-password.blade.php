@extends('layouts.app')

@section('content')
<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-6">
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">Recuperar Contraseña</h5>
                </div>
                <div class="card-body">
                    <form method="POST" action="{{ route('password.email') }}">
                        @csrf

                        <div class="mb-3">
                            <label for="email" class="form-label">Correo Electrónico</label>
                            <input type="email" class="form-control @error('email') is-invalid @enderror" 
                                   id="email" name="email" value="{{ old('email') }}" required autofocus>
                            @error('email')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        <p class="text-muted small">
                            Ingresa el email asociado a tu cuenta y te enviaremos un enlace para recuperar tu contraseña.
                        </p>

                        <button type="submit" class="btn btn-primary w-100">Enviar Enlace de Recuperación</button>
                    </form>

                    <hr>
                    <p class="text-center">
                        <a href="{{ route('login') }}">Volver a Iniciar Sesión</a>
                    </p>
                </div>
            </div>

            @if (session('status'))
                <div class="alert alert-success mt-3" role="alert">
                    {{ session('status') }}
                </div>
            @endif
        </div>
    </div>
</div>
@endsection
