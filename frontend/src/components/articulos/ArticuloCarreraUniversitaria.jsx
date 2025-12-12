import React from 'react';

/**
 * Artículo: Cómo elegir la carrera universitaria perfecta
 * 
 * Guía completa para ayudar a los estudiantes a tomar la decisión
 * más importante sobre su futuro académico y profesional
 */

const ArticuloCarreraUniversitaria = () => {
  return (
    <div className="espacio-y-6">
      {/* Introducción */}
      <p className="text-lg text-gray-700 leading-relaxed">
        Elegir una carrera universitaria es una de las decisiones más importantes que tomarás en tu vida. 
        No solo determinará tu formación académica durante los próximos años, sino que también influirá 
        significativamente en tu futuro profesional y personal. Esta guía te ayudará a tomar una decisión 
        informada y alineada con tus objetivos.
      </p>

      {/* Alerta motivacional */}
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 p-6 rounded-lg my-8">
        <div className="flex items-start gap-3">
          <span className="text-3xl">💡</span>
          <div>
            <h3 className="text-lg font-bold text-yellow-900 mb-2">
              No existe la carrera perfecta, pero sí la más adecuada para ti
            </h3>
            <p className="text-yellow-800">
              Cada persona tiene intereses, habilidades y circunstancias únicas. La clave está en encontrar 
              la carrera que mejor se adapte a tu perfil, no en buscar una opción "ideal" universal.
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
          Autoconocimiento: El punto de partida
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Antes de investigar carreras, necesitas conocerte a ti mismo. Reflexiona sobre:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li><strong>Tus intereses:</strong> ¿Qué temas te apasionan? ¿Qué actividades disfrutas?</li>
            <li><strong>Tus habilidades:</strong> ¿En qué destacas naturalmente? ¿Qué se te da bien?</li>
            <li><strong>Tus valores:</strong> ¿Qué es importante para ti? (ayudar a otros, creatividad, estabilidad, etc.)</li>
            <li><strong>Tu personalidad:</strong> ¿Prefieres trabajar solo o en equipo? ¿Eres más práctico o teórico?</li>
          </ul>
        </div>
      </section>

      {/* Sección 2 */}
      <section className="my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full font-bold">
            2
          </span>
          Investiga las salidas profesionales
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Una carrera puede sonar interesante, pero es fundamental conocer las oportunidades laborales reales:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li>Tasa de empleabilidad de los graduados</li>
            <li>Sectores donde podrás trabajar</li>
            <li>Rango salarial promedio</li>
            <li>Demanda actual y proyección futura del mercado</li>
            <li>Posibilidades de emprendimiento</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            Consulta informes del SEPE, estudios de empleabilidad universitaria y habla con profesionales del sector.
          </p>
        </div>
      </section>

      {/* Sección 3 */}
      <section className="my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full font-bold">
            3
          </span>
          Analiza el plan de estudios
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            No te quedes solo con el nombre de la carrera. Revisa en detalle:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li>Asignaturas que cursarás cada año</li>
            <li>Enfoque teórico vs. práctico</li>
            <li>Prácticas en empresas incluidas</li>
            <li>Posibilidad de especializaciones o menciones</li>
            <li>Proyectos fin de grado y TFG</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            Asegúrate de que el contenido del grado realmente te interesa, no solo el título final.
          </p>
        </div>
      </section>

      {/* Sección 4 */}
      <section className="my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full font-bold">
            4
          </span>
          Compara universidades
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            La misma carrera puede variar significativamente según la universidad:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li><strong>Prestigio y rankings:</strong> Investiga la reputación de la facultad</li>
            <li><strong>Instalaciones:</strong> Laboratorios, bibliotecas, recursos tecnológicos</li>
            <li><strong>Profesorado:</strong> Experiencia y trayectoria del equipo docente</li>
            <li><strong>Convenios:</strong> Acuerdos con empresas para prácticas y empleo</li>
            <li><strong>Ubicación:</strong> Proximidad, coste de vida, oportunidades locales</li>
            <li><strong>Nota de corte:</strong> Requisitos de acceso</li>
          </ul>
        </div>
      </section>

      {/* Sección 5 */}
      <section className="my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full font-bold">
            5
          </span>
          Considera el aspecto económico
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            La inversión en educación superior es significativa. Evalúa:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li>Coste de matrícula (pública vs. privada)</li>
            <li>Gastos de materiales y libros</li>
            <li>Alojamiento si estudias fuera de casa</li>
            <li>Transporte y manutención</li>
            <li>Becas y ayudas disponibles</li>
            <li>Retorno de inversión esperado</li>
          </ul>
        </div>
      </section>

      {/* Sección 6 */}
      <section className="my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full font-bold">
            6
          </span>
          Habla con estudiantes y profesionales
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            La experiencia de primera mano es invaluable:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li>Asiste a jornadas de puertas abiertas</li>
            <li>Contacta con estudiantes actuales en redes sociales</li>
            <li>Habla con graduados sobre su experiencia laboral</li>
            <li>Pregunta sobre la carga de trabajo real</li>
            <li>Infórmate sobre el ambiente universitario</li>
          </ul>
        </div>
      </section>

      {/* Sección 7 */}
      <section className="my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full font-bold">
            7
          </span>
          Piensa a largo plazo
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Tu carrera es solo el comienzo de tu desarrollo profesional:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li>¿Permite especializaciones posteriores (másteres, doctorados)?</li>
            <li>¿Ofrece flexibilidad para cambiar de sector?</li>
            <li>¿Es una base sólida para el aprendizaje continuo?</li>
            <li>¿Se adapta a las tendencias del mercado futuro?</li>
          </ul>
        </div>
      </section>

      {/* Consejo final */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-600 p-6 rounded-lg my-8">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🎯</span>
          <div>
            <h3 className="text-lg font-bold text-purple-900 mb-2">
              Confía en tu decisión, pero mantente flexible
            </h3>
            <p className="text-purple-800">
              Toma la decisión más informada posible con la información que tienes ahora, pero recuerda que 
              cambiar de carrera o complementar tu formación más adelante es completamente válido. Lo importante 
              es dar el primer paso con convicción.
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
              <strong>Ministerio de Universidades (España):</strong> Datos oficiales sobre grados universitarios, notas de corte y empleabilidad
              <br />
              <a href="https://www.universidades.gob.es" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.universidades.gob.es
              </a>
            </li>
            <li>
              <strong>SEPE - Servicio Público de Empleo Estatal:</strong> Informes de mercado laboral y demanda profesional en España
              <br />
              <a href="https://www.sepe.es/HomeSepe/que-es-el-sepe/observatorio.html" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                Observatorio de las Ocupaciones - SEPE
              </a>
            </li>
            <li>
              <strong>U-Ranking BBVA-Ivie:</strong> Ranking de universidades españolas por rendimiento académico
              <br />
              <a href="https://www.u-ranking.es" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.u-ranking.es
              </a>
            </li>
            <li>
              <strong>ANECA - Agencia Nacional de Evaluación:</strong> Calidad y acreditación de universidades españolas
              <br />
              <a href="https://www.aneca.es" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.aneca.es
              </a>
            </li>
            <li>
              <strong>Conferencia de Rectores (CRUE):</strong> Informes sobre empleabilidad de graduados universitarios
              <br />
              <a href="https://www.crue.org" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.crue.org
              </a>
            </li>
            <li>
              <strong>Distrito Universitario de Andalucía:</strong> Información sobre acceso a la universidad y grados
              <br />
              <a href="https://www.juntadeandalucia.es/economiaconocimientoempresasyuniversidad/sguit/" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                Portal de Acceso a la Universidad
              </a>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default ArticuloCarreraUniversitaria;
