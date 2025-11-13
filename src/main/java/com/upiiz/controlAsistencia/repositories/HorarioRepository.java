package com.upiiz.controlAsistencia.repositories;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import com.upiiz.controlAsistencia.models.HorarioModel;

@Repository
public interface HorarioRepository {
    List<HorarioModel> findAllByGrupoId(Long grupoId);
    Optional<HorarioModel> findById(Long id);
    HorarioModel save(HorarioModel horario);
    int update(HorarioModel horario);
    int delete(Long id);
    int deleteByGrupoId(Long grupoId);
}