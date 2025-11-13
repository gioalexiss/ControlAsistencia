package com.upiiz.controlAsistencia.repositories;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import com.upiiz.controlAsistencia.models.UnidadModel;

@Repository
public interface UnidadRepository {
    List<UnidadModel> findAllByDocenteId(Long docenteId);
    Optional<UnidadModel> findById(Long id);
    UnidadModel save(UnidadModel unidad);
    int update(UnidadModel unidad);
    int delete(Long id);
    boolean existsByDocenteAndNombre(Long docenteId, String nombreUnidad);
}