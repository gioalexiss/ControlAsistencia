package com.upiiz.controlAsistencia.services;

import com.upiiz.controlAsistencia.models.DocenteModel;
import com.upiiz.controlAsistencia.models.VerificacionModel;
import com.upiiz.controlAsistencia.repositories.DocenteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class DocenteService implements DocenteRepository {

    @Autowired
    JdbcTemplate jdbcTemplate;

    @Autowired
    VerificacionService verifRepo;

    @Autowired
    EmailService emailService;

    @Autowired
    PasswordEncoder passwordEncoder;

    // =============== MÉTODOS JDBC CRUD ====================

    @Override
    public List<DocenteModel> findAllDocentes() {
        return jdbcTemplate.query("SELECT * FROM docentes",
                new BeanPropertyRowMapper<>(DocenteModel.class));
    }

    @Override
    public Optional<DocenteModel> findDocenteById(Long id) {
        return jdbcTemplate.query("SELECT * FROM docentes WHERE id = ?",
                        new BeanPropertyRowMapper<>(DocenteModel.class), id)
                .stream().findFirst();
    }

    @Override
    public Optional<DocenteModel> findDocenteByCorreo(String correo) {
        return jdbcTemplate.query("SELECT * FROM docentes WHERE correo = ?",
                        new BeanPropertyRowMapper<>(DocenteModel.class), correo)
                .stream().findFirst();
    }

    @Override
    public DocenteModel save(DocenteModel docente) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO docentes (nombre, correo, password, verificado) VALUES (?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, docente.getNombre());
            ps.setString(2, docente.getCorreo());
            ps.setString(3, docente.getPassword());
            ps.setBoolean(4, docente.isVerificado());
            return ps;
        }, keyHolder);

        Number generatedId = keyHolder.getKey();
        if (generatedId != null) {
            docente.setId(generatedId.longValue());
        } else {
            docente.setId(0L);
        }

        return docente;
    }

    @Override
    public int update(DocenteModel docente) {
        return jdbcTemplate.update(
                "UPDATE docentes SET nombre = ?, correo = ?, password = ?, verificado = ? WHERE id = ?",
                docente.getNombre(), docente.getCorreo(), docente.getPassword(),
                docente.isVerificado(), docente.getId()
        );
    }

    @Override
    public int delete(Long id) {
        return jdbcTemplate.update("DELETE FROM docentes WHERE id = ?", id);
    }

    @Override
    public boolean existsByCorreo(String correo) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM docentes WHERE correo = ?", Integer.class, correo
        );
        return count != null && count > 0;
    }

    @Override
    public int updateVerificado(String correo, boolean verificado) {
        return jdbcTemplate.update("UPDATE docentes SET verificado = ? WHERE correo = ?", verificado, correo);
    }

    // =============== LÓGICA DE NEGOCIO (registro/login/verificación) ====================

    public String registrar(String nombre, String correo, String password) {
        // 🔹 Validación: nombre mínimo 10 caracteres
        if (nombre == null || nombre.trim().length() < 10) {
            return "El nombre debe tener al menos 10 caracteres.";
        }

        // 🔹 Validación: formato de correo
        String regexCorreo = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        if (correo == null || !correo.matches(regexCorreo)) {
            return "Por favor, introduce un correo válido.";
        }

        // 🔹 Validación: contraseña mínimo 10 caracteres
        if (password == null || password.length() < 10) {
            return "La contraseña debe tener al menos 10 caracteres.";
        }

        // 🔹 Validación: correo ya existe
        if (existsByCorreo(correo)) {
            return "El correo ya está registrado.";
        }

        DocenteModel docente = new DocenteModel();
        docente.setNombre(nombre);
        docente.setCorreo(correo);
        docente.setPassword(passwordEncoder.encode(password));
        docente.setVerificado(false);

        save(docente);

        String codigo = generarCodigo();
        VerificacionModel verif = new VerificacionModel();
        verif.setCorreo(correo);
        verif.setCodigo(codigo);
        verif.setExpiracion(LocalDateTime.now().plusMinutes(10));

        verifRepo.save(verif);
        emailService.enviarCodigo(correo, codigo);

        return "Usuario registrado. Verifica tu correo.";
    }

    public String verificar(String correo, String codigoIngresado) {
        Optional<VerificacionModel> opt = verifRepo.findByCorreo(correo);
        if (opt.isEmpty()) return "No se encontró código para ese correo.";

        VerificacionModel verif = opt.get();
        if (verif.getExpiracion().isBefore(LocalDateTime.now()))
            return "El código ha expirado.";

        if (!verif.getCodigo().equals(codigoIngresado))
            return "Código incorrecto.";

        updateVerificado(correo, true);
        verifRepo.deleteByCorreo(correo);

        return "Correo verificado correctamente.";
    }

    private String generarCodigo() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    public String login(String correo, String password) {
        Optional<DocenteModel> opt = findDocenteByCorreo(correo);
        if (opt.isEmpty()) return "ERROR: Correo no encontrado.";

        DocenteModel docente = opt.get();
        if (!docente.isVerificado()) return "ERROR: Tu correo aún no ha sido verificado.";

        if (!passwordEncoder.matches(password, docente.getPassword()))
            return "ERROR: Contraseña incorrecta.";

        return "OK: Inicio de sesión exitoso.";
    }
}