package com.upiiz.controlAsistencia.repositories;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import com.upiiz.controlAsistencia.models.GrupoModel;

@Repository
public interface GrupoRepository {
    List<GrupoModel> findAllByUnidadId(Long unidadId);
    Optional<GrupoModel> findById(Long id);
    GrupoModel save(GrupoModel grupo);
    int update(GrupoModel grupo);
    int delete(Long id);
    boolean existsByUnidadAndNombre(Long unidadId, String nombreGrupo);
}