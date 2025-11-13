package com.upiiz.controlAsistencia.services;

import com.upiiz.controlAsistencia.models.HorarioModel;
import com.upiiz.controlAsistencia.repositories.HorarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Time;
import java.util.List;
import java.util.Optional;

@Service
public class HorarioService implements HorarioRepository {

    @Autowired
    JdbcTemplate jdbcTemplate;

    @Override
    public List<HorarioModel> findAllByGrupoId(Long grupoId) {
        return jdbcTemplate.query("SELECT * FROM horarios WHERE id_grupo = ?",
                new BeanPropertyRowMapper<>(HorarioModel.class), grupoId);
    }

    @Override
    public Optional<HorarioModel> findById(Long id) {
        return jdbcTemplate.query("SELECT * FROM horarios WHERE id = ?",
                        new BeanPropertyRowMapper<>(HorarioModel.class), id)
                .stream().findFirst();
    }

    @Override
    public HorarioModel save(HorarioModel horario) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO horarios (id_grupo, dia_semana, hora_inicio, hora_fin, tipo_horario, aula) VALUES (?, ?, ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setLong(1, horario.getIdGrupo());
            ps.setString(2, horario.getDiaSemana());
            ps.setTime(3, Time.valueOf(horario.getHoraInicio()));
            ps.setTime(4, Time.valueOf(horario.getHoraFin()));
            ps.setString(5, horario.getTipoHorario());
            ps.setString(6, horario.getAula());
            return ps;
        }, keyHolder);

        Number generatedId = keyHolder.getKey();
        if (generatedId != null) {
            horario.setId(generatedId.longValue());
        }

        return horario;
    }

    @Override
    public int update(HorarioModel horario) {
        return jdbcTemplate.update(
                "UPDATE horarios SET dia_semana = ?, hora_inicio = ?, hora_fin = ?, tipo_horario = ?, aula = ? WHERE id = ?",
                horario.getDiaSemana(), Time.valueOf(horario.getHoraInicio()),
                Time.valueOf(horario.getHoraFin()), horario.getTipoHorario(),
                horario.getAula(), horario.getId()
        );
    }

    @Override
    public int delete(Long id) {
        return jdbcTemplate.update("DELETE FROM horarios WHERE id = ?", id);
    }

    @Override
    public int deleteByGrupoId(Long grupoId) {
        return jdbcTemplate.update("DELETE FROM horarios WHERE id_grupo = ?", grupoId);
    }

}