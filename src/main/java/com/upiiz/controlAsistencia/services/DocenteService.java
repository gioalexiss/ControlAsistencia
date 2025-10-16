package com.upiiz.controlAsistencia.services;

import org.springframework.stereotype.Service;
import com.upiiz.controlAsistencia.models.DocenteModel;
import com.upiiz.controlAsistencia.repositories.DocenteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;


import java.util.Collections;


@Service
public class DocenteService implements DocenteRepository, UserDetailsService{
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public DocenteModel findByCorreo(String correo) {
        return jdbcTemplate.query(
                "SELECT * FROM Docentes WHERE correo = ?",
                new BeanPropertyRowMapper<>(DocenteModel.class),
                correo
        ).stream().findFirst().orElse(null);
    }

    @Override
    public UserDetails loadUserByUsername(String correo) throws UsernameNotFoundException {
        DocenteModel docente = findByCorreo(correo);

        if (docente == null) {
            throw new UsernameNotFoundException("Usuario no encontrado");
        }

        return new User(
                docente.getCorreo(),
                docente.getContrasena(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_DOCENTE"))
        );
    }
}
