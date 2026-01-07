from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
import hashlib
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
import mysql.connector
from typing import Optional
import os
from pathlib import Path
from dotenv import load_dotenv
from backend.openai_api.openai_generator import generate_image
from backend.knowledge_base.company_info import CompanyKnowledgeBase
from openai import OpenAI

# Cargar variables de entorno
load_dotenv("backend/config/.env")

# Obtener el directorio base del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Inicializar cliente de OpenAI
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None

# Configuración de la aplicación
app = FastAPI(title="Sistema de Construcción - API", version="1.0.0")

# Configurar CORS
import mysql.connector
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar archivos estáticos
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

# Configuración de seguridad
SECRET_KEY = "DavidAnslyst2025"  # Cambia esto por una clave secreta real
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 horas

security = HTTPBearer()

# Configuración de la base de datos
DB_CONFIG = {
    "host": "localhost",
    "user": "root",  # Usuario de MySQL
    "password": "",  # Contraseña de MySQL
    "database": "login_db",
    "port": 3306
}

# Modelos Pydantic
class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    username: str

class ChatMessage(BaseModel):
    message: str

# Funciones auxiliares
def get_db_connection():
    """Establece conexión con la base de datos MySQL"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de conexión a la base de datos: {str(e)}"
        )

def get_password_hash(password):
    """Genera hash de la contraseña usando SHA256"""
    print(f"[DEBUG] Password recibido: {password} (tipo: {type(password)})")
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(plain_password, hashed_password):
    """Verifica la contraseña usando SHA256"""
    return hashlib.sha256(plain_password.encode('utf-8')).hexdigest() == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Obtiene el usuario actual desde el token JWT"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            print(f"JWT Error: No username in token")
            raise credentials_exception
    except JWTError as e:
        print(f"JWT Error: {str(e)}")
        raise credentials_exception
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if user is None:
            raise credentials_exception
        return user
    finally:
        cursor.close()
        connection.close()

# Inicialización de la base de datos
def init_database():
    """Inicializa la base de datos y tabla de usuarios"""
    connection = get_db_connection()
    cursor = connection.cursor()
    
    # No crear tabla, ya existe como 'users'
    cursor.close()
    connection.close()

# Endpoints

# Usar lifespan para inicialización moderna
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialización al arrancar la app
    init_database()  # Habilitado para conectar con MySQL
    yield
    # Aquí puedes poner código de limpieza si lo necesitas

app.router.lifespan_context = lifespan

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Sirve la página principal"""
    template_path = BASE_DIR / "frontend" / "templates" / "index.html"
    with open(template_path, "r", encoding="utf-8") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content)

@app.post("/api/usuarios/registro", response_model=UserResponse)
async def registro_usuario(user: UserCreate):
    """Registra un nuevo usuario"""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Verificar si el username ya existe
        cursor.execute("SELECT id FROM users WHERE username = %s", (user.username,))
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El username ya está registrado"
            )
        # Hash de la contraseña
        hashed_password = get_password_hash(user.password)
        # Insertar nuevo usuario
        insert_query = """
        INSERT INTO users (username, password)
        VALUES (%s, %s)
        """
        cursor.execute(insert_query, (user.username, hashed_password))
        connection.commit()
        # Obtener el usuario recién creado
        user_id = cursor.lastrowid
        cursor.execute("SELECT id, username FROM users WHERE id = %s", (user_id,))
        new_user = cursor.fetchone()
        return UserResponse(**new_user)
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en la base de datos: {str(e)}"
        )
    finally:
        cursor.close()
        connection.close()

@app.post("/api/usuarios/login", response_model=Token)
async def login_usuario(user_credentials: UserLogin):
    """Inicia sesión y devuelve token JWT"""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Buscar usuario por username
        cursor.execute(
            "SELECT * FROM users WHERE username = %s", 
            (user_credentials.username,)
        )
        user = cursor.fetchone()
        # Verificar usuario y contraseña
        if not user or not verify_password(user_credentials.password, user['password']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Username o contraseña incorrectos",
                headers={"WWW-Authenticate": "Bearer"},
            )
        # Crear token de acceso
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user['username']}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    finally:
        cursor.close()
        connection.close()

@app.get("/api/usuarios/perfil", response_model=UserResponse)
async def obtener_perfil(current_user: dict = Depends(get_current_user)):
    """Obtiene el perfil del usuario actual"""
    return UserResponse(**current_user)

@app.get("/api/auth/verify")
async def verificar_token(current_user: dict = Depends(get_current_user)):
    """Verifica si el token JWT es válido"""
    return {"status": "valid", "user": current_user["username"], "id": current_user["id"]}

@app.get("/api/usuarios", response_model=list[UserResponse])
async def listar_usuarios(current_user: dict = Depends(get_current_user)):
    """Lista todos los usuarios (requiere autenticación)"""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT id, username FROM users ORDER BY id DESC")
        usuarios = cursor.fetchall()
        return [UserResponse(**user) for user in usuarios]
    finally:
        cursor.close()
        connection.close()

