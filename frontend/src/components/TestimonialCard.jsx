import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TestimonialCard({ testimonial, index, displayMode = 'grid', currentUserId, onEdit, onDelete }) {
  const isOwner = currentUserId && testimonial.user_id === currentUserId;

  return (
    <Card 
      className={`border-2 border-purple-100 hover:border-purple-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white/80 backdrop-blur-sm group overflow-hidden relative flex flex-col h-full`}
    >
      {/* Borde superior de color */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r ${index % 2 === 0 ? 'from-purple-500 to-purple-600' : 'from-green-500 to-green-600'}`}></div>
      
      <CardContent className="pt-8 pb-6 px-6 flex-1 flex flex-col">
        <div className="flex items-start space-x-4">
          {/* Avatar con gradiente */}
          <div className="shrink-0 relative">
            <div className={`w-14 h-14 rounded-full bg-linear-to-br ${index % 2 === 0 ? 'from-purple-400 to-purple-600' : 'from-green-400 to-green-600'} flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden`}>
              {testimonial.image ? (
                  <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
              ) : (
                  testimonial.name.charAt(0).toUpperCase()
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Owner Actions */}
            {isOwner && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        onClick={(e) => { e.stopPropagation(); onEdit(testimonial); }}
                    >
                        <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => { e.stopPropagation(); onDelete(testimonial.id); }}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Comillas decorativas */}
            <div className="text-6xl text-purple-200 leading-none mb-2 font-serif">"</div>
            
            <blockquote className="text-gray-700 leading-relaxed mb-4 relative z-10 -mt-8 break-words text-sm md:text-base">
              {testimonial.quote}
            </blockquote>
            
            <div className="flex items-center gap-3 mt-auto">
              <div className={`h-1 w-12 bg-linear-to-r ${index % 2 === 0 ? 'from-purple-500 to-purple-600' : 'from-green-500 to-green-600'} rounded-full`}></div>
              <p className="font-bold text-gray-800 truncate">
                {testimonial.name}
                {testimonial.age && (
                    <span className="text-gray-500 font-normal ml-2 text-sm">
                      {testimonial.age} años
                    </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Icono decorativo de fondo */}
      <div className="absolute bottom-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <GraduationCap className="w-24 h-24 text-purple-600" />
      </div>
    </Card>
  );
}
