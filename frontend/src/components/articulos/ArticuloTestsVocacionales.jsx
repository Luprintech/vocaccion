import React from 'react';

/**
 * Artículo: Tests de orientación vocacional - ¿Realmente funcionan?
 * 
 * Análisis sobre la efectividad de los tests vocacionales
 */

const ArticuloTestsVocacionales = () => {
  return (
    <div className="espacio-y-6">
      {/* Introducción */}
      <p className="text-lg text-gray-700 leading-relaxed">
        Los tests de orientación vocacional son herramientas diseñadas para ayudarte a descubrir tus intereses, 
        habilidades y preferencias profesionales. Pero, ¿realmente pueden predecir tu futuro laboral? En este 
        artículo analizamos su efectividad, limitaciones y cómo aprovecharlos al máximo.
      </p>

      {/* Alerta */}
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 p-6 rounded-lg my-8">
        <div className="flex items-start gap-3">
          <span className="text-3xl">⚠️</span>
          <div>
            <h3 className="text-lg font-bold text-yellow-900 mb-2">
              Los tests son una guía, no una sentencia
            </h3>
            <p className="text-yellow-800">
              Ningún test puede decidir tu futuro por ti. Son herramientas de autoconocimiento que deben 
              complementarse con reflexión personal, investigación y experiencia práctica.
            </p>
          </div>
        </div>
      </div>

      {/* Sección 1 */}
      <section className="my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full font-bold">
            1
          </span>
          ¿Qué miden realmente los tests vocacionales?
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Los tests de orientación vocacional evalúan diferentes aspectos de tu perfil:
          </p>
          <div className="space-y-3 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-bold text-blue-900 mb-2">🎯 Intereses profesionales</h4>
              <p className="text-sm text-gray-700">
                Qué actividades y áreas te resultan más atractivas (ciencias, artes, tecnología, ayuda social, etc.)
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <h4 className="font-bold text-green-900 mb-2">💪 Aptitudes y habilidades</h4>
              <p className="text-sm text-gray-700">
                En qué áreas destacas naturalmente (razonamiento lógico, creatividad, habilidades sociales, etc.)
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
              <h4 className="font-bold text-purple-900 mb-2">🧠 Personalidad</h4>
              <p className="text-sm text-gray-700">
                Rasgos de tu carácter que influyen en tu desempeño laboral (introversión/extroversión, organización, etc.)
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
              <h4 className="font-bold text-orange-900 mb-2">⚖️ Valores laborales</h4>
              <p className="text-sm text-gray-700">
                Qué es importante para ti en un trabajo (estabilidad, creatividad, ayudar a otros, autonomía, etc.)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 2 */}
      <section className="my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full font-bold">
            2
          </span>
          Tipos de tests vocacionales
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Existen diferentes metodologías, cada una con su enfoque:
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold mt-1">•</span>
              <div>
                <strong>Test de Holland (RIASEC):</strong> Clasifica a las personas en 6 tipos de personalidad 
                profesional (Realista, Investigador, Artístico, Social, Emprendedor, Convencional).
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold mt-1">•</span>
              <div>
                <strong>Test de Kuder:</strong> Evalúa intereses en 10 áreas profesionales diferentes.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold mt-1">•</span>
              <div>
                <strong>16 Personalities (MBTI):</strong> Basado en tipos de personalidad de Jung, identifica 
                16 perfiles diferentes.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold mt-1">•</span>
              <div>
                <strong>Tests de aptitudes:</strong> Miden capacidades específicas como razonamiento verbal, 
                numérico, espacial, etc.
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Sección 3 */}
      <section className="my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full font-bold">
            3
          </span>
          ¿Qué dice la ciencia?
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            La investigación sobre la efectividad de los tests vocacionales muestra resultados mixtos:
          </p>
          <div className="bg-green-50 p-5 rounded-lg border-l-4 border-green-500 my-4">
            <h3 className="font-bold text-green-900 mb-3">✓ Evidencia a favor:</h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• Los tests bien diseñados tienen una <strong>fiabilidad del 70-80%</strong> en identificar intereses</li>
              <li>• Ayudan a <strong>estructurar el autoconocimiento</strong> de forma sistemática</li>
              <li>• Son útiles para <strong>descubrir opciones</strong> que no habías considerado</li>
              <li>• Reducen la <strong>ansiedad de decisión</strong> al proporcionar un punto de partida</li>
            </ul>
          </div>
          <div className="bg-red-50 p-5 rounded-lg border-l-4 border-red-500 my-4">
            <h3 className="font-bold text-red-900 mb-3">✗ Limitaciones identificadas:</h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• No pueden predecir el <strong>éxito profesional</strong> con certeza</li>
              <li>• Los intereses <strong>cambian con el tiempo</strong> y la experiencia</li>
              <li>• Pueden estar <strong>sesgados culturalmente</strong></li>
              <li>• No consideran <strong>factores externos</strong> (mercado laboral, economía familiar, etc.)</li>
              <li>• Resultados pueden variar según tu <strong>estado emocional</strong> al realizarlos</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Sección 4 */}
      <section className="my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full font-bold">
            4
          </span>
          Cómo aprovecharlos al máximo
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Para obtener el mayor beneficio de un test vocacional:
          </p>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <div>
                <strong>Responde con honestidad:</strong> No contestes lo que crees que "deberías" responder, 
                sino lo que realmente piensas y sientes.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <div>
                <strong>Realiza varios tests diferentes:</strong> Compara resultados de diferentes metodologías 
                para tener una visión más completa.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <div>
                <strong>Analiza los resultados críticamente:</strong> No los tomes como verdades absolutas, 
                úsalos como punto de partida para la reflexión.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </span>
              <div>
                <strong>Complementa con otras herramientas:</strong> Combina los tests con entrevistas con 
                orientadores, investigación de carreras y experiencias prácticas.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                5
              </span>
              <div>
                <strong>Repítelos periódicamente:</strong> Tus intereses evolucionan, así que es útil 
                reevaluar cada cierto tiempo.
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Sección 5 */}
      <section className="my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full font-bold">
            5
          </span>
          Cuándo son más útiles
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Los tests vocacionales son especialmente valiosos en estas situaciones:
          </p>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-bold text-purple-900 mb-2">✓ Cuando estás completamente perdido</h4>
              <p className="text-sm text-gray-700">
                Si no tienes ni idea de qué estudiar, un test puede darte opciones concretas para investigar.
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-bold text-purple-900 mb-2">✓ Para confirmar intuiciones</h4>
              <p className="text-sm text-gray-700">
                Si ya tienes una idea, el test puede validarla o hacerte considerar alternativas similares.
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-bold text-purple-900 mb-2">✓ En momentos de cambio</h4>
              <p className="text-sm text-gray-700">
                Al considerar un cambio de carrera o especialización, pueden ayudarte a reevaluar tus intereses.
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-bold text-purple-900 mb-2">✓ Para autoconocimiento</h4>
              <p className="text-sm text-gray-700">
                Incluso si no cambias de rumbo, te ayudan a entender mejor tus motivaciones y preferencias.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 6 */}
      <section className="my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full font-bold">
            6
          </span>
          Señales de alarma
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Desconfía de tests que:
          </p>
          <div className="bg-red-50 p-5 rounded-lg border-l-4 border-red-500">
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">⚠</span>
                <span>Prometen resultados "100% precisos" o "garantizados"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">⚠</span>
                <span>Solo tienen 5-10 preguntas (demasiado superficiales)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">⚠</span>
                <span>Te cobran cantidades excesivas sin justificación</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">⚠</span>
                <span>No explican su metodología o base científica</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">⚠</span>
                <span>Te presionan para tomar decisiones inmediatas</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Consejo final */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-600 p-6 rounded-lg my-8">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🎯</span>
          <div>
            <h3 className="text-lg font-bold text-purple-900 mb-2">
              El veredicto final
            </h3>
            <p className="text-purple-800 mb-3">
              Los tests de orientación vocacional <strong>sí funcionan</strong> como herramientas de autoconocimiento 
              y exploración, pero <strong>no son infalibles</strong>. Son más efectivos cuando se usan como parte de 
              un proceso más amplio que incluye reflexión personal, investigación, experiencia práctica y, 
              idealmente, orientación profesional.
            </p>
            <p className="text-purple-800">
              Úsalos como una brújula que señala direcciones posibles, no como un GPS que dicta tu ruta exacta.
            </p>
          </div>
        </div>
      </div>

      {/* Fuentes */}
      <section className="my-8 pt-8 border-t-2 border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="text-2xl">📚</span>
          Fuentes y referencias
        </h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <ul className="space-y-3 text-sm text-gray-700">
            <li>
              <strong>Consejo General de la Psicología de España:</strong> Recomendaciones sobre uso ético de tests vocacionales
              <br />
              <a href="https://www.cop.es" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.cop.es
              </a>
            </li>
            <li>
              <strong>Ministerio de Educación - Orientación Educativa:</strong> Recursos y guías de orientación vocacional
              <br />
              <a href="https://www.educacionyfp.gob.es" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.educacionyfp.gob.es
              </a>
            </li>
            <li>
              <strong>AIOSP España (Asociación Internacional de Orientación):</strong> Investigación en orientación profesional
              <br />
              <a href="https://www.aiosp.org" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.aiosp.org
              </a>
            </li>
            <li>
              <strong>Revista Española de Orientación y Psicopedagogía:</strong> Artículos científicos sobre tests y orientación
              <br />
              <a href="https://www.uned.es/reop/" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                REOP - UNED
              </a>
            </li>
            <li>
              <strong>COIE (Centros de Orientación e Información de Empleo):</strong> Servicios de orientación universitaria en España
            </li>
            <li>
              <strong>Fundación Bertelsmann - Orientación:</strong> Estudios sobre herramientas de orientación vocacional
              <br />
              <a href="https://www.fundacionbertelsmann.org" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.fundacionbertelsmann.org
              </a>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default ArticuloTestsVocacionales;