@app.put("/api/usuarios/{user_id}", response_model=UserResponse)
async def actualizar_usuario(user_id: int, user_update: UserUpdate, current_user: dict = Depends(get_current_user)):
    """Actualiza un usuario"""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Verificar que el usuario existe
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        existing_user = cursor.fetchone()
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        # Preparar campos para actualizar
        update_fields = []
        update_values = []
        if user_update.username is not None:
            # Verificar que el nuevo username no exista
            cursor.execute("SELECT id FROM users WHERE username = %s AND id != %s", (user_update.username, user_id))
            if cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El username ya está en uso"
                )
            update_fields.append("username = %s")
            update_values.append(user_update.username)
        if user_update.password is not None:
            hashed_password = get_password_hash(user_update.password)
            update_fields.append("password = %s")
            update_values.append(hashed_password)
        if not update_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se proporcionaron campos para actualizar"
            )
        # Ejecutar actualización
        update_query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s"
        update_values.append(user_id)
        cursor.execute(update_query, update_values)
        connection.commit()
        # Obtener usuario actualizado
        cursor.execute("SELECT id, username FROM users WHERE id = %s", (user_id,))
        updated_user = cursor.fetchone()
        return UserResponse(**updated_user)
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en la base de datos: {str(e)}"
        )
    finally:
        cursor.close()
        connection.close()

@app.delete("/api/usuarios/{user_id}")
async def eliminar_usuario(user_id: int, current_user: dict = Depends(get_current_user)):
    """Elimina un usuario"""
    connection = get_db_connection()
    cursor = connection.cursor()
    
    try:
        # Verificar que el usuario existe
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        # Eliminar usuario permanentemente
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        connection.commit()
        return {"message": "Usuario eliminado exitosamente"}
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en la base de datos: {str(e)}"
        )
    finally:
        cursor.close()
        connection.close()

@app.post("/api/usuarios/logout")
async def logout_usuario(current_user: dict = Depends(get_current_user)):
    """Cierra sesión del usuario"""
    # En JWT, el logout se maneja en el frontend eliminando el token
    return {"message": "Sesión cerrada exitosamente"}

# Endpoint temporal para probar la conexión a la base de datos
@app.get("/api/test-db-connection")
def test_db_connection():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        cursor.close()
        conn.close()
        return {"success": True, "tables": tables}
    except Exception as e:
        return {"success": False, "error": str(e)}

# Rutas del Frontend
@app.get("/mainpage", response_class=HTMLResponse)
async def mainpage():
    """Página principal después del login"""
    template_path = BASE_DIR / "frontend" / "templates" / "mainpage.html"
    with open(template_path, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/pisos", response_class=HTMLResponse)
async def pisos():
    template_path = BASE_DIR / "frontend" / "templates" / "pisos.html"
    with open(template_path, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

# Endpoint generador de imagenes piso
@app.post("/generar/piso/{material}")
async def generar_piso(material: str, current_user: dict = Depends(get_current_user)):
    try:
        prompt = f"Generate a seamless {material} floor texture, high quality, photorealistic, detailed surface pattern, 1024x1024"
        
        # Rutas de archivos
        base_image_path = "frontend/static/generated/base/base.png"
        output_path = f"frontend/static/generated/piso/{material}_{current_user['id']}.png"
        
        # Generar con composición de imagen base
        generate_image(prompt, output_path, base_image_path)
        
        # Devolver la ruta web accesible
        web_path = f"/static/generated/piso/{material}_{current_user['id']}.png"
        return {"status": "success", "file": web_path, "message": "Piso aplicado exitosamente a la habitación"}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generando piso: {str(e)}"
        )

# Endpoint del chatbot con contexto dinámico
@app.post("/chat")
async def chat_endpoint(message: ChatMessage, current_user: dict = Depends(get_current_user)):
    try:
        # Inicializar la base de conocimientos
        knowledge_base = CompanyKnowledgeBase()
        
        # Obtener contexto relevante para la consulta del usuario
        context = knowledge_base.get_context_for_query(message.message)
        
        # Crear el prompt para OpenAI con contexto dinámico
        system_message = f"""Eres un asistente virtual profesional de Cimientos Construcciones S.A.S., empresa especializada en construcción y remodelaciones.

INFORMACIÓN DE LA EMPRESA:
{context}

INSTRUCCIONES:
- Responde de manera amigable, profesional y útil
- Usa la información proporcionada para dar respuestas específicas y detalladas
- Si no tienes información específica, menciona que pueden contactar para más detalles
- Promociona los servicios de la empresa de manera natural
- Mantén las respuestas concisas pero informativas
- Incluye precios cuando sea relevante
- Siempre menciona los datos de contacto cuando sea apropiado"""

        # Verificar que el cliente OpenAI esté inicializado
        if not client:
            raise Exception("OpenAI API key no configurada")
            
        # Llamar a OpenAI con el contexto dinámico
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": message.message}
            ],
            max_tokens=300,
            temperature=0.7
        )
        
        return {
            "response": response.choices[0].message.content,
            "status": "success"
        }
        
    except Exception as e:
        return {
            "response": "Disculpa, tengo problemas técnicos momentáneos. Por favor contacta directamente al +57 320 273 8391 o cimientos2025@gmail.com",
            "status": "error",
            "detail": str(e)
        }
        

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)