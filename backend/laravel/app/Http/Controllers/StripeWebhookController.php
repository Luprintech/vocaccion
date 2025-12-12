<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Usuario;
use Laravel\Cashier\Payment;

class StripeWebhookController extends Controller
{
    /**
     * Handle Stripe webhook events.
     * This endpoint should be registered in Stripe dashboard with your webhook URL.
     * 
     * Example Stripe CLI command:
     * stripe listen --forward-to localhost:8000/stripe/webhook --events customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.payment_succeeded,invoice.payment_failed,charge.refunded
     */
    public function handleWebhook(Request $request)
    {
        $payload = $request->getContent();
        $sig_header = $request->header('Stripe-Signature');
        $webhook_secret = config('cashier.webhook.secret') ?? env('STRIPE_WEBHOOK_SECRET');

        try {
            // Verify the webhook signature to ensure it came from Stripe
            $event = \Stripe\Webhook::constructEvent(
                $payload,
                $sig_header,
                $webhook_secret
            );
        } catch (\UnexpectedValueException $e) {
            Log::error('Invalid Stripe webhook payload', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Invalid payload'], 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            Log::error('Invalid Stripe webhook signature', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Invalid signature'], 403);
        }

        Log::info('Stripe webhook received', ['event_type' => $event->type, 'event_id' => $event->id]);

        // Route the event to the appropriate handler
        switch ($event->type) {
            // ============ CUSTOMER EVENTS ============
            case 'customer.created':
                $this->handleCustomerCreated($event->data->object);
                break;

            case 'customer.deleted':
                $this->handleCustomerDeleted($event->data->object);
                break;

            // ============ SUBSCRIPTION EVENTS ============
            case 'customer.subscription.created':
                $this->handleSubscriptionCreated($event->data->object);
                break;

            case 'customer.subscription.updated':
                $this->handleSubscriptionUpdated($event->data->object);
                break;

            case 'customer.subscription.deleted':
                $this->handleSubscriptionDeleted($event->data->object);
                break;

            // ============ INVOICE EVENTS ============
            case 'invoice.payment_succeeded':
                $this->handleInvoicePaymentSucceeded($event->data->object);
                break;

            case 'invoice.payment_failed':
                $this->handleInvoicePaymentFailed($event->data->object);
                break;

            case 'invoice.finalized':
                $this->handleInvoiceFinalized($event->data->object);
                break;

            // ============ CHARGE EVENTS ============
            case 'charge.refunded':
                $this->handleChargeRefunded($event->data->object);
                break;

            case 'charge.dispute.created':
                $this->handleChargeDispute($event->data->object);
                break;

            default:
                Log::info('Unhandled Stripe webhook event', ['type' => $event->type]);
        }

