-- Script SQL para crear la tabla de asistencias
-- Sistema de Control de Asistencia IPN

CREATE TABLE IF NOT EXISTS asistencias (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id BIGINT NOT NULL,
    grupo_id BIGINT,
    unidad_id BIGINT,
    docente_id BIGINT NOT NULL,
    fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_asistencia VARCHAR(20) DEFAULT 'PRESENTE',
    observaciones VARCHAR(500),

    -- Índices para mejorar el rendimiento de las consultas
    INDEX idx_estudiante (estudiante_id),
    INDEX idx_docente (docente_id),
    INDEX idx_fecha (fecha_hora),
    INDEX idx_grupo (grupo_id),
    INDEX idx_unidad (unidad_id),
    INDEX idx_estudiante_fecha (estudiante_id, fecha_hora),
    INDEX idx_docente_fecha (docente_id, fecha_hora),

    -- Claves foráneas (opcional, descomentar si las tablas referenciadas tienen restricciones FK)
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE SET NULL,
    FOREIGN KEY (unidad_id) REFERENCES unidades(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentarios de la tabla
ALTER TABLE asistencias COMMENT = 'Tabla para registrar las asistencias de los estudiantes';

-- Comentarios de las columnas
ALTER TABLE asistencias MODIFY COLUMN id BIGINT AUTO_INCREMENT COMMENT 'ID único de la asistencia';
ALTER TABLE asistencias MODIFY COLUMN estudiante_id BIGINT NOT NULL COMMENT 'ID del estudiante que registra asistencia';
ALTER TABLE asistencias MODIFY COLUMN grupo_id BIGINT COMMENT 'ID del grupo (opcional)';
ALTER TABLE asistencias MODIFY COLUMN unidad_id BIGINT COMMENT 'ID de la unidad/materia (opcional)';
ALTER TABLE asistencias MODIFY COLUMN docente_id BIGINT NOT NULL COMMENT 'ID del docente que toma la asistencia';
ALTER TABLE asistencias MODIFY COLUMN fecha_hora DATETIME NOT NULL COMMENT 'Fecha y hora del registro de asistencia';
ALTER TABLE asistencias MODIFY COLUMN tipo_asistencia VARCHAR(20) COMMENT 'Tipo de asistencia: PRESENTE, RETARDO, FALTA';
ALTER TABLE asistencias MODIFY COLUMN observaciones VARCHAR(500) COMMENT 'Observaciones adicionales sobre la asistencia';
