@extends('layouts.app')

@section('title', 'Correo verificado')

@section('content')
  <div class="container py-5">
    <div class="card mx-auto" style="max-width:800px;">
      <div class="card-body text-center">
        <h1 class="h3 mb-3">Correo verificado</h1>
        <p class="mb-4">{{ $message ?? 'Tu dirección de correo ha sido verificada correctamente. Gracias por confirmar.' }}</p>
        <a href="{{ url('/') }}" class="btn btn-primary">Ir al inicio</a>
        <a href="{{ route('login') }}" class="btn btn-secondary ml-2">Iniciar sesión</a>
      </div>
    </div>
  </div>
@endsection
