@extends('layouts.app')

@section('title', 'Verificación fallida')

@section('content')
  <div class="container py-5">
    <div class="card mx-auto" style="max-width:800px;">
      <div class="card-body text-center">
        <h1 class="h3 mb-3">Verificación fallida</h1>
        <p class="mb-4">{{ $message ?? 'No ha sido posible verificar la dirección. El enlace puede estar caducado o ser inválido.' }}</p>
        <a href="{{ route('login') }}" class="btn btn-secondary">Iniciar sesión</a>
        <a href="{{ url('/password/reset') }}" class="btn btn-link">Solicitar nuevo enlace</a>
      </div>
    </div>
  </div>
@endsection
