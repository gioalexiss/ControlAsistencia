package com.upiiz.controlAsistencia.repositories;

import com.upiiz.controlAsistencia.models.HorarioModel;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HorarioRepository {
    List<HorarioModel> findAll();
    HorarioModel save(HorarioModel horario);
    List<HorarioModel> findByDia(String dia);
}
