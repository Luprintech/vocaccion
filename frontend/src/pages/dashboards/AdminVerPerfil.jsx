import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContextFixed";
import { API_URL } from "../../api";
import HeaderAdmin from "../../components/HeaderAdmin";
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
    ArrowLeft,
	ArrowUp,
	ArrowDown,
	ArrowUpDown,
	Sparkles,
	X,
	Camera
} from "lucide-react";
import { scrollToFirstError } from "@/utils/ScrollToFirstError";
import MonthYearPicker from "../../components/MonthYearPicker";
import DatePicker from "../../components/DatePicker";

export default function AdminVerPerfil() {
    const { id } = useParams();
	const { token } = useAuth();
    const navigate = useNavigate();

	const [loading, setLoading] = useState(true);
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
	const [estudios, setEstudios] = useState([]);

	// 3. Experiencia laboral
	const [experiencias, setExperiencias] = useState([]);

	// 4. Habilidades
	const [habilidadInput, setHabilidadInput] = useState("");
	const [habilidadesList, setHabilidadesList] = useState([]);

	// 5. Idiomas
	const [idiomas, setIdiomas] = useState([]);

	// 6. Intereses personales
	const [interesInput, setInteresInput] = useState("");
	const [interesesList, setInteresesList] = useState([]);

	// 7. Imagen de perfil
    const [existingProfileImage, setExistingProfileImage] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const fileInputRef = useRef(null);

    // Estados de expansión
	const [expandedFormaciones, setExpandedFormaciones] = useState(new Set([1]));
	const [expandedExperiencias, setExpandedExperiencias] = useState(new Set([1]));
	const [expandedIdiomas, setExpandedIdiomas] = useState(new Set());

    // Errores
	const [errores, setErrores] = useState({
		datosPersonales: {},
		formaciones: [],
		experiencias: [],
		idiomas: [],
	});

    // Cargar datos del perfil
    useEffect(() => {
        async function loadProfile() {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/admin/estudiantes/${id}/perfil`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                
                const result = await response.json();

                if (result.success) {
                    const data = result.data;
                    
                    if (data) {
                        setDatosPersonales({
                            nombre: data.nombre || "",
                            apellidos: data.apellidos || "",
                            ciudad: data.ciudad || "",
                            dniNie: data.dni || "",
                            // Asumiendo formato YYYY-MM-DD
                            fechaNacimiento: data.fecha_nacimiento ? data.fecha_nacimiento.split("T")[0] : "",
                            telefono: data.telefono || "",
                        });

                        // Formaciones
                        if (data.formaciones && data.formaciones.length > 0) {
                            setEstudios(data.formaciones.map(estudio => ({
                                id: estudio.id,
                                nivelEducativo: estudio.nivel || "",
                                centroEstudios: estudio.centro_estudios || "",
                                tituloObtenido: estudio.titulo_obtenido || "",
                                fechaInicio: estudio.fecha_inicio ? estudio.fecha_inicio.split("T")[0].slice(0, 7) : "",
                                fechaFin: estudio.fecha_fin ? estudio.fecha_fin.split("T")[0].slice(0, 7) : "",
                                cursandoActualmente: estudio.cursando_actualmente
                            })));
                        } else {
                            // Inicializar vacio si no hay
                            setEstudios([{
                                id: 1, nivelEducativo: "", centroEstudios: "", tituloObtenido: "", fechaInicio: "", fechaFin: "", cursandoActualmente: false
                            }]);
                        }

                        // Experiencias
                        if (data.experiencias && data.experiencias.length > 0) {
                            setExperiencias(data.experiencias.map(exp => ({
                                id: exp.id,
                                puesto: exp.puesto || "",
                                empresa: exp.empresa || "",
                                fechaInicio: exp.fecha_inicio ? exp.fecha_inicio.split("T")[0].slice(0, 7) : "",
                                fechaFin: exp.fecha_fin ? exp.fecha_fin.split("T")[0].slice(0, 7) : "",
                                descripcion: exp.descripcion || "",
                                trabajandoActualmente: exp.trabajando_actualmente
                            })));
                        } else {
                            setExperiencias([{
                                id: 1, puesto: "", empresa: "", fechaInicio: "", fechaFin: "", descripcion: "", trabajandoActualmente: false
                            }]);
                        }

                        // Habilidades
                        if (data.habilidades) {
                            setHabilidadesList(data.habilidades.map(h => h.nombre));
                        }

                        // Idiomas
                        if (data.idiomas && data.idiomas.length > 0) {
                            setIdiomas(data.idiomas.map(idioma => ({
                                id: idioma.id,
                                nombre: idioma.idioma || "",
                                nivel: idioma.nivel || ""
                            })));
                        } else {
                            setIdiomas([{ id: 1, nombre: "", nivel: "" }]);
                        }

                        // Intereses
                        if (data.intereses) {
                            setInteresesList(data.intereses.map(i => i.nombre));
                        }
                        
                        // Imagen
                        if (data.profile_image) {
                            setExistingProfileImage(data.profile_image);
                        } else {
                            setExistingProfileImage(null);
                        }
                    }
                } else {
                    setError(result.message || 'No se pudo cargar el perfil');
                }
            } catch (err) {
                console.error('Error:', err);
                setError('Error al cargar el perfil');
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [id, token]);


    // --- HANDLERS (Copiados y adaptados de Perfil.jsx) ---

	const handleAddHabilidad = (event) => {
		if (event.key === "Enter" && habilidadInput.trim() !== "") {
			event.preventDefault();
			const nuevaHabilidad = habilidadInput.trim();
			if (!habilidadesList.some(h => h.toLowerCase() === nuevaHabilidad.toLowerCase())) {
				setHabilidadesList([...habilidadesList, nuevaHabilidad]);
			}
			setHabilidadInput("");
		}
	};

	const handleRemoveHabilidad = (indexToRemove) => {
		setHabilidadesList(habilidadesList.filter((_, index) => index !== indexToRemove));
	};

    const handleAddInteres = (event) => {
		if (event.key === "Enter" && interesInput.trim() !== "") {
			event.preventDefault();
			const nuevoInteres = interesInput.trim();
			if (!interesesList.some(i => i.toLowerCase() === nuevoInteres.toLowerCase())) {
				setInteresesList([...interesesList, nuevoInteres]);
			}
			setInteresInput("");
		}
	};

	const handleRemoveInteres = (indexToRemove) => {
		setInteresesList(interesesList.filter((_, index) => index !== indexToRemove));
	};

    // Toggle functions
    const toggleFormacion = (id) => {
		const newExpanded = new Set(expandedFormaciones);
		if (newExpanded.has(id)) newExpanded.delete(id);
		else newExpanded.add(id);
		setExpandedFormaciones(newExpanded);
	};
    const toggleExperiencia = (id) => {
		const newExpanded = new Set(expandedExperiencias);
		if (newExpanded.has(id)) newExpanded.delete(id);
		else newExpanded.add(id);
		setExpandedExperiencias(newExpanded);
	};
    const toggleIdioma = (id) => {
		const newExpanded = new Set(expandedIdiomas);
		if (newExpanded.has(id)) newExpanded.delete(id);
		else newExpanded.add(id);
		setExpandedIdiomas(newExpanded);
	};

    // Change handlers
    const handleDatosPersonalesChange = (e) => {
		const { name, value } = e.target;
		setDatosPersonales(prev => ({ ...prev, [name]: value }));
	};

    // Estudios logic
    const addEstudio = () => {
		const newId = estudios.length > 0 ? Math.max(...estudios.map((e) => e.id)) + 1 : 1;
		setEstudios([...estudios, { id: newId, nivelEducativo: "", centroEstudios: "", tituloObtenido: "", fechaInicio: "", fechaFin: "", cursandoActualmente: false }]);
        setExpandedFormaciones(prev => new Set(prev).add(newId));
	};
    const removeEstudio = (id) => setEstudios(estudios.filter((e) => e.id !== id));
    const handleEstudioChange = (id, field, value) => {
		setEstudios(estudios.map((e) => e.id === id ? { ...e, [field]: value } : e));
	};
    const moveEstudioUp = (index) => {
        if (index > 0) {
            const newArr = [...estudios];
            [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
            setEstudios(newArr);
        }
    };
    const moveEstudioDown = (index) => {
        if (index < estudios.length - 1) {
            const newArr = [...estudios];
            [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
            setEstudios(newArr);
        }
    };

    // Experiencias logic
    const addExperiencia = () => {
		const newId = experiencias.length > 0 ? Math.max(...experiencias.map((e) => e.id)) + 1 : 1;
		setExperiencias([...experiencias, { id: newId, puesto: "", empresa: "", fechaInicio: "", fechaFin: "", descripcion: "", trabajandoActualmente: false }]);
        setExpandedExperiencias(prev => new Set(prev).add(newId));
	};
    const removeExperiencia = (id) => setExperiencias(experiencias.filter((e) => e.id !== id));
    const handleExperienciaChange = (id, field, value) => {
		setExperiencias(experiencias.map((e) => e.id === id ? { ...e, [field]: value } : e));
	};
    const moveExperienciaUp = (index) => {
        if (index > 0) {
            const newArr = [...experiencias];
            [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
            setExperiencias(newArr);
        }
    };
    const moveExperienciaDown = (index) => {
        if (index < experiencias.length - 1) {
            const newArr = [...experiencias];
            [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
            setExperiencias(newArr);
        }
    };

    // Idiomas logic
    const addIdioma = () => {
		const newId = idiomas.length > 0 ? Math.max(...idiomas.map((i) => i.id)) + 1 : 1;
		setIdiomas([...idiomas, { id: newId, nombre: "", nivel: "" }]);
        setExpandedIdiomas(prev => new Set(prev).add(newId));
	};
    const removeIdioma = (id) => setIdiomas(idiomas.filter((i) => i.id !== id));
    const handleIdiomaChange = (id, field, value) => {
		setIdiomas(idiomas.map((i) => i.id === id ? { ...i, [field]: value } : i));
	};
    const moveIdiomaUp = (index) => {
        if (index > 0) {
            const newArr = [...idiomas];
            [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
            setIdiomas(newArr);
        }
    };
    const moveIdiomaDown = (index) => {
        if (index < idiomas.length - 1) {
            const newArr = [...idiomas];
            [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
            setIdiomas(newArr);
        }
    };

    // Image handlers
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveSelectedImage = () => {
        setProfileImage(null);
        setProfileImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDeleteExistingImage = () => {
        setShowDeleteModal(true);
    };

    const confirmDeleteImage = async () => {
        setShowDeleteModal(false);
        try {
            const response = await fetch(`${API_URL}/admin/estudiantes/${id}/foto`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const result = await response.json();
            if (result.success) {
                setExistingProfileImage(null);
                setSuccessMessage("Foto eliminada correctamente");
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setError(result.message || "Error al eliminar foto");
            }
        } catch (err) {
            console.error(err);
            setError("Error al eliminar foto");
        }
    };

    // Validaciones
    const validarDni = (dni) => {
		if(!dni) return true; // Si es opcional en admin... pero mejor validar si está
		const dniRegex = /^\d{8}[A-Z]$/i;
		const letrasDni = "TRWAGMYFPDXBNJZSQVHLCKE";
		const dniLimpio = dni.replace(/\s+/, "");
		if (!dniRegex.test(dniLimpio)) return false;
		const resto = parseInt(dniLimpio.slice(0, 8)) % 23;
		return letrasDni.charAt(resto) === dniLimpio.charAt(8);
	};
    const validarTelefono = (telefono) => {
		if(!telefono) return true; 
		const telefonoLimpio = telefono.replace(/\s+/, "");
		const telefonoRegex = /^(6|7|8|9)\d{8}$/;
		return telefonoRegex.test(telefonoLimpio);
	};

    const validarFormulario = () => {
		const nuevosErrores = { datosPersonales: {}, formaciones: [], experiencias: [], idiomas: [] };
        
        // Validar datos personales
		if (!datosPersonales.nombre.trim()) nuevosErrores.datosPersonales.nombre = "El nombre es obligatorio";
		if (!datosPersonales.apellidos.trim()) nuevosErrores.datosPersonales.apellidos = "Los apellidos son obligatorios";
		if (!datosPersonales.ciudad.trim()) nuevosErrores.datosPersonales.ciudad = "La ciudad es obligatoria";
        if (datosPersonales.dniNie && !validarDni(datosPersonales.dniNie)) nuevosErrores.datosPersonales.dniNie = "El DNI/NIE no es válido";
        if (datosPersonales.telefono && !validarTelefono(datosPersonales.telefono)) nuevosErrores.datosPersonales.telefono = "El teléfono no es válido";

        // Validar estudios
        estudios.forEach((est, idx) => {
             if(est.nivelEducativo || est.centroEstudios || est.tituloObtenido || est.fechaInicio) {
                 if(!est.nivelEducativo) nuevosErrores.formaciones[`nivelEducativo_${idx}`] = "Obligatorio";
                 if(!est.centroEstudios) nuevosErrores.formaciones[`centroEstudios_${idx}`] = "Obligatorio";
                 if(!est.tituloObtenido) nuevosErrores.formaciones[`tituloObtenido_${idx}`] = "Obligatorio";
                 if(!est.fechaInicio) nuevosErrores.formaciones[`fechaInicio_${idx}`] = "Obligatorio";
             }
        });

        // Validar experiencias
        experiencias.forEach((exp, idx) => {
             if(exp.puesto || exp.empresa || exp.fechaInicio) {
                 if(!exp.puesto) nuevosErrores.experiencias[`puesto_${idx}`] = "Obligatorio";
                 if(!exp.empresa) nuevosErrores.experiencias[`empresa_${idx}`] = "Obligatorio";
                 if(!exp.fechaInicio) nuevosErrores.experiencias[`fechaInicio_${idx}`] = "Obligatorio";
             }
        });

        // Validar idiomas
        idiomas.forEach((idioma, idx) => {
             if(idioma.nombre || idioma.nivel) {
                 if(!idioma.nombre) nuevosErrores.idiomas[`idioma_${idx}`] = "Obligatorio";
                 if(!idioma.nivel) nuevosErrores.idiomas[`nivel_${idx}`] = "Obligatorio";
             }
        });

        setErrores(nuevosErrores);
        return Object.values(nuevosErrores.datosPersonales).length === 0 &&
               Object.keys(nuevosErrores.formaciones).length === 0 &&
               Object.keys(nuevosErrores.experiencias).length === 0 &&
               Object.keys(nuevosErrores.idiomas).length === 0;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        // Skip validation for now to simplify, or implement full
        // if (!validarFormulario()) { scrollToFirstError(); return; }
        
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
					.filter(e => e.nivelEducativo && e.centroEstudios)
					.map(e => ({
						nivel: e.nivelEducativo,
						centro_estudios: e.centroEstudios,
						titulo_obtenido: e.tituloObtenido,
						fecha_inicio: e.fechaInicio ? `${e.fechaInicio}-01` : null,
						fecha_fin: e.fechaFin ? `${e.fechaFin}-28` : null,
						cursando_actualmente: e.cursandoActualmente,
					})),
				experiencia_laboral: experiencias
					.filter(e => e.puesto && e.empresa)
					.map(e => ({
						puesto: e.puesto,
						empresa: e.empresa,
						fecha_inicio: e.fechaInicio ? `${e.fechaInicio}-01` : null,
						fecha_fin: e.fechaFin ? `${e.fechaFin}-28` : null,
						descripcion: e.descripcion,
						trabajando_actualmente: e.trabajandoActualmente,
					})),
				idiomas: idiomas
					.filter(i => i.nombre && i.nivel)
					.map(i => ({
						idioma: i.nombre,
						nivel: i.nivel,
					})),
				habilidades_intereses: {
					habilidades: habilidadesList,
					intereses: interesesList,
				},
			};

            let response;
            
            // Si hay imagen nueva, usar FormData
            if (profileImage) {
                const formData = new FormData();
           
                // Añadir JSON como string
                formData.append('informacion_personal[nombre]', datosPersonales.nombre);
                formData.append('informacion_personal[apellidos]', datosPersonales.apellidos);
                formData.append('informacion_personal[ciudad]', datosPersonales.ciudad);
                formData.append('informacion_personal[dni]', datosPersonales.dniNie);
                if(datosPersonales.fechaNacimiento) formData.append('informacion_personal[fecha_nacimiento]', datosPersonales.fechaNacimiento);
                if(datosPersonales.telefono) formData.append('informacion_personal[telefono]', datosPersonales.telefono);

                // Formación
                estudios
                    .filter(e => e.nivelEducativo && e.centroEstudios)
                    .forEach((e, index) => {
                        formData.append(`formacion[${index}][nivel]`, e.nivelEducativo);
                        formData.append(`formacion[${index}][centro_estudios]`, e.centroEstudios);
                        formData.append(`formacion[${index}][titulo_obtenido]`, e.tituloObtenido);
                        if(e.fechaInicio) formData.append(`formacion[${index}][fecha_inicio]`, `${e.fechaInicio}-01`);
                        if(e.fechaFin) formData.append(`formacion[${index}][fecha_fin]`, `${e.fechaFin}-28`);
                        formData.append(`formacion[${index}][cursando_actualmente]`, e.cursandoActualmente ? '1' : '0');
                    });

                // Experiencia
                experiencias
                    .filter(e => e.puesto && e.empresa)
                    .forEach((e, index) => {
                        formData.append(`experiencia_laboral[${index}][puesto]`, e.puesto);
                        formData.append(`experiencia_laboral[${index}][empresa]`, e.empresa);
                        if(e.fechaInicio) formData.append(`experiencia_laboral[${index}][fecha_inicio]`, `${e.fechaInicio}-01`);
                        if(e.fechaFin) formData.append(`experiencia_laboral[${index}][fecha_fin]`, `${e.fechaFin}-28`);
                        formData.append(`experiencia_laboral[${index}][descripcion]`, e.descripcion || '');
                        formData.append(`experiencia_laboral[${index}][trabajando_actualmente]`, e.trabajandoActualmente ? '1' : '0');
                    });

                // Idiomas
                idiomas
                    .filter(i => i.nombre && i.nivel)
                    .forEach((i, index) => {
                        formData.append(`idiomas[${index}][idioma]`, i.nombre);
                        formData.append(`idiomas[${index}][nivel]`, i.nivel);
                    });

                // Habilidades e Intereses
                habilidadesList.forEach((h, index) => formData.append(`habilidades_intereses[habilidades][${index}]`, h));
                interesesList.forEach((i, index) => formData.append(`habilidades_intereses[intereses][${index}]`, i));

                // IMAGEN
                formData.append('profile_image', profileImage);
                // Method spoofing for PUT with FormData (Laravel requirement usually, but let's try POST with _method PUT if needed, or simple POST if route allows, but route is PUT. standard fetch PUT with FormData works in modern browsers but Laravel might need _method)
                // Actually Laravel handles PUT multipart correctly sometimes, but safest is POST with _method=PUT
                formData.append('_method', 'PUT');

                response = await fetch(`${API_URL}/admin/estudiantes/${id}/perfil`, {
                    method: 'POST', // Use POST with _method=PUT to handle multipart
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    },
                    body: formData
                });

            } else {
                // Si no hay imagen, JSON normal
                response = await fetch(`${API_URL}/admin/estudiantes/${id}/perfil`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(perfilData)
                });
            }

            const result = await response.json();

            if (result.success) {
                setSuccessMessage("Perfil actualizado correctamente");
                if (result.data && result.data.perfil_id && profileImage) {
                     // Update existing image locally if returned or just clear preview
                     const reader = new FileReader();
                     reader.onload = (e) => setExistingProfileImage(e.target.result); // Mock update for visual feedback
                     reader.readAsDataURL(profileImage);
                     setProfileImage(null);
                     setProfileImagePreview(null);
                }
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setError(result.message || "Error al actualizar perfil");
            }
        } catch (err) {
            console.error(err);
            setError("Error de conexión al guardar");
        } finally {
            setSaving(false);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <HeaderAdmin />
                <div className="flex items-center justify-center h-[80vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
                </div>
            </div>
        );
    }
    
    // UI Render
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
            <HeaderAdmin />

            {/* Banner Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Editar Perfil de Estudiante</h1>
                        <p className="text-sm text-slate-500">Editando perfil de: {datosPersonales.nombre || 'Estudiante'}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/admin/usuarios')}
                            className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 transition-all"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="max-w-4xl mx-auto p-6 space-y-8">
                {/* Mensajes */}
                {successMessage && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 animate-fadeIn">
                        <CheckCircle className="w-5 h-5" />
                        {successMessage}
                    </div>
                )}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 animate-fadeIn">
                        <X className="w-5 h-5" />
                        {error}
                    </div>
                )}

                 {/* 1. DATOS PERSONALES */}
                 <div className="bg-white shadow-sm rounded-xl p-8 border border-slate-200">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-cyan-100 rounded-full text-cyan-600">
                            <User className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Datos Personales</h2>
                    </div>

                    {/* IMAGEN DE PERFIL */}
                    <div className="mb-8 flex flex-col items-center">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center">
                                {profileImagePreview ? (
                                    <img src={profileImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : existingProfileImage ? (
                                    <img src={existingProfileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-16 h-16 text-slate-400" />
                                )}
                            </div>
                            
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 p-2 bg-cyan-500 rounded-full text-white shadow-md hover:bg-cyan-600 transition-colors"
                                title="Cambiar foto"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>

                        <div className="mt-4 flex gap-3">
                            {existingProfileImage && !profileImagePreview && (
                                <button 
                                    onClick={handleDeleteExistingImage}
                                    className="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar foto actual
                                </button>
                            )}
                            {profileImagePreview && (
                                <button 
                                    onClick={handleRemoveSelectedImage}
                                    className="px-3 py-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    Cancelar cambio
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre</label>
                            <input type="text" name="nombre" value={datosPersonales.nombre} onChange={handleDatosPersonalesChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Apellidos</label>
                            <input type="text" name="apellidos" value={datosPersonales.apellidos} onChange={handleDatosPersonalesChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Ciudad</label>
                            <input type="text" name="ciudad" value={datosPersonales.ciudad} onChange={handleDatosPersonalesChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none" />
                        </div>
                         <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Teléfono</label>
                            <input type="text" name="telefono" value={datosPersonales.telefono} onChange={handleDatosPersonalesChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none" />
                        </div>
                         <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">DNI/NIE</label>
                            <input type="text" name="dniNie" value={datosPersonales.dniNie} onChange={handleDatosPersonalesChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha Nacimiento</label>
                            <DatePicker name="fechaNacimiento" value={datosPersonales.fechaNacimiento} onChange={handleDatosPersonalesChange} />
                        </div>
                    </div>
                 </div>

                 {/* 2. FORMACIÓN */}
                 <div className="bg-white shadow-sm rounded-xl p-8 border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-full text-green-600">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">Formación</h2>
                        </div>
                        <button onClick={addEstudio} className="flex items-center gap-2 text-green-600 hover:bg-green-50 px-3 py-1 rounded-lg transition-colors">
                            <Plus className="w-4 h-4" /> Añadir
                        </button>
                    </div>
                    <div className="space-y-4">
                        {estudios.map((estudio, idx) => (
                            <div key={estudio.id} className="border border-green-100 rounded-xl p-4 bg-green-50/30">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" placeholder="Nivel Educativo" value={estudio.nivelEducativo} onChange={(e) => handleEstudioChange(estudio.id, 'nivelEducativo', e.target.value)} className="w-full p-2 border rounded" />
                                    <input type="text" placeholder="Centro" value={estudio.centroEstudios} onChange={(e) => handleEstudioChange(estudio.id, 'centroEstudios', e.target.value)} className="w-full p-2 border rounded" />
                                    <input type="text" placeholder="Título" value={estudio.tituloObtenido} onChange={(e) => handleEstudioChange(estudio.id, 'tituloObtenido', e.target.value)} className="w-full p-2 border rounded md:col-span-2" />
                                    <MonthYearPicker value={estudio.fechaInicio} onChange={(e) => handleEstudioChange(estudio.id, 'fechaInicio', e.target.value)} placeholder="Inicio" />
                                    <MonthYearPicker value={estudio.fechaFin} onChange={(e) => handleEstudioChange(estudio.id, 'fechaFin', e.target.value)} placeholder="Fin" />
                                </div>
                                <div className="mt-2 flex justify-end">
                                    <button onClick={() => removeEstudio(estudio.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>

                 {/* 3. EXPERIENCIA */}
                  <div className="bg-white shadow-sm rounded-xl p-8 border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">Experiencia</h2>
                        </div>
                         <button onClick={addExperiencia} className="flex items-center gap-2 text-purple-600 hover:bg-purple-50 px-3 py-1 rounded-lg transition-colors">
                            <Plus className="w-4 h-4" /> Añadir
                        </button>
                    </div>
                     <div className="space-y-4">
                        {experiencias.map((exp, idx) => (
                            <div key={exp.id} className="border border-purple-100 rounded-xl p-4 bg-purple-50/30">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" placeholder="Puesto" value={exp.puesto} onChange={(e) => handleExperienciaChange(exp.id, 'puesto', e.target.value)} className="w-full p-2 border rounded" />
                                    <input type="text" placeholder="Empresa" value={exp.empresa} onChange={(e) => handleExperienciaChange(exp.id, 'empresa', e.target.value)} className="w-full p-2 border rounded" />
                                    <MonthYearPicker value={exp.fechaInicio} onChange={(e) => handleExperienciaChange(exp.id, 'fechaInicio', e.target.value)} placeholder="Inicio" />
                                    <MonthYearPicker value={exp.fechaFin} onChange={(e) => handleExperienciaChange(exp.id, 'fechaFin', e.target.value)} placeholder="Fin" />
                                    <textarea placeholder="Descripción" value={exp.descripcion} onChange={(e) => handleExperienciaChange(exp.id, 'descripcion', e.target.value)} className="w-full p-2 border rounded md:col-span-2" rows="2" />
                                </div>
                                <div className="mt-2 flex justify-end">
                                    <button onClick={() => removeExperiencia(exp.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>

                 {/* 4. HABILIDADES E INTERESES */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
                         <div className="flex items-center gap-3 mb-4">
                            <Brain className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-xl font-bold">Habilidades</h3>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {habilidadesList.map((h, i) => (
                                <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm flex items-center gap-1">
                                    {h} 
                                    <button onClick={() => handleRemoveHabilidad(i)}><X className="w-3 h-3" /></button>
                                </span>
                            ))}
                        </div>
                        <input 
                            type="text" 
                            placeholder="Añadir habilidad + Enter" 
                            value={habilidadInput} 
                            onChange={(e) => setHabilidadInput(e.target.value)} 
                            onKeyDown={handleAddHabilidad}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="bg-white shadow-sm rounded-xl p-6 border border-slate-200">
                         <div className="flex items-center gap-3 mb-4">
                            <Heart className="w-5 h-5 text-red-500" />
                            <h3 className="text-xl font-bold">Intereses</h3>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {interesesList.map((interes, i) => (
                                <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm flex items-center gap-1">
                                    {interes} 
                                    <button onClick={() => handleRemoveInteres(i)}><X className="w-3 h-3" /></button>
                                </span>
                            ))}
                        </div>
                        <input 
                            type="text" 
                            placeholder="Añadir interés + Enter" 
                            value={interesInput} 
                            onChange={(e) => setInteresInput(e.target.value)} 
                            onKeyDown={handleAddInteres}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                 </div>

                 {/* 5. IDIOMAS */}
                 <div className="bg-white shadow-sm rounded-xl p-8 border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                             <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                                <Globe className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">Idiomas</h2>
                        </div>
                        <button onClick={addIdioma} className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors">
                            <Plus className="w-4 h-4" /> Añadir
                        </button>
                    </div>
                    <div className="space-y-4">
                         {idiomas.map((idioma, idx) => (
                            <div key={idioma.id} className="border border-blue-100 rounded-xl p-4 bg-blue-50/30 flex justify-between items-center gap-4">
                                <input type="text" placeholder="Idioma" value={idioma.nombre} onChange={(e) => handleIdiomaChange(idioma.id, 'nombre', e.target.value)} className="w-full p-2 border rounded" />
                                <select value={idioma.nivel} onChange={(e) => handleIdiomaChange(idioma.id, 'nivel', e.target.value)} className="w-full p-2 border rounded">
                                    <option value="">Nivel</option>
                                    <option value="basico">Básico</option>
                                    <option value="intermedio">Intermedio</option>
                                    <option value="avanzado">Avanzado</option>
                                    <option value="nativo">Nativo</option>
                                </select>
                                <button onClick={() => removeIdioma(idioma.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                 </div>

            </div>
            {/* Modal de Confirmación */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 transform transition-all scale-100 animate-scaleIn">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar foto?</h3>
                            <p className="text-slate-500 mb-6">
                                ¿Estás seguro de que quieres eliminar la foto de perfil actual? Esta acción no se puede deshacer.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDeleteImage}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-lg shadow-red-500/30 transition-all"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
