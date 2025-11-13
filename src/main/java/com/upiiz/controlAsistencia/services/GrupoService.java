package com.upiiz.controlAsistencia.services;

import com.upiiz.controlAsistencia.models.GrupoModel;
import com.upiiz.controlAsistencia.repositories.GrupoRepository;
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
public class GrupoService implements GrupoRepository {

    @Autowired
    JdbcTemplate jdbcTemplate;

    @Override
    public List<GrupoModel> findAllByUnidadId(Long unidadId) {
        return jdbcTemplate.query("SELECT * FROM grupos WHERE id_unidad = ?",
                new BeanPropertyRowMapper<>(GrupoModel.class), unidadId);
    }

    @Override
    public Optional<GrupoModel> findById(Long id) {
        return jdbcTemplate.query("SELECT * FROM grupos WHERE id = ?",
                        new BeanPropertyRowMapper<>(GrupoModel.class), id)
                .stream().findFirst();
    }

    @Override
    public GrupoModel save(GrupoModel grupo) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO grupos (id_unidad, nombre_grupo, semestre, tipo) VALUES (?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setLong(1, grupo.getIdUnidad());
            ps.setString(2, grupo.getNombreGrupo());
            ps.setObject(3, grupo.getSemestre());
            ps.setString(4, grupo.getTipo());
            return ps;
        }, keyHolder);

        Number generatedId = keyHolder.getKey();
        if (generatedId != null) {
            grupo.setId(generatedId.longValue());
        }

        return grupo;
    }

    @Override
    public int update(GrupoModel grupo) {
        return jdbcTemplate.update(
                "UPDATE grupos SET nombre_grupo = ?, semestre = ?, tipo = ? WHERE id = ?",
                grupo.getNombreGrupo(), grupo.getSemestre(), grupo.getTipo(), grupo.getId()
        );
    }

    @Override
    public int delete(Long id) {
        return jdbcTemplate.update("DELETE FROM grupos WHERE id = ?", id);
    }

    @Override
    public boolean existsByUnidadAndNombre(Long unidadId, String nombreGrupo) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM grupos WHERE id_unidad = ? AND nombre_grupo = ?",
                Integer.class, unidadId, nombreGrupo
        );
        return count != null && count > 0;
    }
}