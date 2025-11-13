package com.upiiz.controlAsistencia.models;

import java.util.List;

public class GrupoModel {
    private Long id;
    private Long idUnidad;
    private String nombreGrupo;
    private Integer semestre;
    private String tipo;

    public GrupoModel() {}
    private List<HorarioModel> horarios;

    public GrupoModel(Long id, Long idUnidad, String nombreGrupo, Integer semestre, String tipo) {
        this.id = id;
        this.idUnidad = idUnidad;
        this.nombreGrupo = nombreGrupo;
        this.semestre = semestre;
        this.tipo = tipo;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIdUnidad() { return idUnidad; }
    public void setIdUnidad(Long idUnidad) { this.idUnidad = idUnidad; }

    public String getNombreGrupo() { return nombreGrupo; }
    public void setNombreGrupo(String nombreGrupo) { this.nombreGrupo = nombreGrupo; }

    public Integer getSemestre() { return semestre; }
    public void setSemestre(Integer semestre) { this.semestre = semestre; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public List<HorarioModel> getHorarios() { return horarios; }
    public void setHorarios(List<HorarioModel> horarios) { this.horarios = horarios; }
}