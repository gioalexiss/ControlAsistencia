package com.upiiz.controlAsistencia.repositories;

import com.upiiz.controlAsistencia.models.GrupoEstudianteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GrupoEstudianteRepository extends JpaRepository<GrupoEstudianteEntity, Long> {

    // Buscar estudiantes de un grupo específico
    List<GrupoEstudianteEntity> findByIdGrupo(Long idGrupo);

    // Buscar grupos de un estudiante específico
    List<GrupoEstudianteEntity> findByIdEstudiante(Long idEstudiante);

    // Verificar si un estudiante ya está en un grupo
    boolean existsByIdGrupoAndIdEstudiante(Long idGrupo, Long idEstudiante);

    // Eliminar un estudiante de un grupo
    void deleteByIdGrupoAndIdEstudiante(Long idGrupo, Long idEstudiante);

    // Obtener todos los estudiantes de todos los grupos de un docente
    @Query(value = "SELECT ge.* FROM grupo_estudiante ge " +
                   "WHERE ge.id_grupo IN " +
                   "(SELECT g.id FROM grupos g WHERE g.id_unidad IN " +
                   "(SELECT u.id FROM unidades u WHERE u.id_docente = :docenteId))",
           nativeQuery = true)
    List<GrupoEstudianteEntity> findAllByDocenteId(@Param("docenteId") Long docenteId);
}
