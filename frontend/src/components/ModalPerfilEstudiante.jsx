import React from 'react';
import { 
  FileText, 
  GraduationCap, 
  Briefcase, 
  Award, 
  Globe, 
  Heart, 
  Calendar 
} from 'lucide-react';
import { STORAGE_URL } from '../api';

const ModalPerfilEstudiante = ({ isOpen, onClose, estudiante, loading }) => {
  if (!isOpen) return null;

  // Extraer perfil si existe, o usar el objeto estudiante base si es lo único que hay (aunque para detalles completos necesitamos perfil)
  const perfil = estudiante?.perfil || {};
  const nombre = perfil.nombre || estudiante?.nombre;
  const apellidos = perfil.apellidos || '';
  const email = estudiante?.email || '';
  const profileImage = perfil.profile_image || estudiante?.profile_image || estudiante?.avatar;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header del modal */}
        <div className="bg-linear-to-r from-blue-500 to-indigo-500 p-6 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Perfil Completo
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
              <p className="mt-2 text-gray-500">Cargando perfil...</p>
            </div>
          ) : estudiante ? (
            <>
              {/* Datos Personales */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-32 h-32 rounded-2xl bg-gray-100 flex-shrink-0 overflow-hidden border-4 border-white shadow-lg mx-auto md:mx-0">
                  {profileImage ? (
                    <img 
                      src={profileImage.startsWith('http') ? profileImage : `${STORAGE_URL}/${profileImage}`} 
                      alt={nombre} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 text-4xl font-bold">
                      {nombre?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-4 w-full text-center md:text-left">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {nombre} {apellidos}
                    </h3>
                    <p className="text-gray-500">{email}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="block text-gray-500 text-xs uppercase tracking-wide">Ciudad</span>
                      <span className="font-medium">{perfil.ciudad || 'No especificada'}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="block text-gray-500 text-xs uppercase tracking-wide">Teléfono</span>
                      <span className="font-medium">{perfil.telefono || 'No especificado'}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="block text-gray-500 text-xs uppercase tracking-wide">Fecha Nacimiento</span>
                      <span className="font-medium">
                        {perfil.fecha_nacimiento 
                          ? new Date(perfil.fecha_nacimiento).toLocaleDateString() 
                          : 'No especificada'}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="block text-gray-500 text-xs uppercase tracking-wide">DNI</span>
                      <span className="font-medium">{perfil.dni || 'No especificado'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formación Académica */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                  <GraduationCap className="h-5 w-5 text-blue-500" />
                  Formación Académica
                </h3>
                {perfil.formaciones?.length > 0 ? (
                  <div className="space-y-4">
                    {perfil.formaciones.map((formacion, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h4 className="font-bold text-gray-800">{formacion.titulo_obtenido || formacion.titulo}</h4>
                        <p className="text-gray-600">{formacion.centro_estudios || formacion.institucion}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(formacion.fecha_inicio).getFullYear()} - {formacion.fecha_fin ? new Date(formacion.fecha_fin).getFullYear() : 'Actualidad'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No hay formación registrada</p>
                )}
              </div>

              {/* Experiencia Laboral */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                  <Briefcase className="h-5 w-5 text-orange-500" />
                  Experiencia Laboral
                </h3>
                {perfil.experiencias?.length > 0 ? (
                  <div className="space-y-4">
                    {perfil.experiencias.map((exp, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h4 className="font-bold text-gray-800">{exp.puesto}</h4>
                        <p className="text-gray-600">{exp.empresa}</p>
                        <p className="text-sm text-gray-500 mt-2">{exp.descripcion}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(exp.fecha_inicio).getFullYear()} - {exp.fecha_fin ? new Date(exp.fecha_fin).getFullYear() : 'Actualidad'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No hay experiencia registrada</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Habilidades */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                    <Award className="h-5 w-5 text-purple-500" />
                    Habilidades
                  </h3>
                  {perfil.habilidades?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {perfil.habilidades.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
                          {skill.nombre}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No hay habilidades registradas</p>
                  )}
                </div>

                {/* Idiomas */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                    <Globe className="h-5 w-5 text-green-500" />
                    Idiomas
                  </h3>
                  {perfil.idiomas?.length > 0 ? (
                    <div className="space-y-2">
                      {perfil.idiomas.map((idioma, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
                          <span className="font-medium text-gray-700">{idioma.idioma}</span>
                          <span className="text-sm text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">{idioma.nivel}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No hay idiomas registrados</p>
                  )}
                </div>
              </div>

              {/* Intereses */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                  <Heart className="h-5 w-5 text-red-500" />
                  Intereses Personales
                </h3>
                {perfil.intereses?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {perfil.intereses.map((interes, index) => (
                      <span key={index} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                        {interes.nombre}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No hay intereses registrados</p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No se pudo cargar la información del estudiante</p>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-b-2xl border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPerfilEstudiante;
