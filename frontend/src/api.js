// Usar variable de entorno de Vite, con fallback para desarrollo
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export const STORAGE_URL = API_URL.replace('/api', '/storage');

// --- Helpers de autenticación ---
function getAuthToken() {
	try {
		return localStorage.getItem("token") || null;
	} catch {
		return null;
	}
}

function getAuthHeaders() {
	const token = getAuthToken();
	const headers = { "Content-Type": "application/json" };
	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}
	return headers;
}

// --- Autenticación ---
export async function logoutUser() {
	const response = await fetch(`${API_URL}/logout`, {
		method: "POST",
		headers: getAuthHeaders(),
		credentials: "include",
	});
	return response.json();
}

export async function registerUser(data) {
	const response = await fetch(`${API_URL}/register`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	return response.json();
}

export async function loginUser(data) {
	const response = await fetch(`${API_URL}/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	return response.json();
}

export async function getProfile() {
	const response = await fetch(`${API_URL}/profile`, {
		method: "GET",
		headers: getAuthHeaders(),
		credentials: "include",
	});
	return response.json();
}

export async function updateProfile(data) {
	const response = await fetch(`${API_URL}/profile`, {
		method: "POST",
		headers: {
			...getAuthHeaders(),
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
		credentials: "include",
	});
	return response.json();
}

export async function updateProfileWithImage(data, imageFile) {
	const formData = new FormData();

	// Añadir la imagen si existe
	if (imageFile) {
		formData.append("profile_image", imageFile);
	}

	// Añadir los datos del perfil como JSON string
	formData.append("data", JSON.stringify(data));

	const token = getAuthToken();
	const headers = {};
	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}
	// NO incluir Content-Type para que el browser añada el boundary automáticamente

	const response = await fetch(`${API_URL}/profile`, {
		method: "POST",
		headers: headers,
		body: formData,
		credentials: "include",
	});
	return response.json();
}

export async function deleteProfileImage() {
	const response = await fetch(`${API_URL}/profile/image`, {
		method: "DELETE",
		headers: getAuthHeaders(),
		credentials: "include",
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.message || 'Error al eliminar imagen de perfil');
	}

	return response.json();
}

// ======================================================
// TEST VOCACIONAL (SISTEMA PROGRESIVO)
// ======================================================

// 🔹 Iniciar test (reinicia sesión y obtiene pregunta 1)
export async function startTest() {
	const response = await fetch(`${API_URL}/test/iniciar`, {
		method: "POST",
		headers: getAuthHeaders(),
		credentials: "include",
	});
	return response.json();
}

// 🔹 Obtener siguiente pregunta
export async function getNextQuestion(payload) {
	const response = await fetch(`${API_URL}/test/siguiente-pregunta`, {
		method: "POST",
		headers: getAuthHeaders(),
		credentials: "include",
		body: JSON.stringify(payload),
	});
	return response.json();
}

// 🔹 Analizar respuestas finales
export async function analyzeTestResults(respuestas) {
	const response = await fetch(`${API_URL}/test/analizar-respuestas`, {
		method: "POST",
		headers: getAuthHeaders(),
		credentials: "include",
		body: JSON.stringify({ respuestas }),
	});
	return response.json();
}

// 🔹 Obtener progreso del test guardado
export async function getUserTest() {
	const response = await fetch(`${API_URL}/user/test/progress`, {
		method: "GET",
		headers: getAuthHeaders(),
		credentials: "include",
	});
	return response.json();
}

// 🔹 Guardar progreso parcial del test
export async function saveTestProgress(payload) {
	const response = await fetch(`${API_URL}/user/test/save-progress`, {
		method: "POST",
		headers: getAuthHeaders(),
		credentials: "include",
		body: JSON.stringify(payload),
	});
	return response.json();
}

// 🔹 Guardar resultado final del test
export async function saveTestResult(payload) {
	const response = await fetch(`${API_URL}/user/test/save-result`, {
		method: "POST",
		headers: getAuthHeaders(),
		credentials: "include",
		body: JSON.stringify(payload),
	});
	return response.json();
}

// 🔹 Obtener resultados guardados del usuario (lista, más reciente primero)
export async function getUserResults() {
	const response = await fetch(`${API_URL}/user/test/results`, {
		method: "GET",
		headers: getAuthHeaders(),
		credentials: "include",
	});
	return response.json();
}

// ======================================================
// 🌟 Objetivo profesional (guardar/obtener/eliminar)
// ======================================================

export async function saveObjetivoProfesional(payload) {
	const response = await fetch(`${API_URL}/objetivo-profesional`, {
		method: 'POST',
		headers: getAuthHeaders(),
		credentials: 'include',
		body: JSON.stringify(payload),
	});
	return response.json();
}

export async function getObjetivoProfesional() {
	const response = await fetch(`${API_URL}/objetivo-profesional`, {
		method: 'GET',
		headers: getAuthHeaders(),
		credentials: 'include',
	});
	return response.json();
}

export async function deleteObjetivoProfesional() {
	const response = await fetch(`${API_URL}/objetivo-profesional`, {
		method: 'DELETE',
		headers: getAuthHeaders(),
		credentials: 'include',
	});
	return response.json();
}

//  Generar imagen IA asociada a la profesión
export async function generateImageForProfession(payload) {
	// Alias directo: /api/generar-imagen (también existe /api/test/generar-imagen)
	const response = await fetch(`${API_URL}/generar-imagen`, {
		method: "POST",
		headers: getAuthHeaders(),
		credentials: "include",
		body: JSON.stringify(payload),
	});
	return response.json();
}

//  Formulario de contacto
export async function enviarFormularioContacto(payload) {
	const response = await fetch(`${API_URL}/contacto`, {
		method: "POST",
		headers: getAuthHeaders(),
		credentials: "include",
		body: JSON.stringify(payload),
	});
	return response.json();
}
// ======================================================
// GUÍAS EDUCATIVAS (Orientador)
// ======================================================

//  Obtener guías del orientador autenticado
export async function getMisGuias() {
	const response = await fetch(`${API_URL}/guias/mis-guias`, {
        method: "GET",
		headers: getAuthHeaders(),
        credentials: "include",
	});

	if (!response.ok) {
		throw await response.json();
	}
	return response.json();
}

//  Crear nueva guía con archivos
export async function createGuia(formData) {
	const token = getAuthToken();
	const response = await fetch(`${API_URL}/guias`, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${token}`,
			'Accept': 'application/json'
		},
        credentials: "include",
		body: formData
	});
	
	if (!response.ok) {
		throw await response.json();
	}
	return response.json();
}

