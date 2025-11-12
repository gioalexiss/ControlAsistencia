package com.upiiz.controlAsistencia.repositories;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import com.upiiz.controlAsistencia.models.VerificacionModel;

@Repository
public interface VerificacionRepository {
    void save(VerificacionModel v);
    Optional<VerificacionModel> findByCorreo(String correo);
    int deleteByCorreo(String correo);
    List<VerificacionModel> findAll();
}