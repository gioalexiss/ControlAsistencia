package com.upiiz.controlAsistencia.services;

import com.upiiz.controlAsistencia.models.HorarioModel;
import com.upiiz.controlAsistencia.repositories.HorarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.*;

@Service
public class HorarioService implements HorarioRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public List<HorarioModel> findAll() {
        return jdbcTemplate.query(
                "SELECT * FROM Horarios",
                new BeanPropertyRowMapper<>(HorarioModel.class)
        );
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


    public List<HorarioModel> procesarImagen(MultipartFile imagen) {
        // Guardamos temporalmente la imagen
        File file = new File(System.getProperty("java.io.tmpdir") + "/" + imagen.getOriginalFilename());
        try { imagen.transferTo(file); } catch (IOException e) { e.printStackTrace(); }

        // Simulamos extracción de datos (en práctica usar OCR)
        List<HorarioModel> horarios = new ArrayList<>();
        horarios.add(new HorarioModel("Lunes","08:00 - 09:00","Matemáticas"));
        horarios.add(new HorarioModel("Martes","09:00 - 10:00","Física"));
        horarios.add(new HorarioModel("Miércoles","10:00 - 11:00","Química"));

        // Guardamos en BD
        for(HorarioModel h : horarios) save(h);

        return horarios;
    }
}
