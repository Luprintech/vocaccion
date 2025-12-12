import React from "react";
import { 
  Heart, CheckCircle, AlertCircle, TrendingUp, Target, Award 
} from "lucide-react";
import ArticuloContent, { 
  ArticuloSection, 
  ArticuloHighlight, 
  ArticuloList, 
  ArticuloGrid 
} from "../ArticuloContent";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Componente ArticuloQueEstudiar - VocAcción
 * 
 * Artículo específico sobre qué hacer cuando no sabes qué estudiar.
 * Utiliza los componentes reutilizables para mantener consistencia.
 * 
 * Props:
 * @param {string} image - URL de imagen opcional
 */

const ArticuloQueEstudiar = ({ image = null }) => {
  // Contenido del artículo
  const contenidoArticulo = (
    <>
      {/* Introducción empática */}
      <ArticuloHighlight 
        type="warning"
        icon={<Heart className="h-6 w-6" />}
        title="Tranquilo, es normal sentirse perdido"
      >
        <p>
          Más del 70% de los estudiantes han pasado por esta situación. No estar seguro de qué estudiar 
          no significa que no tengas futuro, sino que tienes muchas posibilidades por explorar.
        </p>
      </ArticuloHighlight>

      {/* Sección 1: Reflexión */}
      <ArticuloSection title="1. Haz una pausa y reflexiona">
        <p className="text-gray-700 leading-relaxed mb-4">
          Lo primero es respirar profundo. La presión de elegir "correctamente" puede bloquearte. 
          Recuerda que no existe una única respuesta correcta, y que muchas decisiones se pueden 
          cambiar más adelante.
        </p>
        
        <Card className="bg-gray-50 border-gray-200 mb-4">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2">💡 Ejercicio de reflexión:</h4>
            <ArticuloList 
              type="bullet"
              items={[
                "¿Qué actividades te hacen perder la noción del tiempo?",
                "¿En qué asignaturas has destacado sin esforzarte mucho?",
                "¿Qué problemas del mundo te gustaría ayudar a resolver?",
                "¿Prefieres trabajar con personas, ideas, datos o cosas tangibles?"
              ]}
            />
          </CardContent>
        </Card>
      </ArticuloSection>

      {/* Sección 2: Explorar intereses */}
      <ArticuloSection title="2. Explora tus intereses actuales">
        <p className="text-gray-700 leading-relaxed mb-4">
          No necesitas descubrir una "pasión oculta". Mira lo que ya te gusta hacer y cómo 
          podrías convertirlo en una carrera profesional.
        </p>
        
        <ArticuloGrid cols={2}>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-900">Sí haz esto</h4>
              </div>
              <ArticuloList 
                type="bullet"
                items={[
                  "Habla con profesionales de áreas que te llamen la atención",
                  "Haz voluntariado relacionado con tus intereses",
                  "Investiga el día a día real de diferentes profesiones",
                  "Realiza test vocacionales (como el nuestro)"
                ]}
              />
            </CardContent>
          </Card>
          
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h4 className="font-semibold text-red-900">Evita esto</h4>
              </div>
              <ArticuloList 
                type="bullet"
                items={[
                  "Elegir solo por el dinero que podrías ganar",
                  "Decidir basándote en lo que esperan otros",
                  "Descartar opciones sin investigarlas",
                  "Compararte constantemente con tus amigos"
                ]}
              />
            </CardContent>
          </Card>
        </ArticuloGrid>
      </ArticuloSection>

      {/* Sección 3: Panorama laboral */}
      <ArticuloSection title="3. Considera el panorama laboral actual">
        <p className="text-gray-700 leading-relaxed mb-4">
          Es importante equilibrar tus intereses con la realidad del mercado laboral. 
          Algunas profesiones están creciendo rápidamente, mientras otras están en declive.
        </p>
        
        <ArticuloHighlight 
          type="info"
          icon={<TrendingUp className="h-6 w-6" />}
          title="Sectores con alta demanda en España (2025):"
        >
          <ArticuloGrid cols={2}>
            <div>
              <ArticuloList 
                type="bullet"
                items={[
                  "Tecnología y programación",
                  "Sostenibilidad y energías renovables",
                  "Salud y cuidados"
                ]}
              />
            </div>
            <div>
              <ArticuloList 
                type="bullet"
                items={[
                  "Educación especializada",
                  "Marketing digital", 
                  "Logística y comercio electrónico"
                ]}
              />
            </div>
          </ArticuloGrid>
        </ArticuloHighlight>
      </ArticuloSection>

      {/* Sección 4: Tomar decisión */}
      <ArticuloSection title="4. Toma una decisión provisional">
        <p className="text-gray-700 leading-relaxed mb-4">
          No necesitas elegir "para toda la vida". Elige algo que te motive lo suficiente para 
          empezar, sabiendo que siempre puedes ajustar el rumbo más adelante.
        </p>
        
        <ArticuloHighlight 
          type="tip"
          icon={<Target className="h-6 w-6" />}
          title="📝 Plan de acción:"
        >
          <ArticuloList 
            type="number"
            items={[
              "Haz una lista de 3-5 opciones que te interesen",
              "Investiga cada una durante una semana", 
              "Habla con al menos una persona de cada área",
              "Elige la opción que más te motive ahora mismo",
              "Da el primer paso (inscribirte, informarte de requisitos, etc.)"
            ]}
          />
        </ArticuloHighlight>
      </ArticuloSection>

      {/* Conclusión */}
      <ArticuloSection title="Recuerda: El camino se hace al andar">
        <p className="text-gray-700 leading-relaxed mb-4">
          Muchos profesionales exitosos cambiaron de carrera varias veces. Lo importante es empezar, 
          aprender sobre ti mismo en el proceso, y ajustar según vayas descubriendo qué te motiva realmente.
        </p>
        <p className="text-gray-700 leading-relaxed">
          <strong>Tu valor no depende de tener todo claro desde el principio.</strong> Depende de tu 
          disposición a explorar, aprender y crecer. ¡Confía en el proceso!
        </p>
      </ArticuloSection>

      {/* Fuentes */}
      <ArticuloSection title="📚 Fuentes y referencias">
        <div className="bg-gray-50 p-6 rounded-lg">
          <ul className="space-y-3 text-sm text-gray-700">
            <li>
              <strong>Ministerio de Educación y Formación Profesional:</strong> Guías de orientación académica
              <br />
              <a href="https://www.educacionyfp.gob.es" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.educacionyfp.gob.es
              </a>
            </li>
            <li>
              <strong>Educaweb:</strong> Portal de orientación académica y profesional líder en España
              <br />
              <a href="https://www.educaweb.com" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.educaweb.com
              </a>
            </li>
            <li>
              <strong>INJUVE (Instituto de la Juventud):</strong> Recursos para jóvenes sobre empleo y formación
              <br />
              <a href="https://www.injuve.es" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.injuve.es
              </a>
            </li>
            <li>
              <strong>Orientación y Educación (Blog):</strong> Artículos de profesionales de la orientación en España
              <br />
              <a href="https://elorienta.com" className="text-purple-600 hover:underline" target="_blank" rel="noopener">
                www.elorienta.com
              </a>
            </li>
          </ul>
        </div>
      </ArticuloSection>
    </>
  );

  return (
    <ArticuloContent
      title="¿Qué hacer si no sé qué estudiar?"
      tiempoLectura="8 min"
      categoria="Orientación vocacional"
      content={contenidoArticulo}
      image={image}
    />
  );
};

export default ArticuloQueEstudiar;