import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContextFixed";
import {
	User,
	GraduationCap,
	Briefcase,
	Brain,
	Globe,
	Heart,
	Plus,
	Trash2,
	Save,
	CheckCircle,
	ChevronDown,
	ChevronUp,
	Edit2,
	X,
	Sparkles,
	ArrowUp,
	ArrowDown,
	ArrowUpDown,
	Camera,
	Upload,
} from "lucide-react";
import { updateProfile, updateProfileWithImage, deleteProfileImage } from "../api";
import { useCargarDatosPersonales } from "../utils/CargarPerfil";
import { scrollToFirstError } from "@/utils/ScrollToFirstError";
import MonthYearPicker from "../components/MonthYearPicker";
import DatePicker from "../components/DatePicker";

export default function Perfil() {
	const { isAuthenticated } = useAuth();
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);
	const [successMessage, setSuccessMessage] = useState(null);

	// 1. Datos personales
	const [datosPersonales, setDatosPersonales] = useState({
		nombre: "",
		apellidos: "",
		ciudad: "",
		dniNie: "",
		fechaNacimiento: "",
		telefono: "",
	});

	// 2. Formación académica
	const [estudios, setEstudios] = useState([
		{
			id: 1,
			nivelEducativo: "",
			centroEstudios: "",
			tituloObtenido: "",
			fechaInicio: "",
			fechaFin: "",
			cursandoActualmente: false,
		},
	]);

	// 3. Experiencia laboral
	const [experiencias, setExperiencias] = useState([
		{
			id: 1,
			puesto: "",
			empresa: "",
			fechaInicio: "",
			fechaFin: "",
			descripcion: "",
			trabajandoActualmente: false,
		},
	]);

	// 4. Habilidades
	const [habilidadInput, setHabilidadInput] = useState("");
	const [habilidadesList, setHabilidadesList] = useState([]);

	const handleAddHabilidad = (event) => {
		if (event.key === "Enter" && habilidadInput.trim() !== "") {
			event.preventDefault();
			const nuevaHabilidad = habilidadInput.trim();

			//  Comprobar si ya existe la habilidad, si existe marcamos el error, en caso contrario la agregamos
			const existeHabilidad = habilidadesList.some(
				(habilidad) => habilidad.toLowerCase() === nuevaHabilidad.toLowerCase()
			);
			if (!existeHabilidad) {
				setHabilidadesList([...habilidadesList, nuevaHabilidad]);
			}
			setHabilidadInput("");
		}
	};

	const handleRemoveHabilidad = (indexToRemove) => {
		setHabilidadesList(
			habilidadesList.filter((_, index) => index !== indexToRemove)
		);
	};

	// 5. Idiomas
	const [idiomas, setIdiomas] = useState([
		{
			id: 1,
			nombre: "",
			nivel: "",
		},
	]);

	// 6. Intereses personales
	const [interesInput, setInteresInput] = useState("");
	const [interesesList, setInteresesList] = useState([]);

	// 7. Imagen de perfil
	const [profileImage, setProfileImage] = useState(null); // File object
	const [profileImagePreview, setProfileImagePreview] = useState(null); // URL de previsualización
	const [existingProfileImage, setExistingProfileImage] = useState(null); // Imagen existente del backend
	const fileInputRef = useRef(null);

	// Estado para controlar qué formaciones están expandidas
	const [expandedFormaciones, setExpandedFormaciones] = useState(new Set([1]));

	const toggleFormacion = (id) => {
		const newExpanded = new Set(expandedFormaciones);
		if (newExpanded.has(id)) {
			newExpanded.delete(id);
		} else {
			newExpanded.add(id);
		}
		setExpandedFormaciones(newExpanded);
	};

	// Estado para controlar qué experiencias están expandidas
	const [expandedExperiencias, setExpandedExperiencias] = useState(new Set([1]));

	const toggleExperiencia = (id) => {
		const newExpanded = new Set(expandedExperiencias);
		if (newExpanded.has(id)) {
			newExpanded.delete(id);
		} else {
			newExpanded.add(id);
		}
		setExpandedExperiencias(newExpanded);
	};

	// Estado para controlar qué idiomas están en modo edición
	const [expandedIdiomas, setExpandedIdiomas] = useState(new Set());

	const toggleIdioma = (id) => {
		const newExpanded = new Set(expandedIdiomas);
		if (newExpanded.has(id)) {
			newExpanded.delete(id);
		} else {
			newExpanded.add(id);
		}
		setExpandedIdiomas(newExpanded);
	};

	// Habilidades sugeridas
	const habilidadesSugeridas = [
		"Trabajo en equipo",
		"Liderazgo",
		"Comunicación",
		"Resolución de problemas",
		"Pensamiento crítico",
		"Creatividad",
		"Adaptabilidad",
		"Gestión del tiempo",
		"Programación",
		"Análisis de datos",
	];

	const handleAddHabilidadSugerida = (habilidad) => {
		const existeHabilidad = habilidadesList.some(
			(h) => h.toLowerCase() === habilidad.toLowerCase()
		);
		if (!existeHabilidad) {
			setHabilidadesList([...habilidadesList, habilidad]);
		}
	};

	// Intereses sugeridos
	const interesesSugeridos = [
		"Tecnología",
		"Arte",
		"Música",
		"Viajes",
		"Psicología",
		"Deportes",
		"Lectura",
		"Cine",
		"Fotografía",
		"Cocina",
	];

	const handleAddInteresSugerido = (interes) => {
		const existeInteres = interesesList.some(
			(i) => i.toLowerCase() === interes.toLowerCase()
		);
		if (!existeInteres) {
			setInteresesList([...interesesList, interes]);
		}
	};

	const handleAddInteres = (event) => {
		if (event.key === "Enter" && interesInput.trim() !== "") {
			event.preventDefault();
			const nuevoInteres = interesInput.trim();

			//  Comprobar si ya existe el interés, si existe marcamos el error, en caso contrario lo agregamos
			const existeInteres = interesesList.some(
				(interes) => interes.toLowerCase() === nuevoInteres.toLowerCase()
			);
			if (!existeInteres) {
				setInteresesList([...interesesList, nuevoInteres]);
			}
			setInteresInput("");
		}
	};

	const handleRemoveInteres = (indexToRemove) => {
		setInteresesList(
			interesesList.filter((_, index) => index !== indexToRemove)
		);
	};

	// Llamamos al hook para cargar datos desde la API
	useCargarDatosPersonales(
		setDatosPersonales,
		setEstudios,
		setExperiencias,
		setHabilidadesList,
		setIdiomas,
		setInteresesList,
		setExistingProfileImage
	);

	// Handlers para datos personales
	const handleDatosPersonalesChange = (e) => {
		const { name, value } = e.target;
		setDatosPersonales((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// Handlers para estudios
	const addEstudio = () => {
		const newId = Math.max(...estudios.map((e) => e.id)) + 1;
		setEstudios([
			...estudios,
			{
				id: newId,
				nivelEducativo: "",
				centroEstudios: "",
				tituloObtenido: "",
				fechaInicio: "",
				fechaFin: "",
				cursandoActualmente: false,
			},
		]);
	};

	const removeEstudio = (id) => {
		setEstudios(estudios.filter((estudio) => estudio.id !== id));
	};

	const handleEstudioChange = (id, field, value) => {
		setEstudios(
			estudios.map((estudio) =>
				estudio.id === id ? { ...estudio, [field]: value } : estudio
			)
		);
	};

	const moveEstudioUp = (index) => {
		if (index > 0) {
			const newEstudios = [...estudios];
			[newEstudios[index - 1], newEstudios[index]] = [newEstudios[index], newEstudios[index - 1]];
			setEstudios(newEstudios);
		}
	};

	const moveEstudioDown = (index) => {
		if (index < estudios.length - 1) {
			const newEstudios = [...estudios];
			[newEstudios[index], newEstudios[index + 1]] = [newEstudios[index + 1], newEstudios[index]];
			setEstudios(newEstudios);
		}
	};

	const sortEstudiosByDate = () => {
		const sorted = [...estudios].sort((a, b) => {
			if (!a.fechaInicio && !b.fechaInicio) return 0;
			if (!a.fechaInicio) return 1;
			if (!b.fechaInicio) return -1;
			return b.fechaInicio.localeCompare(a.fechaInicio);
		});
		setEstudios(sorted);
	};

	// Handlers para experiencias
	const addExperiencia = () => {
		const newId = Math.max(...experiencias.map((e) => e.id)) + 1;
		setExperiencias([
			...experiencias,
			{
				id: newId,
				puesto: "",
				empresa: "",
				fechaInicio: "",
				fechaFin: "",
				descripcion: "",
				trabajandoActualmente: false,
			},
		]);
	};

	const removeExperiencia = (id) => {
		setExperiencias(experiencias.filter((exp) => exp.id !== id));
	};

	const handleExperienciaChange = (id, field, value) => {
		setExperiencias(
			experiencias.map((exp) =>
				exp.id === id ? { ...exp, [field]: value } : exp
			)
		);
	};

	const moveExperienciaUp = (index) => {
		if (index > 0) {
			const newExperiencias = [...experiencias];
			[newExperiencias[index - 1], newExperiencias[index]] = [newExperiencias[index], newExperiencias[index - 1]];
			setExperiencias(newExperiencias);
		}
	};

	const moveExperienciaDown = (index) => {
		if (index < experiencias.length - 1) {
			const newExperiencias = [...experiencias];
			[newExperiencias[index], newExperiencias[index + 1]] = [newExperiencias[index + 1], newExperiencias[index]];
			setExperiencias(newExperiencias);
		}
	};

	const sortExperienciasByDate = () => {
		const sorted = [...experiencias].sort((a, b) => {
			if (!a.fechaInicio && !b.fechaInicio) return 0;
			if (!a.fechaInicio) return 1;
			if (!b.fechaInicio) return -1;
			return b.fechaInicio.localeCompare(a.fechaInicio);
		});
		setExperiencias(sorted);
	};

	// Handlers para idiomas
	const addIdioma = () => {
		const newId = Math.max(...idiomas.map((i) => i.id)) + 1;
		setIdiomas([
			...idiomas,
			{
				id: newId,
				nombre: "",
				nivel: "",
			},
		]);
	};

	const removeIdioma = (id) => {
		setIdiomas(idiomas.filter((idioma) => idioma.id !== id));
	};

	const handleIdiomaChange = (id, field, value) => {
		setIdiomas(
			idiomas.map((idioma) =>
				idioma.id === id ? { ...idioma, [field]: value } : idioma
			)
		);
	};

	const moveIdiomaUp = (index) => {
		if (index > 0) {
			const newIdiomas = [...idiomas];
			[newIdiomas[index - 1], newIdiomas[index]] = [newIdiomas[index], newIdiomas[index - 1]];
			setIdiomas(newIdiomas);
		}
	};

	const moveIdiomaDown = (index) => {
		if (index < idiomas.length - 1) {
			const newIdiomas = [...idiomas];
			[newIdiomas[index], newIdiomas[index + 1]] = [newIdiomas[index + 1], newIdiomas[index]];
			setIdiomas(newIdiomas);
		}
	};

	// Handlers para imagen de perfil
	const handleImageSelect = (e) => {
		const file = e.target.files[0];
		if (file) {
			// Validar tipo de archivo
			const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
			if (!validTypes.includes(file.type)) {
				setError('Por favor selecciona una imagen válida (JPEG, PNG o GIF)');
				return;
			}
			
			// Validar tamaño (máximo 2MB)
			if (file.size > 2 * 1024 * 1024) {
				setError('La imagen debe pesar menos de 2MB');
				return;
			}
			
			setProfileImage(file);
			
			// Crear URL de previsualización
			const reader = new FileReader();
			reader.onloadend = () => {
				setProfileImagePreview(reader.result);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleRemoveImage = async () => {
		// Si hay una imagen existente en el servidor, eliminarla
		if (existingProfileImage) {
			try {
				const response = await deleteProfileImage();
				if (response.success) {
					setExistingProfileImage(null);
					setSuccessMessage('Imagen de perfil eliminada correctamente');
					setTimeout(() => setSuccessMessage(null), 3000);
				}
			} catch (err) {
				setError('Error al eliminar la imagen de perfil');
			}
		}
		
		// Limpiar previsualización y archivo seleccionado
		setProfileImage(null);
		setProfileImagePreview(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handleChangeImage = () => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	const validarDni = (dni) => {
		//  Validación del formato
		const dniRegex = /^\d{8}[A-Z]$/i;
		const letrasDni = "TRWAGMYFPDXBNJZSQVHLCKE";
		const dniLimpio = dni.replace(/\s+/, "");
		if (!dniRegex.test(dniLimpio)) return false;

		//  Comparar la letra del DNI con la letra calculada
		const resto = parseInt(dniLimpio.slice(0, 8)) % 23;
		return letrasDni.charAt(resto) === dniLimpio.charAt(8);
	};

	const validarTelefono = (telefono) => {
		//  Validación del formato de teléfono
		const telefonoLimpio = telefono.replace(/\s+/, "");
		const telefonoRegex = /^(6|7|8|9)\d{8}$/;
		return telefonoRegex.test(telefonoLimpio);
	};

	//  Errores en el formulario
	const [errores, setErrores] = useState({
		datosPersonales: {},
		formaciones: [],
		experiencias: [],
		idiomas: [],
	});

	const validarFormulario = () => {
		const nuevosErrores = {
			datosPersonales: {},
			formaciones: [],
			experiencias: [],
			idiomas: [],
		};

		// Datos personales obligatorios
		if (!datosPersonales.nombre.trim())
			nuevosErrores.datosPersonales.nombre = "El nombre es obligatorio";
		if (!datosPersonales.apellidos.trim())
			nuevosErrores.datosPersonales.apellidos =
				"Los apellidos son obligatorios";
		if (!datosPersonales.ciudad.trim())
			nuevosErrores.datosPersonales.ciudad = "La ciudad es obligatoria";
		if (!validarDni(datosPersonales.dniNie))
			nuevosErrores.datosPersonales.dniNie = "El DNI/NIE no es válido";
		if (!datosPersonales.fechaNacimiento)
			nuevosErrores.datosPersonales.fechaNacimiento =
				"La fecha de nacimiento es obligatoria";
		if (!validarTelefono(datosPersonales.telefono))
			nuevosErrores.datosPersonales.telefono = "El teléfono no es válido";

		//  Formación
		estudios.forEach((formacion, index) => {
			const nivel = formacion.nivelEducativo?.trim() || "";
			const centro = formacion.centroEstudios?.trim() || "";
			const titulo = formacion.tituloObtenido?.trim() || "";
			const fechaInicio = formacion.fechaInicio?.trim() || "";
			const fechaFin = formacion.fechaFin?.trim() || "";
			if (nivel || centro || titulo || fechaInicio || fechaFin) {
				if (!nivel) {
					nuevosErrores.formaciones[`nivelEducativo_${index}`] =
						"El nivel educativo es obligatorio";
				}

				if (!formacion.centroEstudios) {
					nuevosErrores.formaciones[`centroEstudios_${index}`] =
						"El centro de estudios es obligatorio";
				}

				if (!titulo) {
					nuevosErrores.formaciones[`tituloObtenido_${index}`] =
						"El título obtenido es obligatorio";
				}

				if (!fechaInicio) {
					nuevosErrores.formaciones[`fechaInicio_${index}`] =
						"La fecha de inicio es obligatoria";
				}
			}
		});

		//  Experiencia
		experiencias.forEach((experiencia, index) => {
			const puesto = experiencia.puesto?.trim() || "";
			const empresa = experiencia.empresa?.trim() || "";
			const fechaInicio = experiencia.fechaInicio?.trim() || "";
			const fechaFin = experiencia.fechaFin?.trim() || "";
			const descripcion = experiencia.descripcion?.trim() || "";
			if (puesto || empresa || fechaInicio || fechaFin || descripcion) {
				if (!puesto) {
					nuevosErrores.experiencias[`puesto_${index}`] =
						"El puesto es obligatorio";
				}

				if (!empresa) {
					nuevosErrores.experiencias[`empresa_${index}`] =
						"La empresa es obligatoria";
				}

				if (!fechaInicio) {
					nuevosErrores.experiencias[`fechaInicio_${index}`] =
						"La fecha de inicio es obligatoria";
				}
			}
		});

		//  Idiomas
		idiomas.forEach((idioma, index) => {
			const idiomaSeleccionado = idioma.nombre?.trim() || "";
			const nivel = idioma.nivel?.trim() || "";
			if (idiomaSeleccionado || nivel) {
				if (!idiomaSeleccionado) {
					nuevosErrores.idiomas[`idioma_${index}`] = "Introduce un idioma";
				}
				if (!nivel) {
					nuevosErrores.idiomas[`nivel_${index}`] = "Selecciona un nivel";
				}
			}
		});

		setErrores(nuevosErrores);
		return (
			Object.keys(nuevosErrores.datosPersonales).length === 0 &&
			Object.keys(nuevosErrores.formaciones).length === 0 &&
			Object.keys(nuevosErrores.experiencias).length === 0 &&
			Object.keys(nuevosErrores.idiomas).length === 0
		);
	};

	// Handler para guardar
	const handleSave = async (e) => {
		e.preventDefault();
		if (!validarFormulario()) {
			setTimeout(() => scrollToFirstError(), 0);
			return;
		}
		setSaving(true);
		setError(null);
		setSuccessMessage(null);

		try {
			const perfilData = {
				informacion_personal: {
					nombre: datosPersonales.nombre,
					apellidos: datosPersonales.apellidos,
					ciudad: datosPersonales.ciudad,
					dni: datosPersonales.dniNie,
					fecha_nacimiento: datosPersonales.fechaNacimiento,
					telefono: datosPersonales.telefono,
				},

				formacion: estudios
					.filter(
						(estudio) =>
							estudio.nivelEducativo &&
							estudio.centroEstudios &&
							estudio.tituloObtenido &&
							estudio.fechaInicio
					)
					.map((estudio) => ({
						id: estudio.id, // Incluir ID para evitar duplicados
						nivel: estudio.nivelEducativo,
						centro_estudios: estudio.centroEstudios,
						titulo_obtenido: estudio.tituloObtenido,
						fecha_inicio: estudio.fechaInicio
							? `${estudio.fechaInicio}-01`
							: null,
						fecha_fin: estudio.fechaFin
							? `${estudio.fechaFin}-28`
							: null,
						cursando_actualmente: estudio.cursandoActualmente,
					})),
				experiencia_laboral: experiencias
					.filter((exp) => exp.puesto && exp.empresa && exp.fechaInicio)
					.map((exp) => ({
						id: exp.id, // Incluir ID para evitar duplicados
						puesto: exp.puesto,
						empresa: exp.empresa,
						fecha_inicio: exp.fechaInicio
							? `${exp.fechaInicio}-01`
							: null,
						fecha_fin: exp.fechaFin ? `${exp.fechaFin}-28` : null,
						descripcion: exp.descripcion,
						trabajando_actualmente: exp.trabajandoActualmente,
					})),
				idiomas: idiomas
					.filter((idioma) => idioma.nombre && idioma.nivel)
					.map((idioma) => ({
						id: idioma.id, // Incluir ID para evitar duplicados
						idioma: idioma.nombre,
						nivel: idioma.nivel,
					})),
				habilidades_intereses: {
					habilidades: habilidadesList,
					intereses: interesesList,
				},
			};

			// Llamada al backend
			let response;
			if (profileImage) {
				// Si hay imagen nueva, usar FormData
				response = await updateProfileWithImage(perfilData, profileImage);
			} else {
				// Si no hay imagen nueva, usar JSON normal
				response = await updateProfile(perfilData);
			}

			// Mostrar mensaje de éxito en la interfaz
			if (response.success) {
				let mensaje = "¡Perfil guardado correctamente! Tus datos han sido actualizados.";
				
				// Si se guardó una imagen, actualizar el estado y agregar al mensaje
				if (profileImage && response.profile_image) {
					mensaje = "¡Perfil actualizado! Imagen de perfil actualizada correctamente.";
					setExistingProfileImage(response.profile_image);
					setProfileImagePreview(null);
					setProfileImage(null);
				}
				
				setSuccessMessage(mensaje);

				// Limpiar el mensaje después de 5 segundos
				setTimeout(() => {
					setSuccessMessage(null);
				}, 5000);

				// 🔔 Emitir evento para que otros componentes sepan que el perfil cambió
				// Esto permite actualizar comparaciones de profesiones en tiempo real
				const profileUpdateEvent = new CustomEvent('profile-updated', {
					detail: {
						timestamp: Date.now(),
						sections: ['habilidades', 'formaciones', 'intereses']
					}
				});
				window.dispatchEvent(profileUpdateEvent);

				// También actualizar localStorage para sincronizar entre pestañas
				try {
					localStorage.setItem('profile_updated_timestamp', Date.now().toString());
				} catch (e) {
					console.warn('No se pudo actualizar localStorage', e);
				}

				console.log('✅ Evento de actualización de perfil emitido');
			} else {
				const errorMsg = response.error || response.message || "Error al guardar el perfil";
				const errorDetails = response.details ? JSON.stringify(response.details) : '';
				setError(errorMsg + (errorDetails ? ': ' + errorDetails : ''));
			}
		} catch (err) {
			setError("Error guardando perfil: " + err.message);
		} finally {
			setSaving(false);
		}
	};

	if (!isAuthenticated) return null;

	// Calcular datos para el resumen profesional
	const ultimoEstudio = estudios
		.filter(e => e.tituloObtenido && e.nivelEducativo)
		.sort((a, b) => {
			if (!a.fechaFin) return -1;
			if (!b.fechaFin) return 1;
			return b.fechaFin.localeCompare(a.fechaFin);
		})[0];
	
	const habilidadesDestacadas = habilidadesList.slice(0, 3);
	const idiomaDestacado = idiomas
		.filter(i => i.nombre && i.nivel)
		.sort((a, b) => {
			const niveles = { nativo: 4, avanzado: 3, intermedio: 2, basico: 1 };
			return (niveles[b.nivel] || 0) - (niveles[a.nivel] || 0);
		})[0];

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto space-y-8">
				{/* Header mejorado */}
				<div className="text-center">
					<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-green-600 mb-4 shadow-xl">
						<User className="w-10 h-10 text-white" />
					</div>
					<h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-purple-700 to-green-600 bg-clip-text text-transparent mb-3">
						Mi Perfil Profesional
					</h1>
					<p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
						Completa tu información para recibir recomendaciones vocacionales más personalizadas y precisas
					</p>
				</div>

				{/* RESUMEN PROFESIONAL - Tarjeta destacada */}
				{(datosPersonales.nombre || ultimoEstudio || habilidadesDestacadas.length > 0 || idiomaDestacado) && (
					<div className="bg-gradient-to-r from-purple-600 to-green-600 p-[2px] rounded-2xl shadow-2xl transform hover:scale-[1.01] transition-transform duration-200">
						<div className="bg-white rounded-2xl p-6">
							<div className="flex items-start gap-4">
								<div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-green-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0">
									{datosPersonales.nombre ? datosPersonales.nombre.charAt(0).toUpperCase() : '?'}
								</div>
								<div className="flex-1 min-w-0">
									<h2 className="text-2xl font-bold text-gray-900 truncate">
										{datosPersonales.nombre && datosPersonales.apellidos 
											? `${datosPersonales.nombre} ${datosPersonales.apellidos}`
											: 'Tu Perfil Profesional'}
									</h2>
									{datosPersonales.ciudad && (
										<p className="text-gray-600 mt-1 flex items-center gap-2">
											<Globe className="w-4 h-4 flex-shrink-0" />
											<span>{datosPersonales.ciudad}</span>
										</p>
									)}
									
									<div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
										{ultimoEstudio && (
											<div className="bg-green-50 rounded-lg p-3 border border-green-200 hover:border-green-300 transition-colors">
												<div className="flex items-center gap-2 text-green-700 text-xs font-semibold mb-1">
													<GraduationCap className="w-3 h-3" />
													Formación
												</div>
												<p className="text-sm font-medium text-gray-900 truncate" title={ultimoEstudio.tituloObtenido}>
													{ultimoEstudio.tituloObtenido}
												</p>
											</div>
										)}
										
										{habilidadesDestacadas.length > 0 && (
											<div className="bg-purple-50 rounded-lg p-3 border border-purple-200 hover:border-purple-300 transition-colors">
												<div className="flex items-center gap-2 text-purple-700 text-xs font-semibold mb-1">
													<Brain className="w-3 h-3" />
													Habilidades
												</div>
												<p className="text-sm font-medium text-gray-900 truncate" title={habilidadesDestacadas.join(', ')}>
													{habilidadesDestacadas.join(', ')}
												</p>
											</div>
										)}
										
										{idiomaDestacado && (
											<div className="bg-blue-50 rounded-lg p-3 border border-blue-200 hover:border-blue-300 transition-colors">
												<div className="flex items-center gap-2 text-blue-700 text-xs font-semibold mb-1">
													<Globe className="w-3 h-3" />
													Idioma destacado
												</div>
												<p className="text-sm font-medium text-gray-900 capitalize">
													{idiomaDestacado.nombre} - {idiomaDestacado.nivel}
												</p>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* IMAGEN DE PERFIL */}
				<div className="bg-white shadow-lg shadow-purple-100/50 rounded-xl p-8 border border-purple-100/50 hover:shadow-xl hover:shadow-purple-200/50 transition-all duration-300">
					<div className="flex items-center gap-4 mb-6">
						<div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
							<Camera className="w-6 h-6 text-white" />
						</div>
						<div>
							<h2 className="text-2xl font-bold text-gray-900">Foto de Perfil</h2>
							<p className="text-sm text-gray-500">Personaliza tu perfil con una imagen</p>
						</div>
					</div>

					<div className="flex flex-col md:flex-row items-center gap-6">
						{/* Previsualización de la imagen */}
						<div className="relative">
							<div className="w-32 h-32 rounded-full border-4 border-purple-200 shadow-lg overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
								{profileImagePreview ? (
									<img
										src={profileImagePreview}
										alt="Previsualización"
										className="w-full h-full object-cover"
									/>
								) : existingProfileImage ? (
									<img
										src={existingProfileImage}
										alt="Imagen de perfil"
										className="w-full h-full object-cover"
									/>
								) : (
									<User className="w-16 h-16 text-purple-300" />
								)}
							</div>
							{(profileImagePreview || existingProfileImage) && (
								<button
									type="button"
									onClick={handleRemoveImage}
									className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-110"
									title="Eliminar imagen"
								>
									<X className="w-4 h-4" />
								</button>
							)}
						</div>

						{/* Controles */}
						<div className="flex-1">
							<input
								ref={fileInputRef}
								type="file"
								accept="image/jpeg,image/jpg,image/png,image/gif"
								onChange={handleImageSelect}
								className="hidden"
							/>
							
							{!profileImagePreview && !existingProfileImage ? (
								<button
									type="button"
									onClick={handleChangeImage}
									className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
								>
									<Upload className="w-5 h-5" />
									Subir imagen
								</button>
							) : (
								<button
									type="button"
									onClick={handleChangeImage}
									className="inline-flex items-center gap-2 px-6 py-3 bg-purple-50 text-purple-700 font-semibold rounded-lg border-2 border-purple-200 hover:bg-purple-100 hover:border-purple-300 transition-all duration-200"
								>
									<Camera className="w-5 h-5" />
									Cambiar imagen
								</button>
							)}
							
							<p className="mt-3 text-sm text-gray-500">
								Formatos: JPEG, PNG, GIF • Tamaño máximo: 2MB
							</p>
						</div>
					</div>
				</div>

				{/* Toast de éxito flotante */}
				{successMessage && (
					<div className="fixed top-24 right-4 z-50 animate-slide-in-right">
						<div className="bg-white border-l-4 border-green-500 rounded-lg shadow-2xl p-4 max-w-md">
							<div className="flex items-start gap-3">
								<div className="flex-shrink-0">
									<div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
										<CheckCircle className="w-6 h-6 text-green-600" />
									</div>
								</div>
								<div className="flex-1">
									<h3 className="text-sm font-bold text-gray-900">¡Perfil actualizado!</h3>
									<p className="mt-1 text-sm text-gray-600">{successMessage}</p>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Toast de error */}
				{error && (
					<div className="fixed top-24 right-4 z-50 animate-slide-in-right">
						<div className="bg-white border-l-4 border-red-500 rounded-lg shadow-2xl p-4 max-w-md">
							<div className="flex items-start gap-3">
								<div className="flex-shrink-0">
									<div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
										<span className="text-red-600 font-bold text-xl">!</span>
									</div>
								</div>
								<div className="flex-1">
									<h3 className="text-sm font-bold text-gray-900">Error al guardar</h3>
									<p className="mt-1 text-sm text-gray-600">{error}</p>
								</div>
							</div>
						</div>
					</div>
				)}

				<form onSubmit={handleSave} className="space-y-6">
					{/* 1. DATOS PERSONALES */}
					<div className="bg-white shadow-lg shadow-purple-100/50 rounded-xl p-8 border border-purple-100/50 hover:shadow-xl hover:shadow-purple-200/50 transition-all duration-300">
						<div className="flex items-center gap-4 mb-8">
							<div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
								<User className="w-6 h-6 text-white" />
							</div>
							<div>
								<h2 className="text-2xl font-bold text-gray-900">
									Datos Personales
								</h2>
								<p className="text-sm text-gray-500">Información básica sobre ti</p>
							</div>
						</div>

						{/* Información Básica */}
						<div className="mb-6">
							<h4 className="text-sm font-bold text-purple-700 uppercase tracking-wide mb-4 flex items-center gap-2">
								<div className="w-1 h-4 bg-purple-600 rounded"></div>
								Información Básica
							</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Nombre *
								</label>
								<input
									type="text"
									name="nombre"
									value={datosPersonales.nombre}
									onChange={handleDatosPersonalesChange}
									required
									className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
									placeholder="Tu nombre"
								/>
								{errores.datosPersonales && errores.datosPersonales.nombre && (
									<span className="text-red-500 text-sm">
										{errores.datosPersonales.nombre}
									</span>
								)}
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Apellidos *
								</label>
								<input
									type="text"
									name="apellidos"
									value={datosPersonales.apellidos}
									onChange={handleDatosPersonalesChange}
									required
									className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
									placeholder="Tus apellidos"
								/>
								{errores.datosPersonales &&
									errores.datosPersonales.apellidos && (
										<span className="text-red-500 text-sm">
											{errores.datosPersonales.apellidos}
										</span>
									)}
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Ciudad *
								</label>
								<input
									type="text"
									name="ciudad"
									value={datosPersonales.ciudad}
									onChange={handleDatosPersonalesChange}
									required
									className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
									placeholder="Tu ciudad"
								/>
								{errores.datosPersonales && errores.datosPersonales.ciudad && (
									<span className="text-red-500 text-sm">
										{errores.datosPersonales.ciudad}
									</span>
								)}
							</div>
						</div>
					</div>

					{/* Separador */}
					<div className="border-t border-purple-100 my-6"></div>

					{/* Identificación */}
					<div className="mb-6">
						<h4 className="text-sm font-bold text-purple-700 uppercase tracking-wide mb-4 flex items-center gap-2">
							<div className="w-1 h-4 bg-purple-600 rounded"></div>
							Identificación
						</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									DNI/NIE*
								</label>
								<input
									type="text"
									name="dniNie"
									value={datosPersonales.dniNie}
									onChange={handleDatosPersonalesChange}
									className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
																					errores.datosPersonales?.dniNie
																						? "border-red-500 focus:ring-red-500 focus:border-red-500"
																						: "border-gray-200 focus:ring-purple-500 focus:border-purple-500"
																				}`}
									placeholder="12345678X"
								/>
								{errores.datosPersonales && errores.datosPersonales.dniNie && (
									<span className="text-red-500 text-sm">
										{errores.datosPersonales.dniNie}
									</span>
								)}
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Fecha de nacimiento*
								</label>
								<DatePicker
									name="fechaNacimiento"
									value={datosPersonales.fechaNacimiento}
									onChange={handleDatosPersonalesChange}
									hasError={errores.datosPersonales?.fechaNacimiento}
									placeholder="Selecciona tu fecha de nacimiento"
								/>
								{errores.datosPersonales &&
									errores.datosPersonales.fechaNacimiento && (
										<span className="text-red-500 text-sm">
											{errores.datosPersonales.fechaNacimiento}
										</span>
									)}
							</div>
						</div>
					</div>

					{/* Separador */}
					<div className="border-t border-purple-100 my-6"></div>

					{/* Contacto */}
					<div>
						<h4 className="text-sm font-bold text-purple-700 uppercase tracking-wide mb-4 flex items-center gap-2">
							<div className="w-1 h-4 bg-purple-600 rounded"></div>
							Contacto
						</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Teléfono*
								</label>
								<input
									type="text"
									name="telefono"
									value={datosPersonales.telefono}
									onChange={handleDatosPersonalesChange}
									className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
																					errores.datosPersonales?.telefono
																						? "border-red-500 focus:ring-red-500 focus:border-red-500"
																						: "border-gray-200 focus:ring-purple-500 focus:border-purple-500"
																				}`}
									placeholder="612345678"
								/>
								{errores.datosPersonales &&
									errores.datosPersonales.telefono && (
										<span className="text-red-500 text-sm">
											{errores.datosPersonales.telefono}
										</span>
									)}
							</div>
						</div>
					</div>
					</div>

					{/* 2. FORMACIÓN ACADÉMICA */}
					<div className="bg-white shadow-lg shadow-green-100/50 rounded-xl p-8 border border-green-100/50 hover:shadow-xl hover:shadow-green-200/50 transition-all duration-300">
						<div className="flex items-center justify-between mb-8">
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow-lg">
									<GraduationCap className="w-6 h-6 text-white" />
								</div>
								<div>
									<h2 className="text-2xl font-bold text-gray-900">
										Formación Académica
									</h2>
									<p className="text-sm text-gray-500">Tus estudios y títulos obtenidos</p>
								</div>
							</div>
							{estudios.length > 1 && (
								<button
									type="button"
									onClick={sortEstudiosByDate}
									className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-all duration-200"
									title="Ordenar por fecha (más reciente primero)"
								>
									<ArrowUpDown className="w-4 h-4" />
									Ordenar por fecha
								</button>
							)}
						</div>

						<div className="space-y-3">
							{estudios.map((estudio, index) => {
								const isExpanded = expandedFormaciones.has(estudio.id);
								const nivelTexto = {
									secundaria: "ESO",
									bachillerato: "Bachillerato",
									fp_medio: "Grado Medio",
									fp_superior: "Grado Superior",
									universitario: "Grado Universitario",
									master: "Máster",
									doctorado: "Doctorado",
								}[estudio.nivelEducativo] || "Sin especificar";

								return (
									<div
										key={estudio.id}
										className="border-2 border-green-100 rounded-xl overflow-hidden bg-gradient-to-br from-green-50/30 to-white hover:border-green-300 transition-all duration-200"
									>
										{/* Header del acordeón - siempre visible */}
										<div className="w-full px-6 py-4 flex items-center justify-between hover:bg-green-50/50 transition-colors duration-200">
											<button
												type="button"
												onClick={() => toggleFormacion(estudio.id)}
												className="flex-1 flex items-center gap-4 text-left"
											>
												<div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center shadow-md">
													<GraduationCap className="w-5 h-5 text-white" />
												</div>
												<div>
													<div className="font-semibold text-gray-900">
														{nivelTexto}
														{estudio.tituloObtenido && (
															<span className="text-green-600"> • {estudio.tituloObtenido}</span>
														)}
													</div>
													<div className="text-sm text-gray-500">
														{estudio.centroEstudios || "Centro no especificado"}
														{(estudio.fechaInicio || estudio.fechaFin) && (
															<span className="ml-2">
																| {estudio.fechaInicio ? new Date(estudio.fechaInicio + '-01').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : '...'} 
																{' → '}
																{estudio.fechaFin ? new Date(estudio.fechaFin + '-01').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : 'Actualidad'}
															</span>
														)}
													</div>
												</div>
											</button>
											<div className="flex items-center gap-2">
												{estudios.length > 1 && (
													<>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																moveEstudioUp(index);
															}}
															disabled={index === 0}
															className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
															title="Mover arriba"
														>
															<ArrowUp className="w-4 h-4" />
														</button>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																moveEstudioDown(index);
															}}
															disabled={index === estudios.length - 1}
															className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
															title="Mover abajo"
														>
															<ArrowDown className="w-4 h-4" />
														</button>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																removeEstudio(estudio.id);
															}}
															className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
															title="Eliminar"
														>
															<Trash2 className="w-4 h-4" />
														</button>
													</>
												)}
												<button
													type="button"
													onClick={() => toggleFormacion(estudio.id)}
													className="p-2"
												>
													{isExpanded ? (
														<ChevronUp className="w-5 h-5 text-green-600" />
													) : (
														<ChevronDown className="w-5 h-5 text-green-600" />
													)}
												</button>
											</div>
										</div>										{/* Contenido expandible */}
										{isExpanded && (
											<div className="px-6 pb-6 pt-2 border-t border-green-100 bg-white/50 animate-fadeIn">
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													<div>
														<label className="block text-sm font-semibold text-gray-700 mb-2">
															Nivel educativo *
														</label>
														<select
															value={estudio.nivelEducativo}
															onChange={(e) =>
																handleEstudioChange(
																	estudio.id,
																	"nivelEducativo",
																	e.target.value
																)
															}
															className={`w-full px-3 py-2 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 ${
																errores.formaciones?.[
																	`nivelEducativo_${index}`
																]
																	? "border-red-500 focus:border-red-500"
																	: "border-gray-200 focus:border-green-500"
															}`}
														>
															<option value="">Seleccionar nivel</option>
															<option value="secundaria">ESO</option>
															<option value="bachillerato">Bachillerato</option>
															<option value="fp_medio">Grado Medio</option>
															<option value="fp_superior">Grado Superior</option>
															<option value="universitario">
																Grado Universitario
															</option>
															<option value="master">Máster</option>
															<option value="doctorado">Doctorado</option>
														</select>
														{errores.formaciones &&
															errores.formaciones[`nivelEducativo_${index}`] && (
																<span className="text-red-500 text-sm mt-1 block">
																	{errores.formaciones[`nivelEducativo_${index}`]}
																</span>
															)}
													</div>

													<div>
														<label className="block text-sm font-semibold text-gray-700 mb-2">
															Centro de estudios *
														</label>
														<input
															type="text"
															value={estudio.centroEstudios}
															onChange={(e) =>
																handleEstudioChange(
																	estudio.id,
																	"centroEstudios",
																	e.target.value
																)
															}
															className={`w-full px-3 py-2 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 ${
																errores.formaciones?.[
																	`centroEstudios_${index}`
																]
																	? "border-red-500 focus:border-red-500"
																	: "border-gray-200 focus:border-green-500"
															}`}
															placeholder="Nombre del centro"
														/>
														{errores.formaciones &&
															errores.formaciones[`centroEstudios_${index}`] && (
																<span className="text-red-500 text-sm mt-1 block">
																	{errores.formaciones[`centroEstudios_${index}`]}
																</span>
															)}
													</div>

													{/* Título obtenido ocupa toda la fila */}
													<div className="md:col-span-2">
														<label className="block text-sm font-semibold text-gray-700 mb-2">
															Título Obtenido *
														</label>
														<input
															type="text"
															value={estudio.tituloObtenido}
															onChange={(e) =>
																handleEstudioChange(
																	estudio.id,
																	"tituloObtenido",
																	e.target.value
																)
															}
															className={`w-full px-3 py-2 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 ${
																errores.formaciones?.[
																	`tituloObtenido_${index}`
																]
																	? "border-red-500 focus:border-red-500"
																	: "border-gray-200 focus:border-green-500"
															}`}
															placeholder="Nombre del título"
														/>
														{errores.formaciones &&
															errores.formaciones[`tituloObtenido_${index}`] && (
																<span className="text-red-500 text-sm mt-1 block">
																	{errores.formaciones[`tituloObtenido_${index}`]}
																</span>
															)}
													</div>

													{/* Fechas mitad y mitad */}
													<div>
														<label className="block text-sm font-semibold text-gray-700 mb-2">
															Fecha Inicio *
														</label>
														<MonthYearPicker
															value={estudio.fechaInicio}
															onChange={(e) =>
																handleEstudioChange(
																	estudio.id,
																	"fechaInicio",
																	e.target.value
																)
															}
															hasError={errores.formaciones?.[`fechaInicio_${index}`]}
															placeholder="Selecciona mes y año"
														/>
														{errores.formaciones &&
															errores.formaciones[`fechaInicio_${index}`] && (
																<span className="text-red-500 text-sm mt-1 block">
																	{errores.formaciones[`fechaInicio_${index}`]}
																</span>
															)}
													</div>

													<div>
														<label className="block text-sm font-semibold text-gray-700 mb-2">
															Fecha Fin
														</label>
														<MonthYearPicker
															value={estudio.fechaFin}
															onChange={(e) =>
																handleEstudioChange(
																	estudio.id,
																	"fechaFin",
																	e.target.value
																)
															}
															placeholder="Selecciona mes y año"
														/>
													</div>
												</div>
											</div>
										)}
									</div>
								);
							})}

							<button
								type="button"
								onClick={addEstudio}
								className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-green-300 text-green-600 bg-green-50 rounded-xl hover:bg-green-100 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
							>
								<Plus className="w-5 h-5" />
								<span className="font-semibold">Añadir estudio</span>
							</button>
						</div>
					</div>

					{/* 3. EXPERIENCIA LABORAL */}
					<div className="bg-white shadow-lg shadow-purple-100/50 rounded-xl p-8 border border-purple-100/50 hover:shadow-xl hover:shadow-purple-200/50 transition-all duration-300">
						<div className="flex items-center justify-between mb-8">
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
									<Briefcase className="w-6 h-6 text-white" />
								</div>
								<div>
									<h2 className="text-2xl font-bold text-gray-900">
										Experiencia Laboral
									</h2>
									<p className="text-sm text-gray-500">Tu trayectoria profesional</p>
								</div>
							</div>
							{experiencias.length > 1 && (
								<button
									type="button"
									onClick={sortExperienciasByDate}
									className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-all duration-200"
									title="Ordenar por fecha (más reciente primero)"
								>
									<ArrowUpDown className="w-4 h-4" />
									Ordenar por fecha
								</button>
							)}
						</div>

						<div className="space-y-3">
							{experiencias.map((experiencia, index) => {
								const isExpanded = expandedExperiencias.has(experiencia.id);

								return (
									<div
										key={experiencia.id}
										className="border-2 border-purple-100 rounded-xl overflow-hidden bg-gradient-to-br from-purple-50/30 to-white hover:border-purple-300 transition-all duration-200"
									>
										{/* Header del acordeón - siempre visible */}
										<div className="w-full px-6 py-4 flex items-center justify-between hover:bg-purple-50/50 transition-colors duration-200">
											<button
												type="button"
												onClick={() => toggleExperiencia(experiencia.id)}
												className="flex-1 flex items-center gap-4 text-left"
											>
												<div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 flex items-center justify-center shadow-md">
													<Briefcase className="w-5 h-5 text-white" />
												</div>
												<div>
													<div className="font-semibold text-gray-900">
														{experiencia.puesto || "Puesto no especificado"}
														{experiencia.empresa && (
															<span className="text-purple-600"> • {experiencia.empresa}</span>
														)}
													</div>
													<div className="text-sm text-gray-500">
														{(experiencia.fechaInicio || experiencia.fechaFin) && (
															<span>
																{experiencia.fechaInicio ? new Date(experiencia.fechaInicio + '-01').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : '...'} 
																{' → '}
																{experiencia.fechaFin ? new Date(experiencia.fechaFin + '-01').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : 'Actualidad'}
															</span>
														)}
													</div>
												</div>
											</button>
											<div className="flex items-center gap-2">
												{experiencias.length > 1 && (
													<>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																moveExperienciaUp(index);
															}}
															disabled={index === 0}
															className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
															title="Mover arriba"
														>
															<ArrowUp className="w-4 h-4" />
														</button>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																moveExperienciaDown(index);
															}}
															disabled={index === experiencias.length - 1}
															className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
															title="Mover abajo"
														>
															<ArrowDown className="w-4 h-4" />
														</button>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																removeExperiencia(experiencia.id);
															}}
															className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
															title="Eliminar"
														>
															<Trash2 className="w-4 h-4" />
														</button>
													</>
												)}
												<button
													type="button"
													onClick={() => toggleExperiencia(experiencia.id)}
													className="p-2"
												>
													{isExpanded ? (
														<ChevronUp className="w-5 h-5 text-purple-600" />
													) : (
														<ChevronDown className="w-5 h-5 text-purple-600" />
													)}
												</button>
											</div>
										</div>										{/* Contenido expandible */}
										{isExpanded && (
											<div className="px-6 pb-6 pt-2 border-t border-purple-100 bg-white/50 animate-fadeIn">
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													<div>
														<label className="block text-sm font-semibold text-gray-700 mb-2">
															Puesto *
														</label>
														<input
															type="text"
															value={experiencia.puesto}
															onChange={(e) =>
																handleExperienciaChange(
																	experiencia.id,
																	"puesto",
																	e.target.value
																)
															}
															className={`w-full px-3 py-2 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
																errores.experiencias?.[
																	`puesto_${index}`
																]
																	? "border-red-500 focus:border-red-500"
																	: "border-gray-200 focus:border-purple-500"
															}`}
															placeholder="Desarrollador, Analista, etc."
														/>
														{errores.experiencias &&
															errores.experiencias[`puesto_${index}`] && (
																<span className="text-red-500 text-sm mt-1 block">
																	{errores.experiencias[`puesto_${index}`]}
																</span>
															)}
													</div>

													<div>
														<label className="block text-sm font-semibold text-gray-700 mb-2">
															Empresa *
														</label>
														<input
															type="text"
															value={experiencia.empresa}
															onChange={(e) =>
																handleExperienciaChange(
																	experiencia.id,
																	"empresa",
																	e.target.value
																)
															}
															className={`w-full px-3 py-2 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
																errores.experiencias?.[
																	`empresa_${index}`
																]
																	? "border-red-500 focus:border-red-500"
																	: "border-gray-200 focus:border-purple-500"
															}`}
															placeholder="Nombre de la empresa"
														/>
														{errores.experiencias &&
															errores.experiencias[`empresa_${index}`] && (
																<span className="text-red-500 text-sm mt-1 block">
																	{errores.experiencias[`empresa_${index}`]}
																</span>
															)}
													</div>

													<div>
														<label className="block text-sm font-semibold text-gray-700 mb-2">
															Fecha Inicio *
														</label>
														<MonthYearPicker
															value={experiencia.fechaInicio}
															onChange={(e) =>
																handleExperienciaChange(
																	experiencia.id,
																	"fechaInicio",
																	e.target.value
																)
															}
															hasError={errores.experiencias?.[`fechaInicio_${index}`]}
															placeholder="Selecciona mes y año"
														/>
														{errores.experiencias &&
															errores.experiencias[`fechaInicio_${index}`] && (
																<span className="text-red-500 text-sm mt-1 block">
																	{errores.experiencias[`fechaInicio_${index}`]}
																</span>
															)}
													</div>

													<div>
														<label className="block text-sm font-semibold text-gray-700 mb-2">
															Fecha Fin
														</label>
														<MonthYearPicker
															value={experiencia.fechaFin}
															onChange={(e) =>
																handleExperienciaChange(
																	experiencia.id,
																	"fechaFin",
																	e.target.value
																)
															}
															placeholder="Selecciona mes y año"
														/>
													</div>

													<div className="md:col-span-2">
														<label className="block text-sm font-semibold text-gray-700 mb-2">
															Descripción breve
														</label>
														<textarea
															value={experiencia.descripcion}
															onChange={(e) =>
																handleExperienciaChange(
																	experiencia.id,
																	"descripcion",
																	e.target.value
																)
															}
															rows="3"
															className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
															placeholder="Describe tus responsabilidades y logros principales..."
														/>
													</div>
												</div>
											</div>
										)}
									</div>
								);
							})}

							<button
								type="button"
								onClick={addExperiencia}
								className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-purple-300 text-purple-600 bg-purple-50 rounded-xl hover:bg-purple-100 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
							>
								<Plus className="w-5 h-5" />
								<span className="font-semibold">Añadir experiencia</span>
							</button>
						</div>
					</div>

					{/* 4. HABILIDADES */}
					<div className="bg-white shadow-lg shadow-purple-100/50 rounded-xl p-8 border border-purple-100/50 hover:shadow-xl hover:shadow-purple-200/50 transition-all duration-300">
						<div className="flex items-center gap-4 mb-8">
							<div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
								<Brain className="w-6 h-6 text-white" />
							</div>
							<div>
								<h2 className="text-2xl font-bold text-gray-900">
									Habilidades
								</h2>
								<p className="text-sm text-gray-500">Competencias y destrezas profesionales</p>
							</div>
						</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2">
							Añadir habilidad (pulsa Enter)
						</label>
						<input
							type="text"
							placeholder="Ej: Trabajo en equipo, Liderazgo, Programación, Análisis de datos..."
							value={habilidadInput}
							onChange={(e) => setHabilidadInput(e.target.value)}
							onKeyDown={handleAddHabilidad}
							className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
						/>

						{/* Sugerencias clicables */}
						{habilidadesList.length < 8 && (
							<div className="mt-3">
								<p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
									<Sparkles className="w-3 h-3" />
									Sugerencias populares:
								</p>
								<div className="flex flex-wrap gap-2">
									{habilidadesSugeridas
										.filter(sug => !habilidadesList.some(h => h.toLowerCase() === sug.toLowerCase()))
										.slice(0, 8)
										.map((sugerencia, index) => (
											<button
												key={index}
												type="button"
												onClick={() => handleAddHabilidadSugerida(sugerencia)}
												className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-full hover:bg-purple-100 hover:border-purple-300 hover:shadow-sm transition-all duration-200 transform hover:scale-105"
											>
												+ {sugerencia}
											</button>
										))}
								</div>
							</div>
						)}							<div className="mt-4 flex flex-wrap gap-2">
								{habilidadesList.map((habilidad, index) => (
									<span
										key={index}
										className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium border border-purple-200 hover:border-purple-300 hover:shadow-md transform hover:scale-105 transition-all duration-200 animate-fadeIn"
									>
										<Sparkles className="w-3 h-3" />
										{habilidad}
										<button
											type="button"
											onClick={() => handleRemoveHabilidad(index)}
											className="ml-1 w-5 h-5 rounded-full bg-purple-200 hover:bg-purple-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
											aria-label="Eliminar habilidad"
										>
											<X className="w-3 h-3 text-purple-700" />
										</button>
									</span>
								))}
							</div>
							{habilidadesList.length === 0 && (
								<p className="mt-3 text-sm text-gray-500 italic">
									No has añadido habilidades aún. Presiona Enter después de escribir cada una.
								</p>
							)}
						</div>
					</div>

					{/* 5. IDIOMAS */}
					<div className="bg-white shadow-lg shadow-blue-100/50 rounded-xl p-8 border border-blue-100/50 hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300">
						<div className="flex items-center gap-4 mb-8">
							<div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
								<Globe className="w-6 h-6 text-white" />
							</div>
							<div>
								<h2 className="text-2xl font-bold text-gray-900">Idiomas</h2>
								<p className="text-sm text-gray-500">Tus competencias lingüísticas</p>
							</div>
						</div>

						<div className="space-y-3">
							{idiomas.map((idioma, index) => {
								const isExpanded = expandedIdiomas.has(idioma.id);
								const nivelTexto = {
									basico: "Básico",
									intermedio: "Intermedio",
									avanzado: "Avanzado",
									nativo: "Nativo"
								}[idioma.nivel] || "Sin especificar";

								return (
									<div
										key={idioma.id}
										className="border-2 border-blue-100 rounded-xl overflow-hidden bg-gradient-to-br from-blue-50/30 to-white hover:border-blue-300 transition-all duration-200"
									>
										{/* Header de la mini-tarjeta */}
										<div className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50/50 transition-colors duration-200">
											<button
												type="button"
												onClick={() => toggleIdioma(idioma.id)}
												className="flex-1 flex items-center gap-4 text-left"
											>
												<div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center shadow-md">
													<Globe className="w-5 h-5 text-white" />
												</div>
												<div>
													<div className="font-semibold text-gray-900 capitalize">
														{idioma.nombre || "Idioma sin especificar"}
														{idioma.nivel && (
															<span className="text-blue-600"> • {nivelTexto}</span>
														)}
													</div>
													<div className="text-sm text-gray-500">
														{isExpanded ? 'Editando...' : 'Click para editar'}
													</div>
												</div>
											</button>
											<div className="flex items-center gap-2">
												{idiomas.length > 1 && (
													<>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																moveIdiomaUp(index);
															}}
															disabled={index === 0}
															className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
															title="Mover arriba"
														>
															<ArrowUp className="w-4 h-4" />
														</button>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																moveIdiomaDown(index);
															}}
															disabled={index === idiomas.length - 1}
															className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
															title="Mover abajo"
														>
															<ArrowDown className="w-4 h-4" />
														</button>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																removeIdioma(idioma.id);
															}}
															className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
															title="Eliminar"
														>
															<Trash2 className="w-4 h-4" />
														</button>
													</>
												)}
												<button
													type="button"
													onClick={() => toggleIdioma(idioma.id)}
													className="p-2"
												>
													{isExpanded ? (
														<ChevronUp className="w-5 h-5 text-blue-600" />
													) : (
														<ChevronDown className="w-5 h-5 text-blue-600" />
													)}
												</button>
											</div>
										</div>										{/* Formulario colapsable */}
										{isExpanded && (
											<div className="px-6 pb-6 pt-2 border-t border-blue-100 bg-white/50 animate-fadeIn">
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													<div>
														<label className="block text-sm font-semibold text-gray-700 mb-2">
															Idioma *
														</label>
														<input
															type="text"
															placeholder="Ej: Inglés, Francés, Alemán..."
															value={idioma.nombre}
															onChange={(e) =>
																handleIdiomaChange(
																	idioma.id,
																	"nombre",
																	e.target.value
																)
															}
															className={`w-full px-3 py-2 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
																errores.idiomas?.[`idioma_${index}`]
																	? "border-red-500 focus:border-red-500"
																	: "border-gray-200 focus:border-blue-500"
															}`}
														/>
														{errores.idiomas &&
															errores.idiomas[`idioma_${index}`] && (
																<span className="text-red-500 text-sm mt-1 block">
																	{errores.idiomas[`idioma_${index}`]}
																</span>
															)}
													</div>

													<div>
														<label className="block text-sm font-semibold text-gray-700 mb-2">
															Nivel *
														</label>
														<select
															value={idioma.nivel}
															onChange={(e) =>
																handleIdiomaChange(idioma.id, "nivel", e.target.value)
															}
															className={`w-full px-3 py-2 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
																errores.idiomas?.[`nivel_${index}`]
																	? "border-red-500 focus:border-red-500"
																	: "border-gray-200 focus:border-blue-500"
															}`}
														>
															<option value="">Seleccionar nivel</option>
															<option value="basico">Básico</option>
															<option value="intermedio">Intermedio</option>
															<option value="avanzado">Avanzado</option>
															<option value="nativo">Nativo</option>
														</select>
														{errores.idiomas && errores.idiomas[`nivel_${index}`] && (
															<span className="text-red-500 text-sm mt-1 block">
																{errores.idiomas[`nivel_${index}`]}
															</span>
														)}
													</div>
												</div>
											</div>
										)}
									</div>
								);
							})}

							<button
								type="button"
								onClick={addIdioma}
								className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
							>
								<Plus className="w-5 h-5" />
								<span className="font-semibold">Añadir idioma</span>
							</button>
						</div>
					</div>

					{/* 6. INTERESES PERSONALES */}
					<div className="bg-white shadow-lg shadow-green-100/50 rounded-xl p-8 border border-green-100/50 hover:shadow-xl hover:shadow-green-200/50 transition-all duration-300">
						<div className="flex items-center gap-4 mb-8">
							<div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow-lg">
								<Heart className="w-6 h-6 text-white" />
							</div>
							<div>
								<h2 className="text-2xl font-bold text-gray-900">
									Intereses Personales
								</h2>
								<p className="text-sm text-gray-500">Tus pasiones y áreas de interés</p>
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Añadir interés (pulsa Enter)
							</label>
							<input
								type="text"
								placeholder="Ej: Deportes, Música, Lectura, Viajes, Tecnología..."
								value={interesInput}
								onChange={(e) => setInteresInput(e.target.value)}
								onKeyDown={handleAddInteres}
								className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
							/>

							{/* Sugerencias clicables */}
							{interesesList.length < 5 && (
								<div className="mt-3">
									<p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
										<Sparkles className="w-3 h-3" />
										Sugerencias populares:
									</p>
									<div className="flex flex-wrap gap-2">
										{interesesSugeridos
											.filter(sug => !interesesList.some(i => i.toLowerCase() === sug.toLowerCase()))
											.slice(0, 8)
											.map((sugerencia, index) => (
												<button
													key={index}
													type="button"
													onClick={() => handleAddInteresSugerido(sugerencia)}
													className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full hover:bg-green-100 hover:border-green-300 hover:shadow-sm transition-all duration-200 transform hover:scale-105"
												>
													+ {sugerencia}
												</button>
											))}
									</div>
								</div>
							)}

							<div className="mt-4 flex flex-wrap gap-2">
								{interesesList.map((interes, index) => (
									<span
										key={index}
										className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium border border-green-200 hover:border-green-300 hover:shadow-md transform hover:scale-105 transition-all duration-200 animate-fadeIn"
									>
										<Heart className="w-3 h-3 fill-current" />
										{interes}
										<button
											type="button"
											onClick={() => handleRemoveInteres(index)}
											className="ml-1 w-5 h-5 rounded-full bg-green-200 hover:bg-green-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
											aria-label="Eliminar interés"
										>
											<X className="w-3 h-3 text-green-700" />
										</button>
									</span>
								))}
							</div>
							{interesesList.length === 0 && (
								<p className="mt-3 text-sm text-gray-500 italic">
									No has añadido intereses aún. Escribe uno o selecciona de las sugerencias.
								</p>
							)}
							<p className="mt-3 text-xs text-gray-500">
								Comparte tus pasiones e intereses para obtener recomendaciones más personalizadas
							</p>
						</div>
					</div>

					{/* BOTÓN GUARDAR STICKY */}
					<div className="sticky bottom-6 pt-6 flex justify-end">
						<button
							type="submit"
							disabled={saving}
							className="inline-flex items-center gap-2 px-8 py-4 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-200"
						>
							<Save className="w-5 h-5" />
							{saving ? "Guardando..." : "Guardar perfil"}
						</button>
					</div>

					{/* Mensaje de éxito */}
					{successMessage && (
						<div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
							<div className="flex items-start">
								<CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
								<div className="ml-3">
									<h3 className="text-sm font-medium text-green-800">
										¡Éxito!
									</h3>
									<div className="mt-2 text-sm text-green-700">
										{successMessage}
									</div>
								</div>
							</div>
						</div>
					)}
				</form>
			</div>
		</div>
	);
}
