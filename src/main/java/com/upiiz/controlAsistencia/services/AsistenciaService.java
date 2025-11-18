package com.upiiz.controlAsistencia.services;

import com.upiiz.controlAsistencia.models.AsistenciaEntity;
import com.upiiz.controlAsistencia.repositories.AsistenciaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AsistenciaService implements AsistenciaRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public AsistenciaEntity save(AsistenciaEntity asistencia) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                "INSERT INTO asistencias (estudiante_id, grupo_id, unidad_id, docente_id, fecha_hora, tipo_asistencia, observaciones) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                Statement.RETURN_GENERATED_KEYS
            );
            ps.setLong(1, asistencia.getEstudianteId());
            if (asistencia.getGrupoId() != null) {
                ps.setLong(2, asistencia.getGrupoId());
            } else {
                ps.setNull(2, java.sql.Types.BIGINT);
            }
            if (asistencia.getUnidadId() != null) {
                ps.setLong(3, asistencia.getUnidadId());
            } else {
                ps.setNull(3, java.sql.Types.BIGINT);
            }
            ps.setLong(4, asistencia.getDocenteId());
            ps.setTimestamp(5, Timestamp.valueOf(asistencia.getFechaHora()));
            ps.setString(6, asistencia.getTipoAsistencia());
            ps.setString(7, asistencia.getObservaciones());
            return ps;
        }, keyHolder);

        Number generatedId = keyHolder.getKey();
        if (generatedId != null) {
            asistencia.setId(generatedId.longValue());
        }

        return asistencia;
    }

    @Override
    public Optional<AsistenciaEntity> findById(Long id) {
        String sql = "SELECT * FROM asistencias WHERE id = ?";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AsistenciaEntity.class), id)
            .stream().findFirst();
    }

    @Override
    public List<AsistenciaEntity> findAll() {
        String sql = "SELECT * FROM asistencias ORDER BY fecha_hora DESC";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AsistenciaEntity.class));
    }

    @Override
    public List<AsistenciaEntity> findByDocenteId(Long docenteId) {
        String sql = "SELECT * FROM asistencias WHERE docente_id = ? ORDER BY fecha_hora DESC";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AsistenciaEntity.class), docenteId);
    }

    @Override
    public List<AsistenciaEntity> findByDocenteIdAndFecha(Long docenteId, LocalDate fecha) {
        String sql = "SELECT * FROM asistencias WHERE docente_id = ? AND DATE(fecha_hora) = ? ORDER BY fecha_hora DESC";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AsistenciaEntity.class), docenteId, fecha);
    }

    @Override
    public List<AsistenciaEntity> findByDocenteIdAndGrupoId(Long docenteId, Long grupoId) {
        String sql = "SELECT * FROM asistencias WHERE docente_id = ? AND grupo_id = ? ORDER BY fecha_hora DESC";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AsistenciaEntity.class), docenteId, grupoId);
    }

    @Override
    public List<AsistenciaEntity> findByDocenteIdAndUnidadId(Long docenteId, Long unidadId) {
        String sql = "SELECT * FROM asistencias WHERE docente_id = ? AND unidad_id = ? ORDER BY fecha_hora DESC";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AsistenciaEntity.class), docenteId, unidadId);
    }

    @Override
    public Optional<AsistenciaEntity> findByEstudianteIdAndFechaAndUnidadId(Long estudianteId, LocalDate fecha, Long unidadId) {
        String sql = "SELECT * FROM asistencias WHERE estudiante_id = ? AND DATE(fecha_hora) = ? AND unidad_id = ?";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AsistenciaEntity.class), estudianteId, fecha, unidadId)
            .stream().findFirst();
    }

    @Override
    public int delete(Long id) {
        String sql = "DELETE FROM asistencias WHERE id = ?";
        return jdbcTemplate.update(sql, id);
    }

    @Override
    public int update(AsistenciaEntity asistencia) {
        String sql = "UPDATE asistencias SET estudiante_id = ?, grupo_id = ?, unidad_id = ?, docente_id = ?, " +
                     "fecha_hora = ?, tipo_asistencia = ?, observaciones = ? WHERE id = ?";
        return jdbcTemplate.update(sql,
            asistencia.getEstudianteId(),
            asistencia.getGrupoId(),
            asistencia.getUnidadId(),
            asistencia.getDocenteId(),
            Timestamp.valueOf(asistencia.getFechaHora()),
            asistencia.getTipoAsistencia(),
            asistencia.getObservaciones(),
            asistencia.getId()
        );
    }

    /**
     * Obtener asistencias con información completa (nombres de estudiante, grupo, unidad)
     */
    public List<AsistenciaEntity> findByDocenteIdConDetalles(Long docenteId) {
        String sql = """
            SELECT a.*,
                   e.nombre as nombreEstudiante,
                   e.boleta as boletaEstudiante,
                   g.nombre_grupo as nombreGrupo,
                   u.nombre_unidad as nombreUnidad
            FROM asistencias a
            LEFT JOIN estudiantes e ON a.estudiante_id = e.id
            LEFT JOIN grupos g ON a.grupo_id = g.id
            LEFT JOIN unidades u ON a.unidad_id = u.id
            WHERE a.docente_id = ?
            ORDER BY a.fecha_hora DESC
            """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            AsistenciaEntity asistencia = new AsistenciaEntity();
            asistencia.setId(rs.getLong("id"));
            asistencia.setEstudianteId(rs.getLong("estudiante_id"));
            asistencia.setGrupoId(rs.getObject("grupo_id") != null ? rs.getLong("grupo_id") : null);
            asistencia.setUnidadId(rs.getObject("unidad_id") != null ? rs.getLong("unidad_id") : null);
            asistencia.setDocenteId(rs.getLong("docente_id"));
            asistencia.setFechaHora(rs.getTimestamp("fecha_hora").toLocalDateTime());
            asistencia.setTipoAsistencia(rs.getString("tipo_asistencia"));
            asistencia.setObservaciones(rs.getString("observaciones"));
            asistencia.setNombreEstudiante(rs.getString("nombreEstudiante"));
            asistencia.setBoletaEstudiante(rs.getString("boletaEstudiante"));
            asistencia.setNombreGrupo(rs.getString("nombreGrupo"));
            asistencia.setNombreUnidad(rs.getString("nombreUnidad"));
            return asistencia;
        }, docenteId);
    }

    /**
     * Obtener asistencias del día con detalles
     */
    public List<AsistenciaEntity> findByDocenteIdAndFechaConDetalles(Long docenteId, LocalDate fecha) {
        String sql = """
            SELECT a.*,
                   e.nombre as nombreEstudiante,
                   e.boleta as boletaEstudiante,
                   g.nombre_grupo as nombreGrupo,
                   u.nombre_unidad as nombreUnidad
            FROM asistencias a
            LEFT JOIN estudiantes e ON a.estudiante_id = e.id
            LEFT JOIN grupos g ON a.grupo_id = g.id
            LEFT JOIN unidades u ON a.unidad_id = u.id
            WHERE a.docente_id = ? AND DATE(a.fecha_hora) = ?
            ORDER BY a.fecha_hora DESC
            """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            AsistenciaEntity asistencia = new AsistenciaEntity();
            asistencia.setId(rs.getLong("id"));
            asistencia.setEstudianteId(rs.getLong("estudiante_id"));
            asistencia.setGrupoId(rs.getObject("grupo_id") != null ? rs.getLong("grupo_id") : null);
            asistencia.setUnidadId(rs.getObject("unidad_id") != null ? rs.getLong("unidad_id") : null);
            asistencia.setDocenteId(rs.getLong("docente_id"));
            asistencia.setFechaHora(rs.getTimestamp("fecha_hora").toLocalDateTime());
            asistencia.setTipoAsistencia(rs.getString("tipo_asistencia"));
            asistencia.setObservaciones(rs.getString("observaciones"));
            asistencia.setNombreEstudiante(rs.getString("nombreEstudiante"));
            asistencia.setBoletaEstudiante(rs.getString("boletaEstudiante"));
            asistencia.setNombreGrupo(rs.getString("nombreGrupo"));
            asistencia.setNombreUnidad(rs.getString("nombreUnidad"));
            return asistencia;
        }, docenteId, fecha);
    }
}
