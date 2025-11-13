package com.upiiz.controlAsistencia.repositories;

import com.upiiz.controlAsistencia.models.EstudianteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EstudianteRepository extends JpaRepository<EstudianteEntity, Long> {

    // Buscar estudiante por boleta
    Optional<EstudianteEntity> findByBoleta(String boleta);

    // Verificar si existe un estudiante con esa boleta
    boolean existsByBoleta(String boleta);

    // Buscar por correo
    Optional<EstudianteEntity> findByCorreo(String correo);
}
