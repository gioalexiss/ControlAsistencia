package com.upiiz.controlAsistencia.repositories;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import com.upiiz.controlAsistencia.models.DocenteModel;

@Repository
public interface DocenteRepository {
    List<DocenteModel> findAllDocentes();
    Optional<DocenteModel> findDocenteById(Long id);
    Optional<DocenteModel> findDocenteByCorreo(String correo);
    DocenteModel save(DocenteModel docente);
    int update(DocenteModel docente);
    int delete(Long id);
    boolean existsByCorreo(String correo);
    int updateVerificado(String correo, boolean verificado);
}