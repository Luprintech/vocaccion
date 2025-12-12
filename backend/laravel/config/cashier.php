<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cashier Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Laravel Cashier (Stripe integration)
    |
    */

    'key' => env('STRIPE_KEY'),
    'secret' => env('STRIPE_SECRET'),

    'currency' => env('CASHIER_CURRENCY', 'eur'),

    'currency_locale' => env('CASHIER_CURRENCY_LOCALE'),

    'stripe_model' => env('STRIPE_MODEL', 'App\\Models\\Usuario'),

    'path' => env('CASHIER_PATH', 'stripe'),

    'webhook' => [
        'secret' => env('STRIPE_WEBHOOK_SECRET'),
        'tolerance' => env('STRIPE_WEBHOOK_TOLERANCE', 300),
    ],

];
