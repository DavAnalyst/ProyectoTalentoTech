// Selector de Pisos - Funcionalidades principales

class PisosManager {
    constructor() {
        this.selectedMaterial = null;
        this.generatedFloors = [];
        this.currentFloorTexture = null;
        this.init();
    }

    async init() {
        // Verificar autenticación
        if (!(await this.checkAuth())) {
            window.location.href = '/';
            return;
        }

        this.setupEventListeners();
        this.loadHistory();
    }

    async checkAuth() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            return false;
        }

        try {
            const response = await fetch('/api/auth/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // Token inválido o expirado
                localStorage.removeItem('authToken');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            localStorage.removeItem('authToken');
            return false;
        }
    }

    setupEventListeners() {
        // Selección de materiales
        document.querySelectorAll('.material-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectMaterial(card);
            });
        });

        // Botón generar piso
        document.getElementById('generateFloorBtn').addEventListener('click', () => {
            this.generateFloor();
        });

        // Controles
        document.getElementById('saveFloorBtn').addEventListener('click', () => {
            this.saveFloor();
        });

        document.getElementById('downloadFloorBtn').addEventListener('click', () => {
            this.downloadFloor();
        });

        document.getElementById('resetFloorBtn').addEventListener('click', () => {
            this.resetFloor();
        });

        // Botón logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    selectMaterial(card) {
        // Remover selección anterior
        document.querySelectorAll('.material-card').forEach(c => {
            c.classList.remove('selected');
        });

        // Seleccionar nuevo material
        card.classList.add('selected');
        this.selectedMaterial = card.dataset.material;

        // Actualizar información
        const materialNames = {
            wood: 'Madera',
            ceramic: 'Cerámica', 
            marble: 'Mármol',
            concrete: 'Concreto',
            stone: 'Piedra',
            laminate: 'Laminado'
        };

        const materialDescriptions = {
            wood: 'Elegante y cálido, perfecto para espacios acogedores',
            ceramic: 'Resistente y versátil, ideal para áreas de alto tráfico',
            marble: 'Lujo y sofisticación para espacios premium',
            concrete: 'Moderno e industrial, perfecto para estilos contemporáneos',
            stone: 'Natural y duradero, aporta textura y carácter',
            laminate: 'Económico y práctico, fácil de mantener'
        };

        document.getElementById('selectedMaterialName').textContent = materialNames[this.selectedMaterial];
        document.getElementById('materialDescription').textContent = materialDescriptions[this.selectedMaterial];

        // Habilitar botón de generar
        document.getElementById('generateFloorBtn').disabled = false;

        // Agregar efecto visual
        this.previewMaterial();
    }

    previewMaterial() {
        const floorOverlay = document.getElementById('floorOverlay');
        const baseRoomImage = document.getElementById('baseRoomImage');
        
        // Restaurar imagen base original para el preview
        baseRoomImage.src = '/static/generated/base/base.png';
        
        // Colores base para preview temporal
        const materialColors = {
            wood: 'linear-gradient(45deg, #8B4513, #D2691E)',
            ceramic: 'linear-gradient(45deg, #F5F5DC, #DCDCDC)', 
            marble: 'linear-gradient(45deg, #F8F8FF, #E6E6FA)',
            concrete: 'linear-gradient(45deg, #696969, #A9A9A9)',
            stone: 'linear-gradient(45deg, #708090, #2F4F4F)',
            laminate: 'linear-gradient(45deg, #DEB887, #F4A460)'
        };

        floorOverlay.style.background = materialColors[this.selectedMaterial];
        floorOverlay.style.backgroundImage = '';
        floorOverlay.classList.add('visible');
    }

    async generateFloor() {
        if (!this.selectedMaterial) {
            this.showMessage('warning', 'Selecciona un Material', 'Por favor selecciona un material antes de generar.');
            return;
        }

        this.showLoading();

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/generar/piso/${this.selectedMaterial}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(`401 Unauthorized: Token expirado o inválido`);
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Respuesta del servidor:', data);
            
            if (data.status === 'success') {
                this.currentFloorTexture = data.file;
                await this.applyFloorTexture(data.file);
                this.enableControls();
                this.addToHistory(this.selectedMaterial, data.file);
                this.showMessage('success', '¡Piso Generado!', `Textura de ${this.selectedMaterial} creada exitosamente.`);
            } else {
                throw new Error('Error en la generación de la imagen');
            }

        } catch (error) {
            console.error('Error generando piso:', error);
            
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                this.showMessage('error', 'Sesión Expirada', 'Tu sesión ha expirado. Redirigiendo al login...');
                setTimeout(() => {
                    localStorage.removeItem('authToken');
                    window.location.href = '/';
                }, 2000);
            } else {
                this.showMessage('error', 'Error de Generación', 'No se pudo generar la textura del piso. Inténtalo de nuevo.');
            }
        } finally {
            this.hideLoading();
        }
    }

    async applyFloorTexture(imagePath) {
        return new Promise((resolve, reject) => {
            const baseRoomImage = document.getElementById('baseRoomImage');
            const floorOverlay = document.getElementById('floorOverlay');
            const img = new Image();
            
            img.onload = () => {
                // Ocultar el overlay y mostrar la imagen generada completa
                floorOverlay.classList.remove('visible');
                floorOverlay.style.backgroundImage = '';
                
                // Actualizar la imagen base con la imagen generada (que ya incluye la composición)
                baseRoomImage.src = `${imagePath}?t=${Date.now()}`;
                resolve();
            };
            
            img.onerror = () => {
                reject(new Error('No se pudo cargar la textura generada'));
            };
            
            // Agregar timestamp para evitar cache
            img.src = `${imagePath}?t=${Date.now()}`;
        });
    }

    enableControls() {
        document.getElementById('saveFloorBtn').disabled = false;
        document.getElementById('downloadFloorBtn').disabled = false;
    }

    saveFloor() {
        if (!this.currentFloorTexture) {
            this.showMessage('warning', 'No hay Piso para Guardar', 'Genera un piso primero.');
            return;
        }

        // Simular guardado en base de datos (implementar según necesidades)
        this.showMessage('success', 'Piso Guardado', 'El piso ha sido guardado en tu galería personal.');
    }

    downloadFloor() {
        if (!this.currentFloorTexture) {
            this.showMessage('warning', 'No hay Piso para Descargar', 'Genera un piso primero.');
            return;
        }

        const link = document.createElement('a');
        link.href = this.currentFloorTexture;
        link.download = `piso_${this.selectedMaterial}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showMessage('success', 'Descarga Iniciada', 'El archivo se está descargando.');
    }

    resetFloor() {
        // Limpiar selección
        document.querySelectorAll('.material-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        this.selectedMaterial = null;
        this.currentFloorTexture = null;

        // Resetear UI
        document.getElementById('selectedMaterialName').textContent = 'Selecciona un material';
        document.getElementById('materialDescription').textContent = 'Elige un material de la lista para ver cómo se vería en tu habitación';
        
        // Ocultar overlay y restaurar imagen base original
        const floorOverlay = document.getElementById('floorOverlay');
        const baseRoomImage = document.getElementById('baseRoomImage');
        
        floorOverlay.classList.remove('visible');
        floorOverlay.style.backgroundImage = '';
        baseRoomImage.src = '/static/generated/base/base.png';
        
        // Deshabilitar controles
        document.getElementById('generateFloorBtn').disabled = true;
        document.getElementById('saveFloorBtn').disabled = true;
        document.getElementById('downloadFloorBtn').disabled = true;

        this.showMessage('success', 'Vista Restablecida', 'La habitación ha vuelto a su estado original.');
    }

    addToHistory(material, imagePath) {
        const historyItem = {
            material,
            imagePath,
            timestamp: new Date().toLocaleString()
        };
        
        this.generatedFloors.unshift(historyItem);
        this.updateHistoryDisplay();
        
        // Guardar en localStorage
        localStorage.setItem('pisos_history', JSON.stringify(this.generatedFloors));
    }

    loadHistory() {
        const saved = localStorage.getItem('pisos_history');
        if (saved) {
            this.generatedFloors = JSON.parse(saved);
            this.updateHistoryDisplay();
        }
    }

    updateHistoryDisplay() {
        const historyGrid = document.getElementById('historyGrid');
        
        if (this.generatedFloors.length === 0) {
            historyGrid.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-image"></i>
                    <p>No hay pisos generados aún</p>
                </div>
            `;
            return;
        }

        const materialNames = {
            wood: 'Madera',
            ceramic: 'Cerámica', 
            marble: 'Mármol',
            concrete: 'Concreto',
            stone: 'Piedra',
            laminate: 'Laminado'
        };

        historyGrid.innerHTML = this.generatedFloors.map(item => `
            <div class="history-item" onclick="pisosManager.loadHistoryItem('${item.imagePath}')">
                <img src="${item.imagePath}" alt="${item.material}" loading="lazy">
                <div class="history-item-info">
                    <h5>${materialNames[item.material] || item.material}</h5>
                    <small>${item.timestamp}</small>
                </div>
            </div>
        `).join('');
    }

    loadHistoryItem(imagePath) {
        this.currentFloorTexture = imagePath;
        this.applyFloorTexture(imagePath);
        this.enableControls();
        this.showMessage('success', 'Piso Cargado', 'Piso cargado desde el historial.');
    }

    logout() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            localStorage.removeItem('authToken');
            this.showMessage('success', 'Sesión Cerrada', 'Sesión cerrada exitosamente');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }
    }

    showLoading() {
        document.getElementById('loadingModal').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loadingModal').classList.remove('active');
    }

    showMessage(type, title, message) {
        const modal = document.getElementById('messageModal');
        const icon = document.getElementById('messageIcon');
        const titleElement = document.getElementById('messageTitle');
        const textElement = document.getElementById('messageText');

        // Configurar icono
        icon.className = 'message-icon';
        if (type === 'success') {
            icon.innerHTML = '<i class="fas fa-check-circle"></i>';
            icon.classList.add('success');
        } else if (type === 'error') {
            icon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
            icon.classList.add('error');
        } else if (type === 'warning') {
            icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            icon.classList.add('warning');
        }

        titleElement.textContent = title;
        textElement.textContent = message;
        modal.classList.add('active');
    }
}

// Función global para cerrar modal de mensaje
function closeMessageModal() {
    document.getElementById('messageModal').classList.remove('active');
}

// Función global para logout (reutilizada de auth.js)
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.pisosManager = new PisosManager();
});

// Manejar errores globales
window.addEventListener('error', (event) => {
    console.error('Error global:', event.error);
});

// Prevenir que el usuario navegue hacia atrás sin token
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '/';
        }
    }
});