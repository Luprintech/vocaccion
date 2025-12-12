
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader, CreditCard, Check, Star, AlertTriangle, Calendar, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

export default function MySubscription() {
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState(null);
    const [portalLoading, setPortalLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSubscriptionDetails();
    }, []);

    const fetchSubscriptionDetails = async () => {
        try {
            setLoading(true);
            // Use global axios (configured in bootstrap.js)
            const response = await window.axios.get('/subscription/details');
            setSubscription(response.data);
        } catch (error) {
            console.error("Error fetching subscription:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePortalRedirect = async () => {
        try {
            setPortalLoading(true);
            const response = await window.axios.post('/subscription/portal');
            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.error("Error redirecting to portal:", error);
            alert("Error al redirigir al portal de pagos.");
        } finally {
            setPortalLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader className="w-10 h-10 animate-spin text-purple-600" />
            </div>
        );
    }

    // Fallback if fetch failed
    if (!subscription) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Error al cargar la suscripción</h1>
                <Button onClick={fetchSubscriptionDetails}>Reintentar</Button>
            </div>
        );
    }

    const { is_premium, current_plan_name, status, renews_at } = subscription;

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-purple-600" />
                    Mi Suscripción
                </h1>
                <p className="text-gray-600 mt-2">Gestiona tu plan y detalles de facturación.</p>
            </div>

            {!is_premium ? (
                // FREE USER VIEW
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-gray-200 shadow-sm">
                        <CardHeader className="bg-gray-50 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-xl">Plan Actual</CardTitle>
                                    <CardDescription>Tu nivel de acceso actual</CardDescription>
                                </div>
                                <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-semibold">
                                    Gratuito
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                                <span className="text-gray-700">Acceso al Test Vocacional básico</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                                <span className="text-gray-700">Resultados preliminares</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                                <span className="text-gray-500 line-through">Orientación personalizada</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Marketing Upsell Card */}
                    <Card className="border-purple-200 shadow-md bg-linear-to-br from-white to-purple-50 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Star className="w-32 h-32 text-purple-600" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-2xl text-purple-900 flex items-center gap-2">
                                <Award className="w-6 h-6 text-purple-600" />
                                Desbloquea tu Potencial
                            </CardTitle>
                            <CardDescription className="text-purple-700 font-medium">
                                Pásate a PRO y consigue acceso total
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 mb-6">
                                Obtén itinerarios detallados, acceso a orientadores expertos y herramientas exclusivas para definir tu futuro.
                            </p>
                            <Button
                                onClick={() => navigate('/planes')}
                                className="w-full bg-linear-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white shadow-lg transition-transform hover:scale-[1.02]"
                            >
                                Invertir en mi Futuro (Ver Planes)
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                // PREMIUM USER VIEW
                <div className="space-y-6">
                    {/* Main Status Card */}
                    <Card className="border-purple-100 shadow-md overflow-hidden">
                        <div className="h-2 bg-linear-to-r from-purple-500 to-green-500"></div>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <CardTitle className="text-2xl text-gray-900">Tu Plan: {current_plan_name}</CardTitle>
                                        <span className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs font-bold uppercase tracking-wide">
                                            {status === 'active' ? 'Activo' : status}
                                        </span>
                                    </div>
                                    <CardDescription className="mt-1">
                                        Tienes acceso premium a todas las herramientas.
                                    </CardDescription>
                                </div>

                                <Button
                                    onClick={handlePortalRedirect}
                                    variant="outline"
                                    disabled={portalLoading}
                                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                >
                                    {portalLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Gestionar Facturación / Cancelar
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="border-t border-gray-100 pt-6">
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="bg-white p-2 rounded-full shadow-xs text-purple-600">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase">Próxima Renovación</h4>
                                        <p className="text-lg font-bold text-gray-800">
                                            {renews_at ? new Date(renews_at).toLocaleDateString() : 'No aplica'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="bg-white p-2 rounded-full shadow-xs text-green-600">
                                        <Star className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase">Estado</h4>
                                        <p className="text-lg font-bold text-gray-800 capitalize">{status}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="bg-white p-2 rounded-full shadow-xs text-blue-600">
                                        <Check className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase">Pago</h4>
                                        <p className="text-lg font-bold text-gray-800">Al día</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Benefits/Features Reminder */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Tus Beneficios Activos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(current_plan_name === 'Plan Pro Plus' ? [
                                    "Test vocacional completo con IA",
                                    "Resultados detallados y análisis profundo",
                                    "Recomendaciones personalizadas de carreras",
                                    "Itinerario formativo paso a paso",
                                    "Recursos educativos premium",
                                    "Seguimiento personalizado con orientador",
                                    "Soporte prioritario 24/7"
                                ] : [
                                    "Test vocacional completo con IA",
                                    "Resultados detallados y análisis profundo",
                                    "Recomendaciones personalizadas de carreras",
                                    "Itinerario formativo paso a paso",
                                    "Recursos educativos premium"
                                ]).map((benefit, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-green-600" />
                                        </div>
                                        <span className="text-gray-700">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