        return response()->json(['status' => 'success'], 200);
    }

    /**
     * Handle customer.created event
     */
    private function handleCustomerCreated($customer)
    {
        Log::info('Customer created in Stripe', ['customer_id' => $customer->id]);
        // Customer was created in Stripe - they might be synced through Cashier already
    }

    /**
     * Handle customer.deleted event
     */
    private function handleCustomerDeleted($customer)
    {
        Log::warning('Customer deleted in Stripe', ['customer_id' => $customer->id]);
        
        // Find the user by Stripe ID and clear it
        $user = Usuario::where('stripe_id', $customer->id)->first();
        if ($user) {
            $user->update(['stripe_id' => null]);
            Log::info('Cleared Stripe ID from user', ['user_id' => $user->id]);
        }
    }

    /**
     * Handle customer.subscription.created event
     * This fires when a new subscription is created (payment succeeded)
     */
    private function handleSubscriptionCreated($subscription)
    {
        Log::info('Subscription created', [
            'subscription_id' => $subscription->id,
            'customer_id' => $subscription->customer,
            'status' => $subscription->status,
        ]);

        $user = $this->getUserByStripeCustomerId($subscription->customer);
        if (!$user) {
            Log::warning('Could not find user for subscription', ['customer_id' => $subscription->customer]);
            return;
        }

        // Laravel Cashier will typically create the subscription record automatically
        // But ensure it exists with the correct data
        $existingSubscription = $user->subscriptions()
            ->where('stripe_id', $subscription->id)
            ->first();

        if (!$existingSubscription && isset($subscription->items->data[0])) {
            // Create the subscription record if it doesn't exist
            $item = $subscription->items->data[0];
            
            $user->subscriptions()->create([
                'type' => 'default',
                'stripe_id' => $subscription->id,
                'stripe_status' => $subscription->status,
                'stripe_price' => $item->price->id,
                'quantity' => $item->quantity,
                'trial_ends_at' => $subscription->trial_end ? \Carbon\Carbon::createFromTimestamp($subscription->trial_end) : null,
                'ends_at' => $subscription->ended_at ? \Carbon\Carbon::createFromTimestamp($subscription->ended_at) : null,
            ]);

            Log::info('Subscription record created', ['user_id' => $user->id, 'stripe_id' => $subscription->id]);
        }
    }

    /**
     * Handle customer.subscription.updated event
     */
    private function handleSubscriptionUpdated($subscription)
    {
        Log::info('Subscription updated', [
            'subscription_id' => $subscription->id,
            'status' => $subscription->status,
        ]);

        $user = $this->getUserByStripeCustomerId($subscription->customer);
        if (!$user) {
            Log::warning('Could not find user for subscription update', ['customer_id' => $subscription->customer]);
            return;
        }

        // Update the subscription status in our database
        $dbSubscription = $user->subscriptions()
            ->where('stripe_id', $subscription->id)
            ->first();

        if ($dbSubscription) {
            $item = $subscription->items->data[0] ?? null;
            
            $dbSubscription->update([
                'stripe_status' => $subscription->status,
                'stripe_price' => $item?->price->id ?? $dbSubscription->stripe_price,
                'quantity' => $item?->quantity ?? $dbSubscription->quantity,
                'trial_ends_at' => $subscription->trial_end ? \Carbon\Carbon::createFromTimestamp($subscription->trial_end) : null,
                'ends_at' => $subscription->ended_at ? \Carbon\Carbon::createFromTimestamp($subscription->ended_at) : null,
            ]);

            Log::info('Subscription updated in database', ['user_id' => $user->id]);
        }
    }

    /**
     * Handle customer.subscription.deleted event
     */
    private function handleSubscriptionDeleted($subscription)
    {
        Log::info('Subscription deleted', ['subscription_id' => $subscription->id]);

        $user = $this->getUserByStripeCustomerId($subscription->customer);
        if (!$user) {
            return;
        }

        // Update the subscription to mark it as canceled
        $dbSubscription = $user->subscriptions()
            ->where('stripe_id', $subscription->id)
            ->first();

        if ($dbSubscription) {
            $dbSubscription->update([
                'stripe_status' => 'canceled',
                'ends_at' => now(),
            ]);

            Log::info('Subscription marked as canceled', ['user_id' => $user->id]);
        }
    }

    /**
     * Handle invoice.payment_succeeded event
     * This is the most important one - confirms payment was received
     */
    private function handleInvoicePaymentSucceeded($invoice)
    {
        Log::info('Invoice payment succeeded', [
            'invoice_id' => $invoice->id,
            'customer_id' => $invoice->customer,
            'amount' => $invoice->amount_paid,
        ]);

        $user = $this->getUserByStripeCustomerId($invoice->customer);
        if (!$user) {
            Log::warning('Could not find user for invoice', ['customer_id' => $invoice->customer]);
            return;
        }

        // If this invoice is for a subscription, ensure it's marked as active
        if ($invoice->subscription) {
            $subscription = $user->subscriptions()
                ->where('stripe_id', $invoice->subscription)
                ->first();

            if ($subscription) {
                // Only update status if it's not already active
                if ($subscription->stripe_status !== 'active') {
                    $subscription->update(['stripe_status' => 'active']);
                    Log::info('Subscription marked as active after payment', ['user_id' => $user->id]);
                }
            }
        }

        Log::info('Invoice processed successfully', ['user_id' => $user->id, 'invoice_id' => $invoice->id]);
    }

    /**
     * Handle invoice.payment_failed event
     */
    private function handleInvoicePaymentFailed($invoice)
    {
        Log::warning('Invoice payment failed', [
            'invoice_id' => $invoice->id,
            'customer_id' => $invoice->customer,
        ]);

        $user = $this->getUserByStripeCustomerId($invoice->customer);
        if (!$user) {
            return;
        }

        // If this invoice is for a subscription, mark it as past_due
        if ($invoice->subscription) {
            $subscription = $user->subscriptions()
                ->where('stripe_id', $invoice->subscription)
                ->first();

            if ($subscription) {
                $subscription->update(['stripe_status' => 'past_due']);
                Log::warning('Subscription marked as past_due', ['user_id' => $user->id]);
            }
        }
    }

    /**
     * Handle invoice.finalized event
     */
    private function handleInvoiceFinalized($invoice)
    {
        Log::info('Invoice finalized', ['invoice_id' => $invoice->id]);
    }

    /**
     * Handle charge.refunded event
     */
    private function handleChargeRefunded($charge)
    {
        Log::warning('Charge refunded', [
            'charge_id' => $charge->id,
            'amount_refunded' => $charge->amount_refunded,
        ]);
    }

    /**
     * Handle charge.dispute.created event
     */
    private function handleChargeDispute($dispute)
    {
        Log::warning('Charge dispute created', ['dispute_id' => $dispute->id]);
    }

    /**
     * Helper method: Get user by Stripe customer ID
     */
    private function getUserByStripeCustomerId(string $customerId): ?Usuario
    {
        return Usuario::where('stripe_id', $customerId)->first();
    }
}
