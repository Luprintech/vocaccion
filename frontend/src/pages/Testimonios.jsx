import { useState, useEffect, Fragment } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContextFixed";
import { getTestimonials, addTestimonial, updateTestimonial, deleteTestimonial } from "../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, Transition } from "@headlessui/react";
import { Plus, X, ArrowLeft, Loader2 } from "lucide-react";
import TestimonialCard from "../components/TestimonialCard";
import { Card } from "@/components/ui/card";

export default function Testimonios() {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({ mensaje: "", edad: "" });

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const data = await getTestimonials();
      setReviews(data);
    } catch (error) {
      console.error("Error loading testimonials", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (review = null) => {
    if (review) {
      setEditingReview(review);
      setReviewForm({ mensaje: review.quote, edad: review.age || "" });
    } else {
      setEditingReview(null);
      setReviewForm({ mensaje: "", edad: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReview) {
        // Edit logic
        const res = await updateTestimonial(editingReview.id, reviewForm);
        setReviews(prev => prev.map(r => r.id === editingReview.id ? res.testimonio : r));
      } else {
        // Create logic
        const res = await addTestimonial(reviewForm);
        setReviews(prev => [res.testimonio, ...prev]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving testimonial", error);
      alert("Error al guardar la reseña. Inténtalo de nuevo.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta reseña?")) return;
    try {
      await deleteTestimonial(id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error("Error deleting testimonial", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-24 md:pt-32">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center md:text-left">
            <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Link>
            <h1 className="text-4xl font-bold bg-linear-to-r from-purple-600 to-green-600 bg-clip-text text-transparent mb-2">
              Todas las Reseñas
            </h1>
            <p className="text-gray-600 max-w-2xl">
              Descubre lo que nuestra comunidad opina sobre VocAcción y cómo les hemos ayudado a encontrar su camino.
            </p>
          </div>
          
          {isAuthenticated && (
            <Button 
                onClick={() => handleOpenModal()} 
                size="lg" 
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all rounded-full"
            >
              <Plus className="w-5 h-5 mr-2" />
              Dejar mi reseña
            </Button>
          )}
        </div>

        {/* Content */}
        {loading ? (
             <div className="flex justify-center items-center py-20">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
             </div>
        ) : reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((review, index) => (
                    <TestimonialCard 
                        key={review.id} 
                        testimonial={review} 
                        index={index}
                        currentUserId={user?.id}
                        onEdit={handleOpenModal}
                        onDelete={handleDelete}
                    />
                ))}
            </div>
        ) : (
            <Card className="p-12 text-center bg-white shadow-sm border-purple-100">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">💬</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Aún no hay reseñas</h3>
                <p className="text-gray-500 mb-6">Sé el primero en compartir tu experiencia con nosotros.</p>
                {isAuthenticated && (
                    <Button onClick={() => handleOpenModal()} variant="outline" className="border-purple-200 hover:bg-purple-50 text-purple-700">
                        Escribir reseña
                    </Button>
                )}
            </Card>
        )}
      </div>

      {/* Modal Form */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all border border-purple-100">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold leading-6 text-gray-900 flex justify-between items-center"
                  >
                    {editingReview ? 'Editar reseña' : 'Tu experiencia en VocAcción'}
                    <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)} className="h-8 w-8 p-0 rounded-full">
                        <X className="w-4 h-4" />
                    </Button>
                  </Dialog.Title>
                  <div className="mt-2 text-sm text-gray-500">
                    Cuéntanos cómo te ha ayudado la plataforma.
                  </div>

                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Edad (Opcional)</label>
                        <Input 
                            type="number" 
                            placeholder="Ej. 18" 
                            min="5" 
                            max="100"
                            value={reviewForm.edad}
                            onChange={(e) => setReviewForm({...reviewForm, edad: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tu testimonio</label>
                        <textarea 
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Escribe aquí tu experiencia..."
                            required
                            maxLength={255}
                            value={reviewForm.mensaje}
                            onChange={(e) => setReviewForm({...reviewForm, mensaje: e.target.value})}
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsModalOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {editingReview ? 'Guardar cambios' : 'Publicar reseña'}
                      </Button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
