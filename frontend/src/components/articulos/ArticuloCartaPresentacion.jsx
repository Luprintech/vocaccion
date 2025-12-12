import React from 'react';

const ArticuloCartaPresentacion = () => {
  return (
    <div className="space-y-8 font-sans text-gray-800">
      <div className="bg-purple-50 p-6 rounded-xl border-l-4 border-purple-600 mb-8">
        <p className="text-lg font-medium text-purple-900">
          💡 <strong>Sabías que...</strong> una carta de presentación bien redactada aumenta un 40% las probabilidades de que un reclutador lea tu CV. En este artículo exclusivo para suscriptores PRO, aprenderás la estructura exacta que funciona en 2025.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="bg-purple-100 text-purple-700 w-8 h-8 flex items-center justify-center rounded-full text-sm">1</span>
          ¿Por qué es crucial la Carta de Presentación hoy?
        </h2>
        <p className="mb-4 leading-relaxed">
          Muchos candidatos creen que la carta de presentación está obsoleta, pero la realidad en España es diferente. Si bien en perfiles tech a veces se omite, en la mayoría de sectores (educación, salud, administración, marketing) sigue siendo el elemento diferenciador que muestra tu <strong>motivación</strong> y <strong>personalidad</strong> más allá de las listas de tu CV.
        </p>
        <p className="leading-relaxed">
          No se trata de repetir tu CV, sino de contar tu historia y conectar tus habilidades con las necesidades específicas de la empresa.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="bg-purple-100 text-purple-700 w-8 h-8 flex items-center justify-center rounded-full text-sm">2</span>
          Estructura Ganadora (Método AIDA)
        </h2>
        <p className="mb-4">
          Para captar la atención desde la primera línea, utilizamos el método AIDA: <strong>Atención, Interés, Deseo y Acción</strong>.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-bold text-purple-700 mb-2">1. Encabezado Profesional</h3>
            <p className="text-sm text-gray-600">
              Tus datos, los datos del reclutador (si lo conoces) o de la empresa, y la fecha. Es el marco formal indispensable.
            </p>
          </div>
          <div className="border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-bold text-purple-700 mb-2">2. Saludo Personalizado</h3>
            <p className="text-sm text-gray-600">
              Evita "A quien corresponda". Investiga en LinkedIn quién es el responsable de selección. Si no lo encuentras, usa "Estimado responsable de selección".
            </p>
          </div>
          <div className="border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-bold text-purple-700 mb-2">3. Introducción (El Gancho)</h3>
            <p className="text-sm text-gray-600">
              No empieces con "Le escribo para solicitar...". Dilo de forma atractiva: "Como especialista en marketing con pasión por la sostenibilidad, sigo de cerca la trayectoria de [Empresa]..."
            </p>
          </div>
          <div className="border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-bold text-purple-700 mb-2">4. Cuerpo (Tus Logros)</h3>
            <p className="text-sm text-gray-600">
              Conecta sus requisitos con tus experiencias. Usa ejemplos concretos: "En mi anterior puesto, logré aumentar las ventas un 20%..."
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="bg-purple-100 text-purple-700 w-8 h-8 flex items-center justify-center rounded-full text-sm">3</span>
          Errores Fatales a Evitar
        </h2>
        <ul className="space-y-3 bg-red-50 p-6 rounded-xl">
          <li className="flex items-start gap-3">
            <span className="text-red-500 font-bold">✕</span>
            <span className="text-gray-700"><strong>Ser genérico:</strong> Enviar la misma carta a 50 empresas. Se nota y se descarta inmediatamente.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-red-500 font-bold">✕</span>
            <span className="text-gray-700"><strong>Hablar solo de lo que tú quieres:</strong> Enfócate en lo que TÚ puedes aportar a la empresa, no en lo que la empresa te da a ti.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-red-500 font-bold">✕</span>
            <span className="text-gray-700"><strong>Faltas de ortografía:</strong> Inaceptable en una carta de presentación, demuestra falta de atención al detalle.</span>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="bg-purple-100 text-purple-700 w-8 h-8 flex items-center justify-center rounded-full text-sm">4</span>
          Ejemplo Práctico para Adaptar
        </h2>
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 font-mono text-sm text-gray-700 whitespace-pre-line">
          {`Estimada María García (o Responsable de Selección de [Empresa]),

          Con gran entusiasmo e interés presento mi candidatura para la posición de [Puesto] en [Empresa], referente en el sector de [Sector] por su innovación en [Mencionar algo específico].

          Como [Tu profesión] con más de [X] años de experiencia en [Área clave], he desarrollado habilidades sólidas en [Habilidad 1] y [Habilidad 2]. En mi reciente etapa en [Empresa anterior/Proyecto], lideré la implementación de un sistema que optimizó los tiempos de entrega un 15%, demostrando mi capacidad para mejorar procesos y trabajar bajo objetivos exigentes.

          Lo que más me atrae de [Empresa] es su compromiso con [Valor de la empresa], un valor que comparto profundamente. Estoy convencido de que mi proactividad y mi experiencia en [Tema relevante] encajarían perfectamente con su equipo de [Departamento].

          Agradezco de antemano su tiempo y consideración, y quedo a su entera disposición para concertar una entrevista y profundizar en cómo puedo contribuir al éxito de [Empresa].

          Atentamente,

          [Tu Nombre]
          [Tu Teléfono]
          [LinkedIn]`}
        </div>
      </section>

      <section className="bg-linear-to-r from-purple-600 to-indigo-600 text-white p-8 rounded-2xl text-center shadow-lg mt-8">
        <h3 className="text-2xl font-bold mb-4">¡Potencia tu Carta ahora!</h3>
        <p className="mb-6 opacity-90">
          Como usuario PRO PLUS, tienes acceso a revisiones ilimitadas de tu carta de presentación por nuestros orientadores.
        </p>
      </section>

      <section className="border-t pt-8 mt-12">
        <h3 className="text-xl font-bold mb-4">Fuentes y Referencias</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
          <li>
            <a href="https://www.sepe.es/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              SEPE (Servicio Público de Empleo Estatal)
            </a> - Guías de orientación laboral.
          </li>
          <li>
            <a href="https://ejemplo.com" className="text-gray-500 cursor-default">
              Modelos de Currículum Europass
            </a> - Estándares europeos de presentación.
          </li>
        </ul>
      </section>
    </div>
  );
};

export default ArticuloCartaPresentacion;
