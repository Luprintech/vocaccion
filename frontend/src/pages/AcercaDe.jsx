import { Link } from "react-router-dom";
import {
  BookOpenCheck,
  Lightbulb,
  Users,
  Compass,
  Quote,
  Rocket,
  CalendarClock,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";

export default function AcercaDe() {
  const heroImage = "/images/acerca-de/female educator counseling student.jpg";
  const supportImage = "/images/acerca-de/professional orientation interview.jpg";
  const timelineImage = "/images/acerca-de/laptop notes education startup.jpg";

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50 py-14 px-4 [&_p]:text-justify">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="bg-white/90 backdrop-blur-sm rounded-3xl border border-purple-100 shadow-xl p-8 md:p-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold mb-6">
            <Lightbulb className="w-4 h-4" />
            Acerca de VocAcción
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5">
            <span className="bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
              Una herramienta nacida de una necesidad real
            </span>
          </h1>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-4">
                VocAcción nace de una idea muy simple: <strong>ninguna persona debería elegir su futuro a ciegas</strong>.
                Tras estudiar Pedagogía, vi de cerca lo limitados que están muchos recursos de orientación dentro del contexto escolar.
                Muchas veces hay voluntad de ayudar, pero faltan tiempo, herramientas integrales y seguimiento.
              </p>

              <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                Como decía Ken Robinson, se trata de ayudar a cada persona a encontrar su elemento: su vocación auténtica.
                Vamos a trabajar muchos años de nuestra vida, y por eso es clave descubrir aquello que nos motiva,
                nos representa y nos da sentido.
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden border border-purple-100 shadow-lg min-h-[280px] h-[320px] md:h-[380px] lg:h-[420px]">
              <img
                src={heroImage}
                alt="Educadora orientando vocacionalmente a una estudiante"
                className="w-full h-full object-cover object-center md:object-[50%_35%]"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <article className="bg-white rounded-2xl border border-purple-100 shadow-lg p-6">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4 shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">No es un simple test</h2>
            <p className="text-gray-700 leading-relaxed">
              VocAcción no se queda en “hacer un test y ya”. Es una plataforma de orientación basada en RIASEC
              que conecta resultados vocacionales con decisiones reales: carreras, certificados, itinerarios,
              salidas laborales y próximos pasos concretos.
            </p>
          </article>

          <article className="bg-white rounded-2xl border border-green-100 shadow-lg p-6">
            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-4 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Orientación + seguimiento humano</h2>
            <p className="text-gray-700 leading-relaxed">
              La plataforma conecta a las personas con orientadores para un seguimiento más cercano.
              Porque orientar no es solo recomendar: es acompañar, resolver dudas y ajustar el camino en tiempo real.
            </p>
          </article>
        </section>

        {/* Timeline */}
        <section className="bg-white rounded-3xl border border-purple-100 shadow-xl p-8 md:p-10">
          <div className="flex items-center gap-2 mb-6 text-purple-700 font-semibold">
            <CalendarClock className="w-5 h-5" />
            Cómo nació VocAcción
          </div>

          <div className="rounded-2xl overflow-hidden border border-purple-100 mb-6 shadow-md">
            <img
              src={timelineImage}
              alt="Espacio de trabajo que combina educación y desarrollo web"
              className="w-full h-48 md:h-60 object-cover object-center"
              loading="lazy"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: BookOpenCheck,
                title: "Pedagogía",
                text: "Detecté las carencias de recursos de orientación integral en contextos reales.",
              },
              {
                icon: Rocket,
                title: "Desarrollo web",
                text: "Uní mi pasión por crear productos digitales con impacto educativo real.",
              },
              {
                icon: HeartHandshake,
                title: "VocAcción",
                text: "Nació una plataforma para orientar, acompañar y convertir dudas en decisiones concretas.",
              },
            ].map((step, idx) => (
              <article key={idx} className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-purple-50/30 p-5 h-full">
                <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                  <step.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-r from-purple-600 to-green-600 rounded-3xl p-8 md:p-10 text-white shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Quote className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">¿Por qué hace falta una herramienta así?</h3>
              <p className="text-purple-50 leading-relaxed text-base md:text-lg">
                A nivel de orientación académica y laboral, burocracia y toma de decisiones, mucha gente no sabe
                dónde acudir para entenderlo todo de forma unificada: qué estudiar, dónde matricularse,
                qué becas solicitar, qué salidas tiene cada opción o cómo reorientar su perfil profesional.
                VocAcción quiere cubrir ese vacío con una experiencia clara, práctica y humana.
              </p>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-stretch">
          <article className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 md:p-8 flex items-center gap-4 h-full">
            <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <p className="text-gray-700 leading-relaxed text-lg md:text-xl lg:text-[1.35rem]">
              En resumen: <strong>VocAcción junta dos pasiones</strong> —la pedagogía y el desarrollo web—
              para crear una solución que ayude de verdad a las personas a tomar decisiones profesionales más conscientes,
              mejor informadas y más alineadas con su vocación.
            </p>
          </article>

          <article className="rounded-2xl overflow-hidden border border-green-100 shadow-lg min-h-[220px] h-[260px] md:h-[320px]">
            <img
              src={supportImage}
              alt="Sesión de orientación profesional personalizada"
              className="w-full h-full object-cover object-center md:object-[50%_35%]"
              loading="lazy"
            />
          </article>
        </section>

        <section className="bg-white rounded-3xl border border-purple-100 shadow-xl p-8 md:p-10 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">Visión 2026–2030</h2>
          <p className="text-gray-700 leading-relaxed max-w-3xl mx-auto mb-8">
            Queremos que VocAcción sea la referencia digital en orientación vocacional integral en español:
            una plataforma donde cualquier persona pueda entender su perfil, planificar su camino académico y
            profesional, y contar con acompañamiento humano cuando más lo necesita.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/testintro"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-green-600 text-white font-semibold shadow-lg hover:shadow-xl transition"
            >
              Empezar el test
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contacto"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl border border-purple-200 text-purple-700 bg-white hover:bg-purple-50 font-semibold transition"
            >
              Hablar con un orientador
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
