<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Usuario;

class SubscriptionController extends Controller
{
    /**
     * Create a Stripe Checkout session.
     * 
     * Flow:
     * 1. Verify user is authenticated
     * 2. Check if user already has an active subscription
     * 3. If active, return portal URL instead
     * 4. If no subscription, create new checkout session
     */
    public function checkout(Request $request)
    {
        $request->validate([
            'price_id' => 'required|string|regex:/^price_/',
        ]);

        $user = $request->user();

        // Check if user has 'estudiante' role
        if (!$user->tieneRol('estudiante')) {
            return response()->json([
                'success' => false,
                'message' => 'Solo los estudiantes pueden suscribirse.'
            ], 403);
        }

        // ===== DUPLICATE PREVENTION =====
        // Check if user already has an active subscription
        if ($user->subscribed('default')) {
            $activeSubscription = $user->subscription('default');

            // Return portal URL so they can manage their subscription
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            return response()->json([
                'success' => false,
                'status' => 'already_subscribed',
                'message' => 'Ya tienes una suscripción activa. Usa el portal de facturación para gestionar tu suscripción.',
                'portalUrl' => $user->billingPortalUrl($frontendUrl . '/estudiante/dashboard'),
                'currentPlan' => $activeSubscription->stripe_price,
                'subscription_status' => $activeSubscription->stripe_status,
            ], 409);
        }

        // ===== CREATE CHECKOUT SESSION =====
        try {
            // Ensure user has a Stripe customer ID
            if (!$user->stripe_id) {
                $user->createAsStripeCustomer();
            }

            // Create the checkout session
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            $checkout = $user->newSubscription('default', $request->price_id)
                ->checkout([
                    'success_url' => $frontendUrl . '/?payment=success',
                    'cancel_url' => $frontendUrl . '/pricing?subscription=canceled',
                ]);

            return response()->json([
                'success' => true,
                'url' => $checkout->url,
                'sessionId' => $checkout->id,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Checkout error', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al crear la sesión de checkout. Por favor, intenta de nuevo.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate a Stripe Billing Portal URL.
     * This allows users to manage their subscription, update payment method, etc.
     */
    public function portal(Request $request)
    {
        $user = $request->user();

        if (!$user->stripe_id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes una suscripción activa.'
            ], 400);
        }

        try {
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            $portalUrl = $user->billingPortalUrl($frontendUrl . '/estudiante/dashboard');

            return response()->json([
                'success' => true,
                'url' => $portalUrl,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Portal URL error', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al generar el portal de facturación.',
            ], 500);
        }
    }

    /**
     * Cancel subscription and delete account.
     * This is a destructive operation - user will be deleted permanently.
     */
    public function destroy(Request $request)
    {
        $user = $request->user();

        try {
            // Cancel subscription immediately if exists
            if ($user->subscription('default')) {
                $user->subscription('default')->cancelNow();
            }

            // Delete the user (this will cascade to related data)
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'Cuenta y suscripción eliminadas exitosamente.'
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Account deletion error', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la cuenta.',
            ], 500);
        }
    }

    /**
     * Get user's subscription status.
     * Useful for frontend to determine what UI to show.
     */
    /**
     * Get user's subscription status.
     * Useful for frontend to determine what UI to show.
     */
    public function status(Request $request)
    {
        $user = $request->user();

        // 1. Check custom 'suscripciones' table first
        $localSub = \Illuminate\Support\Facades\DB::table('suscripciones')
            ->where('usuario_id', $user->id)
            ->where('estado', 'activa')
            ->first();

        if ($localSub) {
            return response()->json([
                'subscribed' => in_array($localSub->tipo_plan, ['pro', 'pro_plus']),
                'plan' => $localSub->tipo_plan,
                'status' => $localSub->estado,
                'renews_at' => $localSub->fecha_fin,
                'ends_at' => $localSub->fecha_fin,
                'on_trial' => false,
                'canceled' => false,
                'past_due' => false,
            ]);
        }

        // 2. Fallback to Stripe (Laravel Cashier)
        if (!$user->subscribed('default')) {
            return response()->json([
                'subscribed' => false,
                'message' => 'No tienes suscripción activa.',
            ]);
        }

        $subscription = $user->subscription('default');

        return response()->json([
            'subscribed' => true,
            'plan' => $subscription->stripe_price,
            'status' => $subscription->stripe_status,
            'renews_at' => $subscription->renews_at,
            'ends_at' => $subscription->ends_at,
            'on_trial' => $subscription->onTrial(),
            'canceled' => $subscription->canceled(),
            'past_due' => $subscription->pastDue(),
        ]);
    }

    /**
     * Get updated subscription details for the "My Subscription" page.
     * Returns: current_plan_name, status, renews_at, is_premium
     */
    public function details(Request $request)
    {
        $user = $request->user();

        // 1. Check custom 'suscripciones' table
        $localSub = \Illuminate\Support\Facades\DB::table('suscripciones')
            ->where('usuario_id', $user->id)
            ->where('estado', 'activa')
            ->first();

        // Logic for custom table
        if ($localSub) {
            $planMap = [
                'gratuito' => 'Gratuito',
                'pro' => 'Plan Pro',
                'pro_plus' => 'Plan Pro Plus',
                'Pro Plus' => 'Plan Pro Plus'
            ];

            $planName = $planMap[$localSub->tipo_plan] ?? ucfirst($localSub->tipo_plan);
            $isPremium = in_array($localSub->tipo_plan, ['pro', 'pro_plus', 'Pro Plus']);

            return response()->json([
                'is_premium' => $isPremium,
                'current_plan_name' => $planName,
                'status' => 'active', // Simulamos siempre activo si está en DB con estado 'activa'
                'renews_at' => $localSub->fecha_fin,
            ]);
        }

        // 2. Fallback to Stripe Logic (Original)
        $isPremium = $user->subscribed('default');
        $subscription = $isPremium ? $user->subscription('default') : null;

        // Plan Name Logic
        $planName = 'Gratuito';
        if ($isPremium && $subscription) {
            $priceId = $subscription->stripe_price;

            // Compare against environment variables
            if ($priceId === env('STRIPE_PRICE_PRO')) {
                $planName = 'Plan Pro';
            } elseif ($priceId === env('STRIPE_PRICE_PRO_PLUS')) {
                $planName = 'Plan Pro Plus';
            } else {
                $planName = 'Plan Premium';
            }
        }

        // Date Handling
        $renewsAt = null;
        if ($subscription) {
            if ($subscription->ends_at) {
                $renewsAt = $subscription->ends_at->format('Y-m-d');
            }
        }

        return response()->json([
            'is_premium' => $isPremium,
            'current_plan_name' => $planName,
            'status' => $subscription ? $subscription->stripe_status : 'free',
            'renews_at' => $renewsAt,
        ]);
    }
}
