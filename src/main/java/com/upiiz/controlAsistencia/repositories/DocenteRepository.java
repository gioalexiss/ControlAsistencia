package com.upiiz.controlAsistencia.repositories;

import com.upiiz.controlAsistencia.models.DocenteModel;
import org.springframework.stereotype.Repository;

@Repository
public interface DocenteRepository {
    DocenteModel findByCorreo(String correo);
}
