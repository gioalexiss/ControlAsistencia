-- =============================================
-- TABLAS EXISTENTES (Login)
-- =============================================

CREATE TABLE IF NOT EXISTS docentes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  correo VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  verificado BOOLEAN
);

CREATE TABLE IF NOT EXISTS verificacion_docente (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  correo VARCHAR(100),
  codigo VARCHAR(10),
  expiracion DATETIME
);

-- =============================================
-- NUEVAS TABLAS (Sistema de Horario y Asistencia)
-- =============================================

-- 1. UNIDADES ACADÉMICAS (Materias)
CREATE TABLE IF NOT EXISTS unidades (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_docente BIGINT NOT NULL,
    nombre_unidad VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_docente) REFERENCES docentes(id) ON DELETE CASCADE
);

-- 2. GRUPOS (Grupos por materia)
CREATE TABLE IF NOT EXISTS grupos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_unidad BIGINT NOT NULL,
    nombre_grupo VARCHAR(100) NOT NULL,
    semestre INT,
    tipo VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_unidad) REFERENCES unidades(id) ON DELETE CASCADE
);

-- 3. HORARIOS (Horas y días de clase)
CREATE TABLE IF NOT EXISTS horarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_grupo BIGINT NOT NULL,
    dia_semana ENUM('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado') NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    tipo_horario ENUM('Teórica','Práctica') NOT NULL,
    aula VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_grupo) REFERENCES grupos(id) ON DELETE CASCADE
);

-- 4. ESTUDIANTES (Lista de alumnos)
CREATE TABLE IF NOT EXISTS estudiantes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    boleta VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(150),
    qr_code VARCHAR(255) UNIQUE,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. GRUPO_ESTUDIANTE (Relación estudiantes-grupos)
CREATE TABLE IF NOT EXISTS grupo_estudiante (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_grupo BIGINT NOT NULL,
    id_estudiante BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_grupo) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_grupo_estudiante (id_grupo, id_estudiante)
);

-- 6. ASISTENCIAS (Registro de asistencia)
CREATE TABLE IF NOT EXISTS asistencias (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante BIGINT NOT NULL,
    id_horario BIGINT NOT NULL,
    fecha DATE NOT NULL,
    hora_registro TIME NOT NULL,
    estado ENUM('Presente', 'Tardanza', 'Falta') DEFAULT 'Falta',
    metodo_registro ENUM('QR', 'Manual') DEFAULT 'Manual',
    sesion_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id) ON DELETE CASCADE,
    FOREIGN KEY (id_horario) REFERENCES horarios(id) ON DELETE CASCADE
);

-- 7. SESIONES_ASISTENCIA (Control de tomas de asistencia)
CREATE TABLE IF NOT EXISTS sesiones_asistencia (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_docente BIGINT NOT NULL,
    id_horario BIGINT NOT NULL,
    fecha_sesion DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME,
    estado_sesion ENUM('activa', 'finalizada') DEFAULT 'activa',
    codigo_sesion VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_docente) REFERENCES docentes(id) ON DELETE CASCADE,
    FOREIGN KEY (id_horario) REFERENCES horarios(id) ON DELETE CASCADE
);

-- =============================================
-- ÍNDICES PARA MEJORAR EL RENDIMIENTO
-- =============================================

CREATE INDEX IF NOT EXISTS idx_unidades_docente ON unidades(id_docente);
CREATE INDEX IF NOT EXISTS idx_grupos_unidad ON grupos(id_unidad);
CREATE INDEX IF NOT EXISTS idx_horarios_grupo ON horarios(id_grupo);
CREATE INDEX IF NOT EXISTS idx_asistencias_estudiante ON asistencias(id_estudiante);
CREATE INDEX IF NOT EXISTS idx_asistencias_horario ON asistencias(id_horario);
CREATE INDEX IF NOT EXISTS idx_sesiones_docente ON sesiones_asistencia(id_docente);
