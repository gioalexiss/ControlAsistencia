package com.upiiz.controlAsistencia.services;

import com.upiiz.controlAsistencia.models.HorarioModel;
import com.upiiz.controlAsistencia.repositories.HorarioRepository;
import com.upiiz.controlAsistencia.utils.PdfHorarioExtractor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.*;

@Service
public class HorarioService implements HorarioRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PdfHorarioExtractor pdfExtractor;

    @Override
    public List<HorarioModel> findAll() {
        return jdbcTemplate.query("SELECT * FROM Horarios", new BeanPropertyRowMapper<>(HorarioModel.class));
    }

    @Override
    public HorarioModel save(HorarioModel horario) {
        jdbcTemplate.update(
                "INSERT INTO Horarios(dia, hora, materia) VALUES (?, ?, ?)",
                horario.getDia(), horario.getHora(), horario.getMateria()
        );
        return horario;
    }

    @Override
    public List<HorarioModel> findByDia(String dia) {
        return jdbcTemplate.query(
                "SELECT * FROM Horarios WHERE dia = ?",
                new BeanPropertyRowMapper<>(HorarioModel.class),
                dia
        );
    }

    public List<HorarioModel> procesarHorario(MultipartFile archivoPdf) {
        try {
            File temp = File.createTempFile("horario-", ".pdf");
            archivoPdf.transferTo(temp);

            List<HorarioModel> horarios = pdfExtractor.extraerHorarios(temp);

            for (HorarioModel h : horarios) {
                save(h);
            }

            return horarios;
        } catch (Exception e) {
            e.printStackTrace();
            return Collections.emptyList();
        }
    }
}