//  Actualizar guía existente (con o sin archivo)
export async function updateGuia(guiaId, formData) {
	const token = getAuthToken();
	//  Usamos POST con _method=PUT para enviar FormData (Laravel lo acepta)
	formData.append('_method', 'PUT');
	
	const response = await fetch(`${API_URL}/guias/${guiaId}`, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${token}`,
			'Accept': 'application/json'
		},
        credentials: "include",
		body: formData
	});
	
	if (!response.ok) {
		throw await response.json();
	}
	return response.json();
}

// Eliminar guía por ID
export async function deleteGuia(guiaId) {
	const response = await fetch(`${API_URL}/guias/${guiaId}`, {
		method: 'DELETE',
		headers: getAuthHeaders(),
        credentials: "include"
	});

	if (!response.ok) {
		throw await response.json();
	}
	return response.json();
}

//  Descargar PDF de una guía
export async function downloadGuia(guiaId) {
	const token = getAuthToken();
	const response = await fetch(`${API_URL}/guias/${guiaId}/download`, {
		headers: {
			'Authorization': `Bearer ${token}`
		}
	});
	if (!response.ok) {
		throw new Error('Error al descargar');
	}
	return response.blob();
}

//  Obtener palabras clave populares sugeridas
export async function getPalabrasClavePopulares() {
	const response = await fetch(`${API_URL}/guias/palabras-clave`, {
		method: 'GET',
		headers: getAuthHeaders(),
        credentials: "include"
	});

	if (!response.ok) {
		throw await response.json();
	}
	return response.json();
}

// ======================================================
// GUÍAS PÚBLICAS (Estudiantes)
// ======================================================

//  Obtener guías públicas con filtros y ordenamiento
export async function getGuiasPublicas(filtro = '', ordenamiento = 'recent') {
	const params = new URLSearchParams();
	if (filtro) params.append('categoria', filtro);
	if (ordenamiento) params.append('sort', ordenamiento);

	const response = await fetch(`${API_URL}/guias/visible?${params}`, {
		method: 'GET',
		headers: getAuthHeaders(),
        credentials: 'include',
	});

	if (!response.ok) {
		throw await response.json();
	}
	return response.json();
}

//  Descargar guía pública (con validación de permisos)
export async function descargarGuiaPublica(guiaId) {
	const token = getAuthToken();
	if (!token) {
		throw new Error('Debes iniciar sesión para descargar guías');
	}

	const response = await fetch(`${API_URL}/guias/${guiaId}/download`, {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${token}`
		}
	});

	if (!response.ok) {
		throw await response.json();
	}
	return response.blob();
}

