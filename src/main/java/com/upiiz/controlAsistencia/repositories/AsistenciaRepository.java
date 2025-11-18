package com.upiiz.controlAsistencia.repositories;

import com.upiiz.controlAsistencia.models.AsistenciaEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AsistenciaRepository {

    AsistenciaEntity save(AsistenciaEntity asistencia);

    Optional<AsistenciaEntity> findById(Long id);

    List<AsistenciaEntity> findAll();

    List<AsistenciaEntity> findByDocenteId(Long docenteId);

    List<AsistenciaEntity> findByDocenteIdAndFecha(Long docenteId, LocalDate fecha);

    List<AsistenciaEntity> findByDocenteIdAndGrupoId(Long docenteId, Long grupoId);

    List<AsistenciaEntity> findByDocenteIdAndUnidadId(Long docenteId, Long unidadId);

    Optional<AsistenciaEntity> findByEstudianteIdAndFechaAndUnidadId(Long estudianteId, LocalDate fecha, Long unidadId);

    int delete(Long id);

    int update(AsistenciaEntity asistencia);
}
