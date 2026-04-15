import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Filter, GraduationCap, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicCourses } from "../api";

function formatDate(date) {
  if (!date) return null;

  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function Courses() {
  const [scope, setScope] = useState("all");
  const [community, setCommunity] = useState("");
  const [courses, setCourses] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getPublicCourses({ scope, community: scope === "community" ? community : "" });

        if (data?.success) {
          setCourses(data.courses || []);
          setCommunities(data.filters?.communities || []);
        } else {
          setCourses([]);
          setError("No se pudieron cargar los cursos en este momento.");
        }
      } catch (err) {
        setCourses([]);
        setError(err?.message || "No se pudieron cargar los cursos en este momento.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [scope, community]);

  const sectionTitle = useMemo(() => {
    if (scope === "community" && community) {
      return `Cursos oficiales en ${community}`;
    }

    if (scope === "general") {
      return "Cursos generales de ámbito nacional";
    }

    return "Todos los cursos disponibles";
  }, [scope, community]);

  return (
    <div className="bg-linear-to-b from-purple-50 via-white to-green-50">
      <section className="relative overflow-hidden py-16 md:py-20">
        <div className="absolute inset-0 bg-linear-to-br from-purple-50 via-white to-green-50" />
        <div className="relative container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm">
              <BookOpen className="h-4 w-4" />
              Formación y cursos oficiales
            </div>

            <h1 className="mt-6 text-4xl font-bold text-gray-900 md:text-5xl">
              Encuentra cursos por <span className="bg-linear-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">comunidad autónoma</span> o a nivel España
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-gray-600">
              Consulta cursos públicos y oficiales, diferencia fácilmente los del SAE Andalucía y filtra también los cursos generales de ámbito nacional.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <Card className="border-purple-100 text-left shadow-sm">
                <CardContent className="flex gap-4 p-6">
                  <div className="rounded-2xl bg-purple-100 p-3 text-purple-700">
                    <Filter className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Filtra por comunidad autónoma</h2>
                    <p className="mt-1 text-sm text-gray-600">Selecciona cursos oficiales específicos de una comunidad, como los del SAE en Andalucía.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-100 text-left shadow-sm">
                <CardContent className="flex gap-4 p-6">
                  <div className="rounded-2xl bg-green-100 p-3 text-green-700">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Consulta cursos generales</h2>
                    <p className="mt-1 text-sm text-gray-600">Muestra formaciones de ámbito nacional, identificadas como cursos generales de España.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto px-4">
          <Card className="border border-purple-100 shadow-lg">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-purple-700">Filtros</p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900">{sectionTitle}</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:min-w-[620px]">
                  <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                    Tipo de cursos
                    <select
                      value={scope}
                      onChange={(event) => {
                        const nextScope = event.target.value;
                        setScope(nextScope);
                        if (nextScope !== "community") {
                          setCommunity("");
                        }
                      }}
                      className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 focus:border-purple-400 focus:outline-none"
                    >
                      <option value="all">Todos los cursos</option>
                      <option value="community">Cursos por comunidad autónoma</option>
                      <option value="general">Cursos generales de España</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                    Comunidad autónoma
                    <select
                      value={community}
                      onChange={(event) => setCommunity(event.target.value)}
                      disabled={scope !== "community"}
                      className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 focus:border-purple-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="">Todas las comunidades</option>
                      {communities.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading && (
            <div className="mt-8 rounded-3xl border border-purple-100 bg-white px-6 py-12 text-center shadow-sm">
              <p className="text-lg font-semibold text-gray-900">Cargando cursos...</p>
              <p className="mt-2 text-gray-600">Estamos consultando el catálogo oficial para mostrarte la oferta disponible.</p>
            </div>
          )}

          {error && !loading && (
            <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 px-6 py-12 text-center shadow-sm">
              <p className="text-lg font-semibold text-red-800">No se han podido cargar los cursos</p>
              <p className="mt-2 text-red-700">{error}</p>
            </div>
          )}

          {!loading && !error && <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => {
              const isSaeCourse = course.source_system === "SAE";
              const isGeneralCourse = !course.autonomous_community || course.source_system === "SEPE";

              return (
                <Card key={course.id} className="h-full border border-gray-200 shadow-sm transition-shadow hover:shadow-lg">
                  <CardHeader className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {course.modality && (
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                          {course.modality}
                        </span>
                      )}

                      {isSaeCourse && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Curso oficial del SAE
                        </span>
                      )}

                      {isGeneralCourse && (
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                          Curso general de España
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-500">{course.provider}</p>
                      <CardTitle className="mt-2 text-xl text-gray-900">{course.title}</CardTitle>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="line-clamp-3 text-sm leading-relaxed text-gray-600">
                      {course.description || "Curso de formación oficial disponible en el catálogo público de VocAcción."}
                    </p>

                    <div className="space-y-2 text-sm text-gray-700">
                      {(course.locality || course.province) && (
                        <p className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 text-purple-600" />
                          <span>
                            {course.locality || ""}
                            {course.locality && course.province ? ", " : ""}
                            {course.province || ""}
                            {course.autonomous_community ? ` · ${course.autonomous_community}` : " · España"}
                          </span>
                        </p>
                      )}

                      {course.start_date && <p>📅 Inicio: {formatDate(course.start_date)}</p>}
                      {course.hours && <p>⏱️ {course.hours} horas</p>}
                      {course.search_criteria && <p>🏷️ {course.search_criteria}</p>}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      {course.url && (
                        <a href={course.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                          Ver curso oficial
                        </a>
                      )}

                      <Link to={`/estudios?search=${encodeURIComponent(course.title)}`} className="text-sm font-semibold text-green-600 hover:text-green-700">
                        Buscar formación relacionada
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>}

          {!loading && !error && courses.length === 0 && (
            <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center shadow-sm">
              <p className="text-lg font-semibold text-gray-900">No hay cursos disponibles con ese filtro ahora mismo.</p>
              <p className="mt-2 text-gray-600">Prueba otra comunidad autónoma o consulta los cursos generales de España.</p>
            </div>
          )}

          <div className="mt-10 text-center">
            <Button asChild className="bg-indigo-600 text-white hover:bg-indigo-700">
              <Link to="/estudios">Ir al buscador de estudios</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
