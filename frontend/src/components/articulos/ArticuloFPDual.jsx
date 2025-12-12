import React from 'react';

/**
 * Artículo: FP Dual - Qué es y cuáles son sus ventajas
 * 
 * Guía completa sobre la Formación Profesional Dual en España
 */

const ArticuloFPDual = () => {
  return (
    <div className="espacio-y-6">
      {/* Introducción */}
      <p className="text-lg text-gray-700 leading-relaxed">
        La Formación Profesional Dual combina el aprendizaje en el centro educativo con la formación práctica 
        en empresas, ofreciendo una experiencia única que prepara a los estudiantes para el mundo laboral real. 
        Este modelo, inspirado en el exitoso sistema alemán, está ganando cada vez más popularidad en España.
      </p>

      {/* Alerta informativa */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 p-6 rounded-lg my-8">
        <div className="flex items-start gap-3">
          <span className="text-3xl">ℹ️</span>
          <div>
            <h3 className="text-lg font-bold text-blue-900 mb-2">
              ¿Sabías que...?
            </h3>
            <p className="text-blue-800">
              Los estudiantes de FP Dual pasan entre el 33% y el 50% de su tiempo formativo en empresas, 
              adquiriendo experiencia laboral real mientras estudian. Además, muchos reciben una remuneración 
              durante sus prácticas.
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
          ¿Qué es la FP Dual?
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            La Formación Profesional Dual es una modalidad educativa que integra:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li><strong>Formación teórica:</strong> Clases en el centro educativo</li>
            <li><strong>Formación práctica:</strong> Trabajo real en empresas colaboradoras</li>
            <li><strong>Doble tutoría:</strong> Seguimiento por parte del centro y la empresa</li>
            <li><strong>Contrato formativo:</strong> Relación laboral con la empresa (en muchos casos)</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            A diferencia de la FP tradicional, donde las prácticas son solo una parte final del curso, 
            en la FP Dual la alternancia entre centro y empresa es constante durante todo el ciclo formativo.
          </p>
        </div>
      </section>

      {/* Sección 2 */}
      <section className="my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full font-bold">
            2
          </span>
          Ventajas para los estudiantes
        </h2>
        <div className="pl-13 space-y-4">
          <div className="bg-green-50 p-5 rounded-lg border-l-4 border-green-500">
            <h3 className="font-bold text-green-900 mb-3">✓ Principales beneficios:</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-1">•</span>
                <div>
                  <strong>Experiencia laboral real:</strong> Trabajas en entornos profesionales desde el primer día, 
                  conociendo la realidad del sector.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-1">•</span>
                <div>
                  <strong>Mayor empleabilidad:</strong> El 70% de los estudiantes de FP Dual consiguen empleo 
                  en menos de 6 meses tras graduarse.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-1">•</span>
                <div>
                  <strong>Remuneración económica:</strong> Muchas empresas ofrecen una beca o salario durante 
                  el periodo de formación.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-1">•</span>
                <div>
                  <strong>Networking profesional:</strong> Creas contactos en el sector que pueden ser valiosos 
                  para tu carrera futura.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-1">•</span>
                <div>
                  <strong>Aprendizaje práctico:</strong> Aplicas inmediatamente lo que aprendes en clase, 
                  consolidando mejor los conocimientos.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-1">•</span>
                <div>
                  <strong>Posibilidad de contratación:</strong> Muchas empresas contratan a sus estudiantes 
                  en prácticas al finalizar el ciclo.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Sección 3 */}
      <section className="my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full font-bold">
            3
          </span>
          ¿Cómo funciona?
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            El funcionamiento de la FP Dual varía según la comunidad autónoma y el centro, pero generalmente:
          </p>
          <div className="space-y-4 mt-4">
            <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500 shadow-sm">
              <h4 className="font-bold text-purple-900 mb-2">📅 Distribución del tiempo</h4>
              <p className="text-gray-700 text-sm">
                Normalmente se alternan periodos en el centro educativo (2-3 días/semana) con periodos en la 
                empresa (2-3 días/semana), aunque puede variar según el proyecto.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500 shadow-sm">
              <h4 className="font-bold text-purple-900 mb-2">📝 Contrato de formación</h4>
              <p className="text-gray-700 text-sm">
                El estudiante firma un contrato de formación y aprendizaje con la empresa, que incluye 
                derechos laborales y, en muchos casos, una retribución económica.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500 shadow-sm">
              <h4 className="font-bold text-purple-900 mb-2">👥 Doble tutoría</h4>
              <p className="text-gray-700 text-sm">
                Cuentas con un tutor en el centro educativo y otro en la empresa, que coordinan tu formación 
                y evalúan tu progreso.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500 shadow-sm">
              <h4 className="font-bold text-purple-900 mb-2">🎓 Titulación</h4>
              <p className="text-gray-700 text-sm">
                Al finalizar, obtienes el mismo título oficial que en la FP tradicional, pero con una 
                experiencia laboral mucho más amplia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 4 */}
      <section className="my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full font-bold">
            4
          </span>
          Requisitos y acceso
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Para acceder a la FP Dual necesitas cumplir los mismos requisitos que para la FP tradicional:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li><strong>FP Grado Medio:</strong> Título de ESO, prueba de acceso o equivalente</li>
            <li><strong>FP Grado Superior:</strong> Bachillerato, FP Grado Medio, prueba de acceso o equivalente</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            <strong>Proceso adicional:</strong> Además de la admisión en el centro educativo, deberás pasar 
            por un proceso de selección de la empresa colaboradora (similar a una entrevista de trabajo).
          </p>
        </div>
      </section>

      {/* Sección 5 */}
      <section className="my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full font-bold">
            5
          </span>
          Sectores y ciclos disponibles
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            La FP Dual está disponible en múltiples sectores:
          </p>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-bold text-purple-900 mb-2">🔧 Industria y Fabricación</h4>
              <p className="text-sm text-gray-700">Mecatrónica, Automoción, Mantenimiento</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-bold text-purple-900 mb-2">💻 Informática y Comunicaciones</h4>
              <p className="text-sm text-gray-700">Desarrollo de Aplicaciones, Sistemas, Ciberseguridad</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-bold text-purple-900 mb-2">🏥 Sanidad</h4>
              <p className="text-sm text-gray-700">Enfermería, Laboratorio, Imagen Diagnóstica</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-bold text-purple-900 mb-2">🏪 Comercio y Marketing</h4>
              <p className="text-sm text-gray-700">Gestión de Ventas, Marketing Digital, Comercio Internacional</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-bold text-purple-900 mb-2">🏗️ Edificación y Obra Civil</h4>
              <p className="text-sm text-gray-700">Proyectos de Edificación, Obras Públicas</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-bold text-purple-900 mb-2">🍽️ Hostelería y Turismo</h4>
              <p className="text-sm text-gray-700">Cocina, Gestión de Alojamientos, Agencias de Viajes</p>
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
          Diferencias con la FP tradicional
        </h2>
        <div className="pl-13">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
              <thead className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <tr>
                  <th className="p-3 text-left">Aspecto</th>
                  <th className="p-3 text-left">FP Tradicional</th>
                  <th className="p-3 text-left">FP Dual</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b">
                  <td className="p-3 font-semibold">Prácticas</td>
                  <td className="p-3">3-6 meses al final</td>
                  <td className="p-3 text-green-700 font-semibold">Durante todo el ciclo</td>
                </tr>
                <tr className="border-b bg-gray-50">
                  <td className="p-3 font-semibold">Tiempo en empresa</td>
                  <td className="p-3">~400 horas</td>
                  <td className="p-3 text-green-700 font-semibold">~1000 horas</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-semibold">Remuneración</td>
                  <td className="p-3">No (salvo excepciones)</td>
                  <td className="p-3 text-green-700 font-semibold">Sí (en muchos casos)</td>
                </tr>
                <tr className="border-b bg-gray-50">
                  <td className="p-3 font-semibold">Contrato</td>
                  <td className="p-3">Convenio de prácticas</td>
                  <td className="p-3 text-green-700 font-semibold">Contrato formativo</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Empleabilidad</td>
                  <td className="p-3">Alta (~65%)</td>
                  <td className="p-3 text-green-700 font-semibold">Muy alta (~70-80%)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Consejo final */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-600 p-6 rounded-lg my-8">
        <div className="flex items-start gap-3">
          <span className="text-3xl">💼</span>
          <div>
            <h3 className="text-lg font-bold text-purple-900 mb-2">
              ¿Es la FP Dual para ti?
            </h3>
            <p className="text-purple-800">
              La FP Dual es ideal si buscas una formación práctica, quieres empezar a trabajar cuanto antes 
              y prefieres aprender haciendo. Requiere compromiso y responsabilidad, pero ofrece una ventaja 
              competitiva significativa en el mercado laboral.
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
              <strong>Ministerio de Educación y Formación Profesional:</strong> Información oficial sobre FP Dual en España
              <br />
              <a href="https://www.todofp.es/orientacion-profesional/itinerarios-fp-y-empleo/fp-dual.html" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                TodoFP - FP Dual
              </a>
            </li>
            <li>
              <strong>Fundación Bertelsmann España:</strong> Estudios sobre empleabilidad en FP Dual y promoción del modelo dual
              <br />
              <a href="https://www.fundacionbertelsmann.org/es/home/formacion-profesional-dual/" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                Fundación Bertelsmann - FP Dual
              </a>
            </li>
            <li>
              <strong>Alianza para la FP Dual:</strong> Red española de empresas y centros educativos comprometidos con la FP Dual
              <br />
              <a href="https://www.alianzafpdual.es" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.alianzafpdual.es
              </a>
            </li>
            <li>
              <strong>SEPE - Contratos de Formación:</strong> Datos sobre contratos de formación y aprendizaje en España
              <br />
              <a href="https://www.sepe.es/HomeSepe/empresas/contratos-de-trabajo/contratos-formacion.html" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                SEPE - Contratos de Formación
              </a>
            </li>
            <li>
              <strong>CaixaBank Dualiza:</strong> Plataforma de impulso de la FP Dual con recursos y datos del sector
              <br />
              <a href="https://www.caixabankdualiza.es" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.caixabankdualiza.es
              </a>
            </li>
            <li>
              <strong>Consejerías de Educación Autonómicas:</strong> Normativa y oferta específica de FP Dual por comunidad autónoma (consultar portal de cada comunidad)
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default ArticuloFPDual;
