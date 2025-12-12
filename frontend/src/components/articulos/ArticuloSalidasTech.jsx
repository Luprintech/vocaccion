import React from 'react';

/**
 * Artículo: Salidas profesionales en tecnología 2025
 * 
 * Guía sobre las profesiones tecnológicas más demandadas
 */

const ArticuloSalidasTech = () => {
  return (
    <div className="espacio-y-6">
      {/* Introducción */}
      <p className="text-lg text-gray-700 leading-relaxed">
        El sector tecnológico continúa siendo uno de los más dinámicos y con mayor proyección de futuro. 
        En 2025, la demanda de profesionales tech sigue creciendo, con salarios competitivos y excelentes 
        condiciones laborales. Descubre cuáles son las profesiones más demandadas y cómo acceder a ellas.
      </p>

      {/* Alerta */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 p-6 rounded-lg my-8">
        <div className="flex items-start gap-3">
          <span className="text-3xl">📈</span>
          <div>
            <h3 className="text-lg font-bold text-blue-900 mb-2">
              El sector tech en cifras
            </h3>
            <p className="text-blue-800">
              Se estima que para 2025 habrá más de 1 millón de empleos tecnológicos sin cubrir en Europa. 
              En España, el sector digital representa ya el 4% del PIB y crece a un ritmo del 15% anual.
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
          Desarrollo de Software
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            El desarrollo sigue siendo el pilar fundamental del sector tecnológico:
          </p>
          <div className="space-y-4 mt-4">
            <div className="bg-white p-5 rounded-lg border-l-4 border-purple-500 shadow-sm">
              <h4 className="font-bold text-purple-900 mb-2">💻 Full Stack Developer</h4>
              <p className="text-sm text-gray-700 mb-3">
                Profesional que domina tanto frontend como backend, capaz de desarrollar aplicaciones completas.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">React</span>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">Node.js</span>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">Python</span>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">SQL</span>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Salario medio:</strong> 35.000€ - 55.000€ (junior-senior)
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border-l-4 border-blue-500 shadow-sm">
              <h4 className="font-bold text-blue-900 mb-2">📱 Mobile Developer</h4>
              <p className="text-sm text-gray-700 mb-3">
                Especialista en desarrollo de aplicaciones móviles nativas o multiplataforma.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">Swift</span>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">Kotlin</span>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">React Native</span>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">Flutter</span>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Salario medio:</strong> 32.000€ - 50.000€
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border-l-4 border-green-500 shadow-sm">
              <h4 className="font-bold text-green-900 mb-2">☁️ Cloud Engineer</h4>
              <p className="text-sm text-gray-700 mb-3">
                Experto en infraestructura cloud, migración y optimización de servicios en la nube.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">AWS</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Azure</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Google Cloud</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Kubernetes</span>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Salario medio:</strong> 40.000€ - 65.000€
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
          Inteligencia Artificial y Data Science
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            El área de mayor crecimiento en 2025, con demanda exponencial:
          </p>
          <div className="space-y-4 mt-4">
            <div className="bg-white p-5 rounded-lg border-l-4 border-indigo-500 shadow-sm">
              <h4 className="font-bold text-indigo-900 mb-2">🤖 AI/ML Engineer</h4>
              <p className="text-sm text-gray-700 mb-3">
                Desarrolla modelos de inteligencia artificial y machine learning para resolver problemas complejos.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">Python</span>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">TensorFlow</span>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">PyTorch</span>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">Scikit-learn</span>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Salario medio:</strong> 45.000€ - 75.000€
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border-l-4 border-pink-500 shadow-sm">
              <h4 className="font-bold text-pink-900 mb-2">📊 Data Scientist</h4>
              <p className="text-sm text-gray-700 mb-3">
                Analiza grandes volúmenes de datos para extraer insights y apoyar la toma de decisiones.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-semibold">Python</span>
                <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-semibold">R</span>
                <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-semibold">SQL</span>
                <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-semibold">Tableau</span>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Salario medio:</strong> 40.000€ - 70.000€
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border-l-4 border-orange-500 shadow-sm">
              <h4 className="font-bold text-orange-900 mb-2">🔮 Prompt Engineer</h4>
              <p className="text-sm text-gray-700 mb-3">
                Nueva profesión enfocada en optimizar la interacción con modelos de IA generativa.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">GPT-4</span>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">Claude</span>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">LangChain</span>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">APIs IA</span>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Salario medio:</strong> 35.000€ - 60.000€
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 3 */}
      <section className="my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full font-bold">
            3
          </span>
          Ciberseguridad
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Con el aumento de ciberataques, la seguridad es prioritaria:
          </p>
          <div className="space-y-4 mt-4">
            <div className="bg-white p-5 rounded-lg border-l-4 border-red-500 shadow-sm">
              <h4 className="font-bold text-red-900 mb-2">🛡️ Cybersecurity Analyst</h4>
              <p className="text-sm text-gray-700 mb-3">
                Protege sistemas y redes contra amenazas, detecta vulnerabilidades y responde a incidentes.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">Ethical Hacking</span>
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">Firewalls</span>
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">SIEM</span>
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">Pentesting</span>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Salario medio:</strong> 38.000€ - 65.000€
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border-l-4 border-yellow-500 shadow-sm">
              <h4 className="font-bold text-yellow-900 mb-2">🔐 Security Architect</h4>
              <p className="text-sm text-gray-700 mb-3">
                Diseña la estrategia de seguridad completa de una organización.
              </p>
              <p className="text-sm text-gray-600">
                <strong>Salario medio:</strong> 50.000€ - 85.000€
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
          DevOps y Automatización
        </h2>
        <div className="pl-13 space-y-4">
          <div className="bg-white p-5 rounded-lg border-l-4 border-teal-500 shadow-sm">
            <h4 className="font-bold text-teal-900 mb-2">⚙️ DevOps Engineer</h4>
            <p className="text-sm text-gray-700 mb-3">
              Automatiza procesos de desarrollo, testing y despliegue para mejorar la eficiencia.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold">Docker</span>
              <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold">Jenkins</span>
              <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold">GitLab CI/CD</span>
              <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold">Terraform</span>
            </div>
            <p className="text-sm text-gray-600">
              <strong>Salario medio:</strong> 42.000€ - 68.000€
            </p>
          </div>
        </div>
      </section>

      {/* Sección 5 */}
      <section className="my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full font-bold">
            5
          </span>
          Cómo acceder a estas profesiones
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Existen múltiples vías de formación:
          </p>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-bold text-purple-900 mb-2">🎓 Formación universitaria</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Ingeniería Informática</li>
                <li>• Ingeniería de Software</li>
                <li>• Ciencia de Datos</li>
                <li>• Matemáticas + Máster en IA</li>
              </ul>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-bold text-green-900 mb-2">📚 FP Grado Superior</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Desarrollo de Aplicaciones Web</li>
                <li>• Desarrollo de Aplicaciones Multiplataforma</li>
                <li>• Administración de Sistemas</li>
                <li>• Ciberseguridad</li>
              </ul>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-bold text-blue-900 mb-2">💻 Bootcamps</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Programas intensivos 3-6 meses</li>
                <li>• Enfoque práctico</li>
                <li>• Alta empleabilidad</li>
                <li>• Especialización rápida</li>
              </ul>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-bold text-orange-900 mb-2">🌐 Autodidacta</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Cursos online (Udemy, Coursera)</li>
                <li>• Certificaciones oficiales</li>
                <li>• Proyectos personales</li>
                <li>• Comunidades tech</li>
              </ul>
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
          Habilidades clave para 2025
        </h2>
        <div className="pl-13 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Más allá de las habilidades técnicas, estas soft skills son esenciales:
          </p>
          <ul className="space-y-2 text-gray-700 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold mt-1">•</span>
              <div><strong>Aprendizaje continuo:</strong> La tecnología evoluciona rápidamente</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold mt-1">•</span>
              <div><strong>Trabajo en equipo:</strong> Proyectos colaborativos son la norma</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold mt-1">•</span>
              <div><strong>Comunicación:</strong> Explicar conceptos técnicos a no técnicos</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold mt-1">•</span>
              <div><strong>Resolución de problemas:</strong> Pensamiento analítico y creativo</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold mt-1">•</span>
              <div><strong>Adaptabilidad:</strong> Flexibilidad ante nuevas herramientas y metodologías</div>
            </li>
          </ul>
        </div>
      </section>

      {/* Consejo final */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-600 p-6 rounded-lg my-8">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🚀</span>
          <div>
            <h3 className="text-lg font-bold text-purple-900 mb-2">
              El futuro es tech
            </h3>
            <p className="text-purple-800">
              El sector tecnológico ofrece no solo buenos salarios, sino también flexibilidad, trabajo remoto, 
              y la oportunidad de trabajar en proyectos innovadores que impactan millones de vidas. Nunca ha 
              sido mejor momento para empezar una carrera en tecnología.
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
              <strong>DigitalES (Asociación Española para la Digitalización):</strong> Informes anuales sobre el sector digital en España
              <br />
              <a href="https://www.digitales.es" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.digitales.es
              </a>
            </li>
            <li>
              <strong>InfoJobs - Informe del Mercado Laboral:</strong> Datos sobre empleo tecnológico y salarios en España
              <br />
              <a href="https://www.infojobs.net/orientacion-laboral/informe-mercado-laboral" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                InfoJobs - Informe Mercado Laboral
              </a>
            </li>
            <li>
              <strong>SEPE - Observatorio de las Ocupaciones:</strong> Análisis de perfiles profesionales tecnológicos más demandados
              <br />
              <a href="https://www.sepe.es/HomeSepe/que-es-el-sepe/observatorio.html" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                Observatorio SEPE
              </a>
            </li>
            <li>
              <strong>ONTSI (Observatorio Nacional de Tecnología y Sociedad):</strong> Estudios sobre transformación digital y empleo tech
              <br />
              <a href="https://www.ontsi.es" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.ontsi.es
              </a>
            </li>
            <li>
              <strong>Fundación Telefónica - Sociedad Digital:</strong> Informes sobre futuro del trabajo y profesiones digitales
              <br />
              <a href="https://www.fundaciontelefonica.com" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.fundaciontelefonica.com
              </a>
            </li>
            <li>
              <strong>AMETIC (Asociación de Empresas de Tecnología):</strong> Datos del sector TIC en España
              <br />
              <a href="https://www.ametic.es" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.ametic.es
              </a>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default ArticuloSalidasTech;
