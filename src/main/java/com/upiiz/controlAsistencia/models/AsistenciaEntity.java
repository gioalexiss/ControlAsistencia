package com.upiiz.controlAsistencia.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "asistencias")
public class AsistenciaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "estudiante_id", nullable = false)
    private Long estudianteId;

    @Column(name = "grupo_id")
    private Long grupoId;

    @Column(name = "unidad_id")
    private Long unidadId;

    @Column(name = "docente_id", nullable = false)
    private Long docenteId;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    @Column(name = "tipo_asistencia", length = 20)
    private String tipoAsistencia; // PRESENTE, RETARDO, FALTA

    @Column(name = "observaciones", length = 500)
    private String observaciones;

    // Campos adicionales para mostrar información completa
    @Transient
    private String nombreEstudiante;

    @Transient
    private String boletaEstudiante;

    @Transient
    private String nombreGrupo;

    @Transient
    private String nombreUnidad;

    // Constructors
    public AsistenciaEntity() {
    }

    public AsistenciaEntity(Long estudianteId, Long grupoId, Long unidadId, Long docenteId, LocalDateTime fechaHora, String tipoAsistencia) {
        this.estudianteId = estudianteId;
        this.grupoId = grupoId;
        this.unidadId = unidadId;
        this.docenteId = docenteId;
        this.fechaHora = fechaHora;
        this.tipoAsistencia = tipoAsistencia;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getEstudianteId() {
        return estudianteId;
    }

    public void setEstudianteId(Long estudianteId) {
        this.estudianteId = estudianteId;
    }

    public Long getGrupoId() {
        return grupoId;
    }

    public void setGrupoId(Long grupoId) {
        this.grupoId = grupoId;
    }

    public Long getUnidadId() {
        return unidadId;
    }

    public void setUnidadId(Long unidadId) {
        this.unidadId = unidadId;
    }

    public Long getDocenteId() {
        return docenteId;
    }

    public void setDocenteId(Long docenteId) {
        this.docenteId = docenteId;
    }

    public LocalDateTime getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }

    public String getTipoAsistencia() {
        return tipoAsistencia;
    }

    public void setTipoAsistencia(String tipoAsistencia) {
        this.tipoAsistencia = tipoAsistencia;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public String getNombreEstudiante() {
        return nombreEstudiante;
    }

    public void setNombreEstudiante(String nombreEstudiante) {
        this.nombreEstudiante = nombreEstudiante;
    }

    public String getBoletaEstudiante() {
        return boletaEstudiante;
    }

    public void setBoletaEstudiante(String boletaEstudiante) {
        this.boletaEstudiante = boletaEstudiante;
    }

    public String getNombreGrupo() {
        return nombreGrupo;
    }

    public void setNombreGrupo(String nombreGrupo) {
        this.nombreGrupo = nombreGrupo;
    }

    public String getNombreUnidad() {
        return nombreUnidad;
    }

    public void setNombreUnidad(String nombreUnidad) {
        this.nombreUnidad = nombreUnidad;
    }
}
