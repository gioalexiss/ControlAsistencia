package com.upiiz.controlAsistencia.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "grupo_estudiante")
public class GrupoEstudianteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_grupo", nullable = false)
    private Long idGrupo;

    @Column(name = "id_estudiante", nullable = false)
    private Long idEstudiante;

    @Column(name = "id_unidad")
    private Long idUnidad;

    @Column(name = "fecha_asignacion")
    private LocalDateTime fechaAsignacion;

    public GrupoEstudianteEntity() {
        this.fechaAsignacion = LocalDateTime.now();
    }

    public GrupoEstudianteEntity(Long idGrupo, Long idEstudiante) {
        this.idGrupo = idGrupo;
        this.idEstudiante = idEstudiante;
        this.fechaAsignacion = LocalDateTime.now();
    }

    public GrupoEstudianteEntity(Long idGrupo, Long idEstudiante, Long idUnidad) {
        this.idGrupo = idGrupo;
        this.idEstudiante = idEstudiante;
        this.idUnidad = idUnidad;
        this.fechaAsignacion = LocalDateTime.now();
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getIdGrupo() {
        return idGrupo;
    }

    public void setIdGrupo(Long idGrupo) {
        this.idGrupo = idGrupo;
    }

    public Long getIdEstudiante() {
        return idEstudiante;
    }

    public void setIdEstudiante(Long idEstudiante) {
        this.idEstudiante = idEstudiante;
    }

    public LocalDateTime getFechaAsignacion() {
        return fechaAsignacion;
    }

    public void setFechaAsignacion(LocalDateTime fechaAsignacion) {
        this.fechaAsignacion = fechaAsignacion;
    }

    public Long getIdUnidad() {
        return idUnidad;
    }

    public void setIdUnidad(Long idUnidad) {
        this.idUnidad = idUnidad;
    }
}
