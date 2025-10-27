package com.upiiz.controlAsistencia.repositories;

import com.upiiz.controlAsistencia.models.HorarioModel;
import java.util.List;

public interface HorarioRepository {
    List<HorarioModel> findAll();
    HorarioModel save(HorarioModel horario);
    List<HorarioModel> findByDia(String dia);
}
