-- Script SQL para configurar la base de datos del sistema de construcción
-- Ejecutar estos comandos en MySQL (a través de phpMyAdmin o línea de comandos)

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS loging_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE loging_db;

-- Crear tabla de usuarios simplificada
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    
    -- Índice para mejorar rendimiento
    INDEX idx_username (username)
);

-- Crear usuario administrador por defecto (opcional)
-- Nota: La contraseña es 'admin123' - cambiarla después del primer login
-- Hash generado con bcrypt para 'admin123'
INSERT IGNORE INTO usuarios (
    username, 
    password
) VALUES (
    'admin',
    '$2b$12$LQv3c1yqBwlVHpPjrM0GZ.Hhd8D5gJxGf8PvMZ.xJ5K0J2L6M8N9O'
);

-- Mostrar información sobre las tablas creadas
SHOW TABLES;

-- Mostrar estructura de la tabla usuarios
DESCRIBE usuarios;

-- Mostrar usuarios existentes (sin mostrar password por seguridad)
SELECT 
    id,
    username,
    '******' as password_hidden
FROM usuarios;