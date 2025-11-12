package com.upiiz.controlAsistencia.services;

import com.upiiz.controlAsistencia.models.VerificacionModel;
import com.upiiz.controlAsistencia.repositories.VerificacionRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Service
public class VerificacionService implements VerificacionRepository {

    private final JdbcTemplate jdbcTemplate;

    public VerificacionService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private RowMapper<VerificacionModel> rowMapper = new RowMapper<VerificacionModel>() {
        @Override
        public VerificacionModel mapRow(ResultSet rs, int rowNum) throws SQLException {
            VerificacionModel v = new VerificacionModel();
            v.setId(rs.getLong("id"));
            v.setCorreo(rs.getString("correo"));
            v.setCodigo(rs.getString("codigo"));
            v.setExpiracion(rs.getTimestamp("expiracion").toLocalDateTime());
            return v;
        }
    };

    @Override
    public void save(VerificacionModel v) {
        jdbcTemplate.update(
                "INSERT INTO verificacion_docente (correo, codigo, expiracion) VALUES (?, ?, ?)",
                v.getCorreo(), v.getCodigo(), v.getExpiracion()
        );
    }

    @Override
    public Optional<VerificacionModel> findByCorreo(String correo) {
        List<VerificacionModel> lista = jdbcTemplate.query(
                "SELECT * FROM verificacion_docente WHERE correo = ?", rowMapper, correo
        );
        return lista.isEmpty() ? Optional.empty() : Optional.of(lista.get(0));
    }

    @Override
    public int deleteByCorreo(String correo) {
        return jdbcTemplate.update("DELETE FROM verificacion_docente WHERE correo = ?", correo);
    }

    @Override
    public List<VerificacionModel> findAll() {
        return jdbcTemplate.query("SELECT * FROM verificacion_docente", rowMapper);
    }
}