import React from "react";
import { 
  GraduationCap, School, Wrench, Building, CheckCircle, Target
} from "lucide-react";
import ArticuloContent, { 
  ArticuloSection, 
  ArticuloHighlight, 
  ArticuloList, 
  ArticuloGrid 
} from "../ArticuloContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Componente ArticuloUniversidadFP - VocAcción
 * 
 * Artículo específico sobre cómo elegir entre Universidad, FP o cursos técnicos.
 * Utiliza los componentes reutilizables para mantener consistencia.
 * 
 * Props:
 * @param {string} image - URL de imagen opcional
 */

const ArticuloUniversidadFP = ({ image = null }) => {
  // Datos de comparativa
  const opcionesFormativas = [
    {
      titulo: "Universidad",
      icono: <School className="h-6 w-6" />,
      color: "purple",
      ventajas: [
        "Formación teórica profunda",
        "Prestigio social reconocido",
        "Acceso a investigación",
        "Red de contactos amplia",
        "Movilidad internacional",
        "Base para postgrados"
      ],
      desventajas: [
        "Menor práctica profesional",
        "Mayor duración (4 años)",
        "Coste más elevado",
        "Inserción laboral más lenta",
        "Sobrespecialización teórica"
      ],
      coste: "€1,500-€12,000/año + gastos de vida"
    },
    {
      titulo: "Formación Profesional",
      icono: <Wrench className="h-6 w-6" />,
      color: "blue",
      ventajas: [
        "Enfoque muy práctico",
        "Inserción laboral rápida",
        "Menor duración (2 años)",
        "Prácticas en empresas",
        "Alta demanda laboral",
        "Menor coste"
      ],
      desventajas: [
        "Menos reconocimiento social",
        "Formación más específica",
        "Menor flexibilidad cambio",
        "Techo salarial más bajo",
        "Menos opciones internacionales"
      ],
      coste: "€300-€2,000/año + posibles becas"
    },
    {
      titulo: "Cursos Técnicos",
      icono: <Building className="h-6 w-6" />,
      color: "green",
      ventajas: [
        "Máxima especialización",
        "Duración flexible",
        "Actualización constante",
        "Coste variable",
        "Inmersión laboral rápida",
        "Habilidades muy específicas"
      ],
      desventajas: [
        "Sin título oficial",
        "Calidad variable",
        "Menor reconocimiento",
        "Formación muy estrecha",
        "Sin base teórica sólida"
      ],
      coste: "€500-€8,000 según especialización"
    }
  ];

  // Casos de éxito
  const casosExito = [
    {
      nombre: "Alejandro, 28 años",
      formacion: "FP Superior en Desarrollo Web",
      resultado: "Trabaja en startup tecnológica con salario de €35,000",
      testimonio: "Las prácticas me conectaron directamente con mi empleador actual"
    },
    {
      nombre: "María, 24 años", 
      formacion: "Grado en Medicina",
      resultado: "Residente en hospital público, futuro especialista",
      testimonio: "La formación teórica me dio la base para especializarme"
    },
    {
      nombre: "David, 31 años",
      formacion: "Cursos de Marketing Digital",
      resultado: "Freelancer con ingresos de €45,000/año",
      testimonio: "La especialización rápida me permitió adaptarme al mercado"
    }
  ];

  // Preguntas para la toma de decisiones
  const preguntasDecision = [
    {
      categoria: "Sobre tu estilo de aprendizaje:",
      preguntas: [
        "¿Prefieres teoría o práctica?",
        "¿Te gusta la investigación profunda?",
        "¿Aprendes mejor haciendo?",
        "¿Necesitas ver resultados rápidos?"
      ]
    },
    {
      categoria: "Sobre tus objetivos:",
      preguntas: [
        "¿Qué prioridad tiene el dinero?",
        "¿Quieres trabajar pronto?",
        "¿Te importa el prestigio social?",
        "¿Planeas trabajar en el extranjero?"
      ]
    }
  ];

  // Contenido del artículo
  const contenidoArticulo = (
    <>
      {/* Introducción */}
      <ArticuloHighlight 
        type="info"
        icon={<GraduationCap className="h-6 w-6" />}
        title="Todas las opciones son válidas"
      >
        <p>
          No existe una jerarquía entre Universidad, FP y cursos técnicos. Cada camino tiene ventajas 
          únicas y puede llevarte al éxito profesional. La clave está en elegir el que mejor se adapte 
          a tu perfil y objetivos.
        </p>
      </ArticuloHighlight>

      {/* Comparativa detallada */}
      <ArticuloSection title="Comparativa detallada">
        <ArticuloGrid cols={3}>
          {opcionesFormativas.map((opcion, index) => (
            <Card 
              key={index}
              className={`border-2 ${
                opcion.color === "purple" ? "border-purple-200 bg-purple-50" :
                opcion.color === "blue" ? "border-blue-200 bg-blue-50" :
                "border-green-200 bg-green-50"
              }`}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    opcion.color === "purple" ? "bg-purple-100 text-purple-600" :
                    opcion.color === "blue" ? "bg-blue-100 text-blue-600" :
                    "bg-green-100 text-green-600"
                  }`}>
                    {opcion.icono}
                  </div>
                  <CardTitle className={`text-xl ${
                    opcion.color === "purple" ? "text-purple-900" :
                    opcion.color === "blue" ? "text-blue-900" :
                    "text-green-900"
                  }`}>
                    {opcion.titulo}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">✅ Ventajas</h4>
                  <ArticuloList type="bullet" items={opcion.ventajas} />
                </div>
                <div>
                  <h4 className="font-semibold text-red-700 mb-2">❌ Desventajas</h4>
                  <ArticuloList type="bullet" items={opcion.desventajas} />
                </div>
              </CardContent>
            </Card>
          ))}
        </ArticuloGrid>
      </ArticuloSection>

      {/* Cómo decidir */}
      <ArticuloSection title="¿Cómo decidir qué es mejor para ti?">
        <ArticuloHighlight 
          type="tip"
          icon={<Target className="h-6 w-6" />}
          title="🎯 Hazte estas preguntas clave:"
        >
          <ArticuloGrid cols={2}>
            {preguntasDecision.map((grupo, index) => (
              <div key={index}>
                <h4 className="font-medium text-gray-900 mb-2">{grupo.categoria}</h4>
                <ArticuloList type="bullet" items={grupo.preguntas} />
              </div>
            ))}
          </ArticuloGrid>
        </ArticuloHighlight>
        
        <ArticuloHighlight 
          type="warning"
          title="💰 Consideraciones económicas importantes:"
        >
          <ArticuloGrid cols={3}>
            {opcionesFormativas.map((opcion, index) => (
              <div key={index}>
                <strong className={
                  opcion.color === "purple" ? "text-purple-700" :
                  opcion.color === "blue" ? "text-blue-700" :
                  "text-green-700"
                }>
                  {opcion.titulo}:
                </strong>
                <p className="text-gray-700 text-sm">{opcion.coste}</p>
              </div>
            ))}
          </ArticuloGrid>
        </ArticuloHighlight>
      </ArticuloSection>

      {/* Casos de éxito */}
      <ArticuloSection title="Casos de éxito reales">
        <ArticuloGrid cols={3}>
          {casosExito.map((caso, index) => (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">
                  {caso.nombre.includes("Alejandro") ? "👨‍💻" : 
                   caso.nombre.includes("María") ? "👩‍⚕️" : "🎨"} {caso.nombre}
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>{caso.formacion}</strong> → {caso.resultado}.
                </p>
                <p className="text-xs text-gray-600 italic">
                  "{caso.testimonio}"
                </p>
              </CardContent>
            </Card>
          ))}
        </ArticuloGrid>
      </ArticuloSection>

      {/* Conclusión */}
      <ArticuloSection title="Conclusión: Tu decisión, tu camino">
        <p className="text-gray-700 leading-relaxed mb-4">
          No existe una opción universalmente mejor. La elección correcta es la que se alinea con tu 
          personalidad, circunstancias, objetivos y valores. Además, recuerda que los caminos formativos 
          no son excluyentes: puedes hacer FP y después Universidad, o combinar títulos oficiales con 
          cursos especializados.
        </p>
        
        <ArticuloHighlight 
          type="success"
          icon={<CheckCircle className="h-6 w-6" />}
          title="Próximo paso recomendado:"
        >
          <p className="text-gray-700 leading-relaxed">
            Realiza nuestro test vocacional para obtener recomendaciones personalizadas sobre 
            qué camino formativo se adapta mejor a tu perfil específico. También puedes solicitar 
            una sesión con uno de nuestros orientadores para analizar tu situación particular.
          </p>
        </ArticuloHighlight>
      </ArticuloSection>

      {/* Fuentes */}
      <ArticuloSection title="📚 Fuentes y referencias">
        <div className="bg-gray-50 p-6 rounded-lg">
          <ul className="space-y-3 text-sm text-gray-700">
            <li>
              <strong>Ministerio de Universidades (SIIU):</strong> Estadísticas sobre universidad y empleabilidad
              <br />
              <a href="https://www.universidades.gob.es" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.universidades.gob.es
              </a>
            </li>
            <li>
              <strong>TodoFP (Ministerio de Educación):</strong> Portal oficial de la Formación Profesional en España
              <br />
              <a href="https://www.todofp.es" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.todofp.es
              </a>
            </li>
            <li>
              <strong>INE (Instituto Nacional de Estadística):</strong> Encuesta de Inserción Laboral de Titulados Universitarios
              <br />
              <a href="https://www.ine.es" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.ine.es
              </a>
            </li>
            <li>
              <strong>Observatorio de la FP (CaixaBank Dualiza):</strong> Datos sobre la evolución de la FP en España
              <br />
              <a href="https://www.observatoriofp.com" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.observatoriofp.com
              </a>
            </li>
          </ul>
        </div>
      </ArticuloSection>
    </>
  );

  return (
    <ArticuloContent
      title="Universidad, FP o cursos técnicos: ¿Cómo elegir?"
      tiempoLectura="12 min"
      categoria="Educación"
      content={contenidoArticulo}
      image={image}
    />
  );
};

export default ArticuloUniversidadFP;