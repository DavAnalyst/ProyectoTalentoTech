// auth.js - Manejo de autenticación

// Event listeners para formularios
document.addEventListener('DOMContentLoaded', function() {
    // Formulario de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Formulario de registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

// Función para manejar el login
async function handleLogin(event) {
    event.preventDefault();
    clearValidationErrors();
    
    const formData = new FormData(event.target);
    const loginData = {
        username: formData.get('username').trim(),
        password: formData.get('password')
    };

    // Validaciones del lado del cliente
    let hasErrors = false;

    if (!loginData.username) {
        showValidationError('loginUsername', 'El usuario es requerido');
        hasErrors = true;
    } else if (loginData.username.length < 3) {
        showValidationError('loginUsername', 'El usuario debe tener al menos 3 caracteres');
        hasErrors = true;
    }

    if (!loginData.password) {
        showValidationError('loginPassword', 'La contraseña es requerida');
        hasErrors = true;
    }

    if (hasErrors) return;

    // Mostrar loading
    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        if (response.ok) {
            // Login exitoso
            localStorage.setItem('authToken', result.access_token);
            
            // Obtener información del usuario
            await getCurrentUser();
            
            // Mostrar mensaje de éxito
            showModal('¡Bienvenido!', 'Has iniciado sesión exitosamente', 'success');
            
            // Limpiar formulario
            clearForm('loginForm');
            
            // Redirigir a la página principal
            setTimeout(() => {
                closeModal();
                window.location.href = '/mainpage';
            }, 1500);
            
        } else {
            // Error en login
            let errorMessage = 'Error al iniciar sesión';
            
            if (result.detail) {
                errorMessage = result.detail;
            }
            
            showModal('Error de Autenticación', errorMessage, 'error');
        }

    } catch (error) {
        console.error('Error en login:', error);
        showModal('Error de Conexión', 'No se pudo conectar con el servidor. Verifica tu conexión a internet.', 'error');
    } finally {
        hideLoading();
    }
}

// Función para manejar el registro
async function handleRegister(event) {
    event.preventDefault();
    clearValidationErrors();
    
    const formData = new FormData(event.target);
    const registerData = {
        username: formData.get('username').trim(),
        password: formData.get('password')
    };

    // Validaciones del lado del cliente
    let hasErrors = false;

    if (!registerData.username) {
        showValidationError('registerUsername', 'El usuario es requerido');
        hasErrors = true;
    } else if (registerData.username.length < 3) {
        showValidationError('registerUsername', 'El usuario debe tener al menos 3 caracteres');
        hasErrors = true;
    } else if (!/^[a-zA-Z0-9_]+$/.test(registerData.username)) {
        showValidationError('registerUsername', 'El usuario solo puede contener letras, números y guiones bajos');
        hasErrors = true;
    }

    if (!registerData.password) {
        showValidationError('registerPassword', 'La contraseña es requerida');
        hasErrors = true;
    } else if (registerData.password.length < 8) {
        showValidationError('registerPassword', 'La contraseña debe tener al menos 8 caracteres');
        hasErrors = true;
    }

    if (hasErrors) return;

    // Mostrar loading
    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/registro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        });

        const result = await response.json();

        if (response.ok) {
            // Registro exitoso
            showModal('¡Registro Exitoso!', 
                `Bienvenido ${result.username}. Tu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión.`, 
                'success'
            );
            
            // Limpiar formulario
            clearForm('registerForm');
            
            // Cambiar a login después de un momento
            setTimeout(() => {
                closeModal();
                switchTab('login');
                
                // Pre-llenar el username en el formulario de login
                const loginUsername = document.getElementById('loginUsername');
                if (loginUsername) {
                    loginUsername.value = registerData.username;
                }
            }, 2000);
            
        } else {
            // Error en registro
            let errorMessage = 'Error al crear la cuenta';
            
            if (result.detail) {
                if (typeof result.detail === 'string') {
                    errorMessage = result.detail;
                } else if (Array.isArray(result.detail)) {
                    errorMessage = result.detail.map(err => err.msg || err).join(', ');
                }
            }
            
            showModal('Error de Registro', errorMessage, 'error');
        }

    } catch (error) {
        console.error('Error en registro:', error);
        showModal('Error de Conexión', 'No se pudo conectar con el servidor. Verifica tu conexión a internet.', 'error');
    } finally {
        hideLoading();
    }
}

