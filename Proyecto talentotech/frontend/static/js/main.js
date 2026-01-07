// Configuración global
const API_BASE_URL = 'http://localhost:8000/api';
let currentUser = null;

// Elementos del DOM
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const modal = document.getElementById('messageModal');
const loadingOverlay = document.getElementById('loadingOverlay');

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

// Función de inicialización principal
function initializeApp() {
    console.log('Inicializando aplicación...');
    
    // Verificar si hay token guardado
    const token = localStorage.getItem('authToken');
    if (token) {
        validateToken(token);
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Event listeners para pestañas
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Event listener para cerrar modal con click fuera
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Event listener para cerrar modal con Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
}

// Función para cambiar pestañas
function switchTab(tabName) {
    // Remover clase active de todos los botones y contenidos
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Agregar clase active al botón y contenido seleccionado
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(tabName);

    if (activeButton && activeContent) {
        activeButton.classList.add('active');
        activeContent.classList.add('active');
    }
}

// Función para mostrar/ocultar contraseña
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.toggle-password i');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.classList.remove('fa-eye');
        button.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        button.classList.remove('fa-eye-slash');
        button.classList.add('fa-eye');
    }
}

// Funciones para mostrar/ocultar loading
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// Funciones para el modal
function showModal(title, message, type = 'info') {
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalIcon = document.getElementById('modalIcon');
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    // Configurar icono según el tipo
    modalIcon.className = `modal-icon ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    modalIcon.innerHTML = `<i class="${icons[type] || icons.info}"></i>`;
    
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
}

// Función para verificar estado de autenticación
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const dashboardTab = document.getElementById('dashboardTab');
    
    if (token && currentUser) {
        // Usuario autenticado - mostrar pestaña dashboard
        dashboardTab.style.display = 'block';
    } else {
        // Usuario no autenticado - ocultar pestaña dashboard
        dashboardTab.style.display = 'none';
        if (window.location.hash === '#dashboard') {
            switchTab('login');
        }
    }
}

// Función para validar token
async function validateToken(token) {
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
        } else {
            // Token inválido o expirado
            localStorage.removeItem('authToken');
            currentUser = null;
            updateUIForUnauthenticatedUser();
        }
    } catch (error) {
        console.error('Error validando token:', error);
        localStorage.removeItem('authToken');
        currentUser = null;
        updateUIForUnauthenticatedUser();
    }
}

// Actualizar UI para usuario autenticado
function updateUIForAuthenticatedUser() {
    const dashboardTab = document.getElementById('dashboardTab');
    const userWelcome = document.getElementById('userWelcome');
    
    dashboardTab.style.display = 'block';
    if (userWelcome && currentUser) {
        userWelcome.textContent = `Bienvenido, ${currentUser.nombre} ${currentUser.apellido}`;
    }
    
    // Cargar datos del dashboard si estamos en esa pestaña
    if (document.getElementById('dashboard').classList.contains('active')) {
        loadDashboardData();
    }
}

// Actualizar UI para usuario no autenticado
function updateUIForUnauthenticatedUser() {
    const dashboardTab = document.getElementById('dashboardTab');
    dashboardTab.style.display = 'none';
    
    // Si estamos en dashboard, cambiar a login
    if (document.getElementById('dashboard').classList.contains('active')) {
        switchTab('login');
    }
}

// Función para hacer peticiones HTTP con token
async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('authToken');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, mergedOptions);
        
        // Si el token expiró, redirigir al login
        if (response.status === 401) {
            localStorage.removeItem('authToken');
            currentUser = null;
            updateUIForUnauthenticatedUser();
            showModal('Sesión Expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'warning');
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('Error en petición HTTP:', error);
        throw error;
    }
}

// Función para formatear fechas
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('es-ES', options);
}

// Función para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Función para validar teléfono
function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// Función para validar contraseña
function isValidPassword(password) {
    // Mínimo 8 caracteres, al menos una letra y un número
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
}

// Función para limpiar formulario
function clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

// Función para mostrar errores de validación
function showValidationError(inputId, message) {
    const input = document.getElementById(inputId);
    if (input) {
        // Remover errores anteriores
        removeValidationError(inputId);
        
        // Agregar clase de error
        input.classList.add('error');
        
        // Crear y mostrar mensaje de error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error';
        errorDiv.textContent = message;
        input.parentElement.appendChild(errorDiv);
    }
}

// Función para remover errores de validación
function removeValidationError(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.classList.remove('error');
        const errorDiv = input.parentElement.querySelector('.validation-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
}

// Función para limpiar todos los errores de validación
function clearValidationErrors() {
    const errorInputs = document.querySelectorAll('.error');
    const errorMessages = document.querySelectorAll('.validation-error');
    
    errorInputs.forEach(input => input.classList.remove('error'));
    errorMessages.forEach(message => message.remove());
}

// Función de utilidad para debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Función para copiar texto al portapapeles
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showModal('Copiado', 'Texto copiado al portapapeles', 'success');
        }).catch(err => {
            console.error('Error copiando al portapapeles:', err);
        });
    } else {
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showModal('Copiado', 'Texto copiado al portapapeles', 'success');
        } catch (err) {
            console.error('Error copiando al portapapeles:', err);
        }
        document.body.removeChild(textArea);
    }
}

// Agregar estilos CSS para errores de validación si no están definidos
if (!document.querySelector('style[data-validation-styles]')) {
    const style = document.createElement('style');
    style.setAttribute('data-validation-styles', 'true');
    style.textContent = `
        .form-group input.error,
        .form-group select.error {
            border-color: #e74c3c !important;
            box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1) !important;
        }
        
        .validation-error {
            color: #e74c3c;
            font-size: 0.8em;
            margin-top: 5px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .validation-error::before {
            content: '⚠';
        }
    `;
    document.head.appendChild(style);
}