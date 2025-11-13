package com.upiiz.controlAsistencia.services;

import com.upiiz.controlAsistencia.models.GrupoModel;
import com.upiiz.controlAsistencia.models.HorarioModel;
import com.upiiz.controlAsistencia.models.UnidadModel;
import com.upiiz.controlAsistencia.repositories.UnidadRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Service
public class UnidadService implements UnidadRepository {

    @Autowired
    JdbcTemplate jdbcTemplate;

    @Autowired
    GrupoService grupoService;

    @Autowired
    HorarioService horarioService;

    @Override
    public List<UnidadModel> findAllByDocenteId(Long docenteId) {
        List<UnidadModel> unidades = jdbcTemplate.query(
                "SELECT * FROM unidades WHERE id_docente = ?",
                new BeanPropertyRowMapper<>(UnidadModel.class),
                docenteId
        );

        for (UnidadModel unidad : unidades) {
            List<GrupoModel> grupos = jdbcTemplate.query(
                    "SELECT * FROM grupos WHERE id_unidad = ?",
                    new BeanPropertyRowMapper<>(GrupoModel.class),
                    unidad.getId()
            );

            for (GrupoModel grupo : grupos) {
                List<HorarioModel> horarios = jdbcTemplate.query(
                        "SELECT * FROM horarios WHERE id_grupo = ?",
                        new BeanPropertyRowMapper<>(HorarioModel.class),
                        grupo.getId()
                );
                grupo.setHorarios(horarios);
            }

            unidad.setGrupos(grupos);
        }

        return unidades;
    }

    @Override
    public Optional<UnidadModel> findById(Long id) {
        return jdbcTemplate.query("SELECT * FROM unidades WHERE id = ?",
                        new BeanPropertyRowMapper<>(UnidadModel.class), id)
                .stream().findFirst();
    }

    @Override
    public UnidadModel save(UnidadModel unidad) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO unidades (id_docente, nombre_unidad) VALUES (?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setLong(1, unidad.getIdDocente());
            ps.setString(2, unidad.getNombreUnidad());
            return ps;
        }, keyHolder);

        Number generatedId = keyHolder.getKey();
        if (generatedId != null) {
            unidad.setId(generatedId.longValue());
        }

        return unidad;
    }

    @Override
    public int update(UnidadModel unidad) {
        return jdbcTemplate.update(
                "UPDATE unidades SET nombre_unidad = ? WHERE id = ?",
                unidad.getNombreUnidad(), unidad.getId()
        );
    }

    // 🔹 Delete en cascada
    @Override
    public int delete(Long id) {
        // 1️⃣ Traer todos los grupos de la unidad
        List<GrupoModel> grupos = grupoService.findAllByUnidadId(id);

        // 2️⃣ Borrar horarios de cada grupo
        for (GrupoModel grupo : grupos) {
            horarioService.deleteByGrupoId(grupo.getId());
        }

        // 3️⃣ Borrar grupos
        for (GrupoModel grupo : grupos) {
            grupoService.delete(grupo.getId());
        }

        // 4️⃣ Borrar unidad
        return jdbcTemplate.update("DELETE FROM unidades WHERE id = ?", id);
    }

    @Override
    public boolean existsByDocenteAndNombre(Long docenteId, String nombreUnidad) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM unidades WHERE id_docente = ? AND nombre_unidad = ?",
                Integer.class, docenteId, nombreUnidad
        );
        return count != null && count > 0;
    }
}
