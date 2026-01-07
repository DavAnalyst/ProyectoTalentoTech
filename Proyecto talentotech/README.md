# Sistema de Inicio de Sesión - Empresa de Construcción

Sistema completo de autenticación y gestión de usuarios para una empresa de construcción, desarrollado con FastAPI (Python) como backend y HTML/CSS/JavaScript como frontend.

## 🚀 Características

- **Autenticación JWT**: Sistema seguro de login y registro
- **CRUD Completo**: Crear, leer, actualizar y eliminar usuarios
- **Dashboard Interactivo**: Panel de control para gestión de usuarios
- **Diseño Responsivo**: Compatible con dispositivos móviles y desktop
- **Base de Datos MySQL**: Integración con XAMPP
- **Validación de Datos**: Validación tanto en frontend como backend
- **Interfaz Profesional**: Diseño moderno para empresa de construcción

## 🛠️ Tecnologías Utilizadas

### Backend
- **FastAPI**: Framework web moderno para Python
- **MySQL**: Base de datos relacional
- **JWT**: Autenticación con tokens
- **Bcrypt**: Encriptación de contraseñas
- **Pydantic**: Validación de datos

### Frontend
- **HTML5**: Estructura semántica
- **CSS3**: Estilos modernos y responsivos
- **JavaScript**: Interactividad y comunicación con API
- **Font Awesome**: Iconos

## 📋 Requisitos Previos

1. **Python 3.8+** instalado
2. **XAMPP** con MySQL activo
3. **Navegador web** moderno

## 🔧 Instalación y Configuración

### 1. Configurar Base de Datos

1. Inicia **XAMPP** y activa **Apache** y **MySQL**
2. Abre **phpMyAdmin** en `http://localhost/phpmyadmin`
3. Ejecuta el script SQL ubicado en `database_setup.sql`
4. Verifica que la base de datos `construccion_db` se haya creado correctamente

### 2. Configurar Backend

1. **Instalar dependencias de Python:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configurar credenciales en `backend.py`:**
   
   Busca y reemplaza las siguientes líneas con tus credenciales:

   ```python
   # Línea ~25 - Clave secreta JWT
   SECRET_KEY = "tu_clave_secreta_muy_segura_aqui"

   # Líneas ~32-38 - Configuración MySQL
   DB_CONFIG = {
       "host": "localhost",
       "user": "tu_usuario_mysql",      # Aca van credenciales
       "password": "tu_password_mysql", # Aca van credenciales
       "database": "construccion_db",
       "port": 3306
   }
   ```

3. **Iniciar el servidor:**
   ```bash
   python backend.py
   ```
   
   El servidor estará disponible en: `http://localhost:8000`

### 3. Acceder al Sistema

1. Abre tu navegador y ve a `http://localhost:8000`
2. Podrás:
   - **Registrarte** como nuevo usuario
   - **Iniciar sesión** con tus credenciales
   - **Gestionar usuarios** desde el dashboard

### 4. Usuario Administrador (Opcional)

Si ejecutaste el script SQL completo, se creó un usuario administrador:
- **Email**: `admin@construccion.com`
- **Contraseña**: `admin123`

**⚠️ IMPORTANTE**: Cambia esta contraseña inmediatamente después del primer login.

## 📁 Estructura del Proyecto

```
proyecto/
│
├── backend.py              # Servidor FastAPI
├── requirements.txt        # Dependencias Python
├── database_setup.sql      # Script de configuración BD
├── README.md              # Este archivo
│
├── templates/
│   └── index.html         # Página principal
│
└── static/
    ├── imagen.jpeg        # Logo de la empresa
    ├── css/
    │   └── styles.css     # Estilos CSS
    └── js/
        ├── main.js        # Funciones principales
        ├── auth.js        # Manejo de autenticación
        └── dashboard.js   # Funciones del dashboard
```

## 🔑 Funcionalidades

### Autenticación
- **Registro de usuarios** con validación de datos
- **Login seguro** con JWT tokens
- **Logout** y manejo de sesiones
- **Validación de email y teléfono**

### Dashboard
- **Visualización de perfil** personal
- **Edición de datos** del usuario
- **Lista completa de usuarios** registrados
- **Eliminación de usuarios** (solo para administradores)
- **Interfaz responsiva**

### Seguridad
- **Encriptación de contraseñas** con bcrypt
- **Tokens JWT** para autenticación
- **Validación de datos** en frontend y backend
- **Protección contra inyección SQL**

## 🔧 Configuración Avanzada

### Personalizar la Empresa

1. **Logo**: Reemplaza `static/imagen.jpeg` con el logo de tu empresa
2. **Nombre**: Modifica el nombre en `templates/index.html` línea ~20
3. **Colores**: Personaliza los colores en `static/css/styles.css`

### Configurar Email

Para habilitar notificaciones por email, agrega configuración SMTP en `backend.py`.

### Base de Datos Externa

Para usar una base de datos externa, modifica `DB_CONFIG` en `backend.py`:

```python
DB_CONFIG = {
    "host": "tu_servidor.com",
    "user": "tu_usuario",
    "password": "tu_password",
    "database": "construccion_db",
    "port": 3306
}
```

## 🚨 Solución de Problemas

### Error de Conexión a MySQL
- Verifica que XAMPP esté ejecutándose
- Confirma que las credenciales en `backend.py` sean correctas
- Asegúrate de que la base de datos `construccion_db` exista

### Error "Module not found"
```bash
pip install -r requirements.txt
```

### Puerto 8000 ocupado
Cambia el puerto en la última línea de `backend.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=8001)  # Usar puerto 8001
```

### Problemas de CORS
El backend ya está configurado para permitir todas las conexiones. En producción, especifica dominios específicos.

## 📱 Uso del Sistema

### Para Usuarios Finales

1. **Registro**: Completa el formulario con todos los datos requeridos
2. **Login**: Usa tu email y contraseña para acceder
3. **Dashboard**: Una vez logueado, accede al panel de control
4. **Editar Perfil**: Actualiza tu información personal cuando sea necesario

### Para Administradores

1. **Gestión de Usuarios**: Ve y administra todos los usuarios registrados
2. **Eliminar Usuarios**: Remueve usuarios que ya no trabajen en la empresa
3. **Exportar Datos**: (Funcionalidad disponible para implementar)

## 🔒 Consideraciones de Seguridad

- Cambia `SECRET_KEY` por una clave más segura
- Usa HTTPS en producción
- Configura firewall para la base de datos
- Implementa rate limiting para prevenir ataques
- Actualiza regularmente las dependencias

## 📈 Posibles Mejoras Futuras

- **Roles y permisos** más granulares
- **Recuperación de contraseñas** por email
- **Notificaciones push**
- **Auditoría completa** de acciones
- **API para aplicaciones móviles**
- **Integración con sistemas de nómina**

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu funcionalidad
3. Realiza tus cambios
4. Ejecuta pruebas
5. Envía un pull request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ve el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico:
- **Email**: soporte@construccion.com
- **Teléfono**: +57 300 123 4567

---

**Desarrollado con ❤️ para empresas de construcción**