//  Obtener detalles de una guía por ID
export async function getGuiaDetalle(guiaId) {
	const response = await fetch(`${API_URL}/guias/${guiaId}`, {
		method: 'GET',
		headers: getAuthHeaders(),
		credentials: 'include',
	});

	if (!response.ok) {
		throw await response.json();
	}
	return response.json();
}

//  Obtener PDF de una guía para visualizar en línea (no descargar)
export async function getGuiaPDF(guiaId) {
	const token = getAuthToken();
	if (!token) {
		throw new Error('Debes iniciar sesión para ver guías');
	}

	const response = await fetch(`${API_URL}/guias/${guiaId}/preview`, {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${token}`
		}
	});

	if (!response.ok) {
		throw await response.json();
	}
	return response.blob();
}

// =====================================================
// STRIPE SUBSCRIPTION ENDPOINTS
// =====================================================

/**
 * Create a Stripe Checkout session
 * IMPORTANT: This endpoint requires authentication (Sanctum Bearer token or session cookie)
 * @param {string} priceId - Stripe price ID (e.g., "price_1SZ8xR4hgbVBtEJuqyvbNioD")
 * @returns {Promise<Object>} - { success: true, url: "https://checkout.stripe.com/..." } or error
 * @throws {Error} - 401 if not authenticated, 403 if not a student
 */
export async function createCheckoutSession(priceId) {
	try {
		// Use Axios which automatically includes:
		// 1. Bearer token from Authorization header (set by interceptor)
		// 2. Session cookie (due to withCredentials: true)
		// 3. CORS headers
		const response = await window.axios.post('/subscription/checkout', {
			price_id: priceId
		}, {
			// Explicitly set credentials even though it's default - belt and suspenders approach
			withCredentials: true
		});
		return response.data;
	} catch (error) {
		console.error('Checkout session error:', error.response?.data || error.message);
		// Return error data so frontend can handle it
		if (error.response?.data) {
			return error.response.data;
		}
		throw error;
	}
}

/**
 * Get user's current subscription status
 * @returns {Promise<Object>} - { subscribed: boolean, plan: string, status: string, renews_at: string }
 */
export async function getSubscriptionStatus() {
	try {
		const response = await window.axios.get('/subscription/status', {
			withCredentials: true
		});
		return response.data;
	} catch (error) {
		console.error('Get subscription status error:', error.response?.data || error.message);
		if (error.response?.data) {
			return error.response.data;
		}
		throw error;
	}
}

/**
 * Get Stripe Billing Portal URL for managing subscription
 * Used when user already has an active subscription
 * @returns {Promise<Object>} - { success: true, url: "https://billing.stripe.com/..." }
 */
export async function getBillingPortalUrl() {
	try {
		const response = await window.axios.post('/subscription/portal', {}, {
			withCredentials: true
		});
		return response.data;
	} catch (error) {
		console.error('Get billing portal error:', error.response?.data || error.message);
		if (error.response?.data) {
			return error.response.data;
		}
		throw error;
	}
}

/**
 * Cancel subscription and delete user account
 * @returns {Promise<Object>} - { success: true, message: "Account deleted" }
 */
export async function deleteAccount() {
	try {
		const response = await window.axios.delete('/account/destroy', {
			withCredentials: true
		});
		return response.data;
	} catch (error) {
		console.error('Delete account error:', error.response?.data || error.message);
		if (error.response?.data) {
			return error.response.data;
		}
    throw error;
  }
}

// ======================================================
// TESTIMONIOS
// ======================================================

export async function getTestimonials() {
	const response = await fetch(`${API_URL}/testimonios`, {
		method: "GET",
		headers: { "Content-Type": "application/json" },
	});
	return response.json();
}

export async function addTestimonial(data) {
	const response = await fetch(`${API_URL}/testimonios`, {
		method: "POST",
		headers: getAuthHeaders(),
        credentials: "include",
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw await response.json();
	}
	return response.json();
}

export async function updateTestimonial(id, data) {
	const response = await fetch(`${API_URL}/testimonios/${id}`, {
		method: "PUT",
		headers: getAuthHeaders(),
        credentials: "include",
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw await response.json();
	}
	return response.json();
}

export async function deleteTestimonial(id) {
	const response = await fetch(`${API_URL}/testimonios/${id}`, {
		method: "DELETE",
		headers: getAuthHeaders(),
        credentials: "include",
	});
	if (!response.ok) {
		throw await response.json();
	}
	return response.json();
}