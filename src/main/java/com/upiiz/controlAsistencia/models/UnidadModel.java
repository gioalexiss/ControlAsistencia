package com.upiiz.controlAsistencia.models;

import java.util.List;

public class UnidadModel {
    private Long id;
    private Long idDocente;
    private String nombreUnidad;

    public UnidadModel() {}

    private List<GrupoModel> grupos;

    public UnidadModel(Long id, Long idDocente, String nombreUnidad) {
        this.id = id;
        this.idDocente = idDocente;
        this.nombreUnidad = nombreUnidad;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIdDocente() { return idDocente; }
    public void setIdDocente(Long idDocente) { this.idDocente = idDocente; }

    public String getNombreUnidad() { return nombreUnidad; }
    public void setNombreUnidad(String nombreUnidad) { this.nombreUnidad = nombreUnidad; }

    public List<GrupoModel> getGrupos() { return grupos; }
    public void setGrupos(List<GrupoModel> grupos) { this.grupos = grupos; }
}

