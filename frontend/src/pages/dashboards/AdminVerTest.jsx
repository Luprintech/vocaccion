import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Brain, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContextFixed';
import { API_URL } from '../../api';
import HeaderAdmin from '../../components/HeaderAdmin';

export default function AdminVerTest() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargarTest() {
      try {
        const response = await fetch(`${API_URL}/admin/estudiantes/${id}/test`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        const result = await response.json();
        
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message || 'No se pudo cargar el test');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar el test del estudiante');
      } finally {
        setLoading(false);
      }
    }

    cargarTest();
  }, [id, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <HeaderAdmin />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-12 h-12 text-orange-500 animate-spin" />
            <p className="text-gray-600 font-medium">Cargando test del estudiante...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <HeaderAdmin />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/admin/usuarios')}
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Volver a Usuarios
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <HeaderAdmin />
      
      {/* Banner de información */}
      <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 font-medium">Viendo información de:</p>
            <p className="text-lg font-bold text-blue-900">{data.estudiante?.nombre}</p>
          </div>
          <button
            onClick={() => navigate('/admin/usuarios')}
            className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Usuarios
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            Test Vocacional
          </h1>

          {/* Resultado del test */}
          {data.result_text && (
            <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                Resultado del Test
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{data.result_text}</p>
            </div>
          )}

          {/* Respuestas del estudiante */}
          {data.questions && data.questions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Respuestas del Test ({data.questions.length} preguntas)
              </h3>
              <div className="space-y-6">
                {data.questions.map((question, idx) => {
                  const userAnswerObj = data.answers && data.answers[idx];
                  // Extraer el texto de la respuesta del objeto
                  const userAnswer = userAnswerObj?.respuesta || userAnswerObj?.selected_option || userAnswerObj;
                  
                  return (
                    <div key={idx} className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors">
                      {/* Número y pregunta */}
                      <div className="mb-4">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-full mb-2">
                          Pregunta {question.numero || idx + 1}
                        </span>
                        <p className="font-medium text-gray-800 text-lg">
                          {question.texto || question.pregunta}
                        </p>
                      </div>

                      {/* Opciones */}
                      {question.opciones && question.opciones.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {question.opciones.map((opcion, oidx) => {
                            // Comparar tanto por texto como por índice
                            const isSelected = userAnswer === opcion || 
                                             userAnswer === oidx ||
                                             (typeof userAnswer === 'string' && opcion.includes(userAnswer)) ||
                                             (typeof opcion === 'string' && opcion.trim() === (typeof userAnswer === 'string' ? userAnswer.trim() : ''));
                            return (
                              <div
                                key={oidx}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                  isSelected
                                    ? 'bg-blue-100 border-blue-500 shadow-md'
                                    : 'bg-white border-gray-200'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                    isSelected
                                      ? 'border-blue-500 bg-blue-500'
                                      : 'border-gray-300'
                                  }`}>
                                    {isSelected && (
                                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                  <p className={`flex-1 ${isSelected ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>
                                    {opcion}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Respuesta elegida (si no hay opciones) */}
                      {(!question.opciones || question.opciones.length === 0) && userAnswer && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-semibold text-blue-700 mb-1">Respuesta:</p>
                          <p className="text-gray-800">{typeof userAnswer === 'string' ? userAnswer : JSON.stringify(userAnswer)}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botón de volver */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate('/admin/usuarios')}
              className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors shadow-lg"
            >
              <ArrowLeft className="h-5 w-5" />
              Volver a Usuarios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