// Función para obtener información del usuario actual
async function getCurrentUser() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/perfil`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            currentUser = userData;
            updateUIForAuthenticatedUser();
            return userData;
        } else {
            // Token inválido
            localStorage.removeItem('authToken');
            currentUser = null;
            updateUIForUnauthenticatedUser();
            return null;
        }

    } catch (error) {
        console.error('Error obteniendo usuario actual:', error);
        return null;
    }
}

// Función para cerrar sesión
async function logout() {
    showLoading();

    try {
        // Intentar hacer logout en el servidor
        const token = localStorage.getItem('authToken');
        if (token) {
            await fetch(`${API_BASE_URL}/usuarios/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        }
    } catch (error) {
        console.error('Error en logout del servidor:', error);
    } finally {
        // Limpiar datos locales independientemente del resultado del servidor
        localStorage.removeItem('authToken');
        currentUser = null;
        
        // Actualizar UI
        updateUIForUnauthenticatedUser();
        
        // Limpiar formularios
        clearForm('loginForm');
        clearForm('registerForm');
        clearValidationErrors();
        
        hideLoading();
        
        // Mostrar mensaje y cambiar a login
        showModal('Sesión Cerrada', 'Has cerrado sesión exitosamente', 'success');
        
        setTimeout(() => {
            closeModal();
            switchTab('login');
        }, 1500);
    }
}

// Función para verificar si el usuario está autenticado
function isAuthenticated() {
    const token = localStorage.getItem('authToken');
    return token && currentUser;
}

// Función para obtener el token de autenticación
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Función para renovar token (si es necesario en el futuro)
async function refreshToken() {
    // Esta función puede implementarse si el backend soporta refresh tokens
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        return false;
    }

    try {
        // Aquí se implementaría la lógica de refresh token
        // Por ahora, solo verificamos si el token actual es válido
        const response = await fetch(`${API_BASE_URL}/usuarios/perfil`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return response.ok;
    } catch (error) {
        console.error('Error renovando token:', error);
        return false;
    }
}

// Función para manejar errores de autenticación globalmente
function handleAuthError(error, response) {
    if (response && response.status === 401) {
        // Token expirado o inválido
        localStorage.removeItem('authToken');
        currentUser = null;
        updateUIForUnauthenticatedUser();
        showModal('Sesión Expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'warning');
        switchTab('login');
    } else {
        // Otros errores de autenticación
        console.error('Error de autenticación:', error);
        showModal('Error de Autenticación', 'Ha ocurrido un error de autenticación. Por favor, intenta nuevamente.', 'error');
    }
}

// Middleware para verificar autenticación antes de acciones protegidas
function requireAuth(callback) {
    return function(...args) {
        if (!isAuthenticated()) {
            showModal('Autenticación Requerida', 'Debes iniciar sesión para realizar esta acción.', 'warning');
            switchTab('login');
            return;
        }
        
        return callback.apply(this, args);
    };
}

// Auto-logout por inactividad (opcional)
let inactivityTimer;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    
    if (isAuthenticated()) {
        inactivityTimer = setTimeout(() => {
            showModal('Sesión Expirada por Inactividad', 
                'Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.', 
                'warning'
            );
            setTimeout(() => {
                logout();
            }, 3000);
        }, INACTIVITY_TIMEOUT);
    }
}

// Event listeners para detectar actividad del usuario
document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
document.addEventListener('click', resetInactivityTimer);
document.addEventListener('scroll', resetInactivityTimer);