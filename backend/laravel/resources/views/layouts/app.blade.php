<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ $title ?? config('app.name', 'Laravel') }}</title>

        {{-- Vite / compiled assets when available --}}
        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @endif
    </head>
    <body class="bg-[#FDFDFC] dark:bg-[#0a0a0a] text-[#1b1b18] min-h-screen flex items-center justify-center p-6">
        <div class="w-full max-w-3xl">
            <header class="mb-6">
                @if (Route::has('login'))
                    <nav class="flex items-center justify-end gap-4">
                        @auth
                            <a href="{{ url('/dashboard') }}" class="px-4 py-1 text-sm rounded-sm bg-[#1b1b18] text-white">Dashboard</a>
                        @else
                            <a href="{{ route('login') }}" class="px-4 py-1 text-sm">Log in</a>
                            @if (Route::has('register'))
                                <a href="{{ route('register') }}" class="px-4 py-1 text-sm">Register</a>
                            @endif
                        @endauth
                    </nav>
                @endif
            </header>

            <main>
                @yield('content')
            </main>

            <footer class="mt-6 text-center text-sm text-[#706f6c]">
                &copy; {{ date('Y') }} {{ config('app.name', 'Laravel') }}
            </footer>
        </div>
    </body>
</html>
