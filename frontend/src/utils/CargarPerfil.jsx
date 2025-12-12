import { useEffect } from "react";
import { getProfile } from "../api";

export const useCargarDatosPersonales = (
	setDatosPersonales,
	setEstudios,
	setExperiencias,
	setHabilidades,
	setIdiomas,
	setIntereses,
	setExistingProfileImage
) => {
	useEffect(() => {
		const fetchPerfil = async () => {
			try {
				const response = await getProfile();
				
				if (response.success) {
					const data = response.data;
					setDatosPersonales({
						id: data?.id || "",
						nombre: data?.nombre || "",
						apellidos: data?.apellidos || "",
						ciudad: data?.ciudad || "",
						dniNie: data?.dni || "",
						fechaNacimiento: data?.fecha_nacimiento.split("T")[0] || "",
						telefono: data?.telefono || "",
					});

					// Sólo sobrescribimos estudios si la API devuelve alguno
					setEstudios((prev) => {
						const formaciones = data?.formaciones;
						if (!formaciones || formaciones.length === 0) return prev;
						return formaciones.map((estudio) => ({
							id: estudio.id,
							nivelEducativo: estudio.nivel ?? "",
							centroEstudios: estudio.centro_estudios ?? "",
							tituloObtenido: estudio.titulo_obtenido ?? "",
							fechaInicio: estudio.fecha_inicio
								? estudio.fecha_inicio.split("T")[0].slice(0, 7)
								: "",
							fechaFin: estudio.fecha_fin
								? estudio.fecha_fin.split("T")[0].slice(0, 7)
								: "",
						}));
					});

					setExperiencias((prev) => {
						const experiencias = data?.experiencias;
						if (!experiencias || experiencias.length === 0) return prev;
						return experiencias.map((experiencia) => ({
							id: experiencia.id || "",
							puesto: experiencia.puesto || "",
							empresa: experiencia.empresa || "",
							fechaInicio: experiencia.fecha_inicio
								? experiencia.fecha_inicio.split("T")[0].slice(0, 7)
								: "",
							fechaFin: experiencia.fecha_fin
								? experiencia.fecha_fin.split("T")[0].slice(0, 7)
								: "",
							descripcion: experiencia.descripcion || "",
						}));
					});

					setHabilidades(
						data?.habilidades?.map((habilidad) => habilidad.nombre) || []
					);

					setIdiomas((prev) => {
						const idiomas = data?.idiomas;
						if (!idiomas || idiomas.length === 0) return prev;
						return idiomas.map((idioma) => ({
							id: idioma.id || "",
							nombre: idioma.idioma || "",
							nivel: idioma.nivel || "",
						}));
					});

					setIntereses(data?.intereses?.map((interes) => interes.nombre) || []);
					
					// Cargar imagen de perfil existente si hay
					if (setExistingProfileImage && response.profile_image) {
						setExistingProfileImage(response.profile_image);
					}
				}
			} catch (err) {
				// Error silencioso al cargar perfil
			}
		};

		fetchPerfil();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
};
