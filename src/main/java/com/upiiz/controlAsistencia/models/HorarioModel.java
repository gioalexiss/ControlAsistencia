package com.upiiz.controlAsistencia.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalTime;

public class HorarioModel {
    private Long id;
    private Long idGrupo;

    @JsonProperty("diaSemana")
    private String diaSemana;

    @JsonProperty("horaInicio")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime horaInicio;

    @JsonProperty("horaFin")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime horaFin;

    @JsonProperty("tipoHorario")
    private String tipoHorario;

    private String aula;

    public HorarioModel() {}

    // Alias para compatibilidad con frontend
    @JsonProperty("dia")
    public String getDia() {
        return diaSemana;
    }

    public void setDia(String dia) {
        this.diaSemana = dia;
    }

    @JsonProperty("inicio")
    public String getInicio() {
        return horaInicio != null ? horaInicio.toString() : null;
    }

    public void setInicio(String inicio) {
        this.horaInicio = inicio != null ? LocalTime.parse(inicio) : null;
    }

    @JsonProperty("fin")
    public String getFin() {
        return horaFin != null ? horaFin.toString() : null;
    }

    public void setFin(String fin) {
        this.horaFin = fin != null ? LocalTime.parse(fin) : null;
    }

    @JsonProperty("tipo")
    public String getTipo() {
        return tipoHorario;
    }

    public void setTipo(String tipo) {
        this.tipoHorario = tipo;
    }

    public HorarioModel(Long id, Long idGrupo, String diaSemana, LocalTime horaInicio,
                        LocalTime horaFin, String tipoHorario, String aula) {
        this.id = id;
        this.idGrupo = idGrupo;
        this.diaSemana = diaSemana;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
        this.tipoHorario = tipoHorario;
        this.aula = aula;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIdGrupo() { return idGrupo; }
    public void setIdGrupo(Long idGrupo) { this.idGrupo = idGrupo; }

    public String getDiaSemana() { return diaSemana; }
    public void setDiaSemana(String diaSemana) { this.diaSemana = diaSemana; }

    public LocalTime getHoraInicio() { return horaInicio; }
    public void setHoraInicio(LocalTime horaInicio) { this.horaInicio = horaInicio; }

    public LocalTime getHoraFin() { return horaFin; }
    public void setHoraFin(LocalTime horaFin) { this.horaFin = horaFin; }

    public String getTipoHorario() { return tipoHorario; }
    public void setTipoHorario(String tipoHorario) { this.tipoHorario = tipoHorario; }

    public String getAula() { return aula; }
    public void setAula(String aula) { this.aula = aula; }
}