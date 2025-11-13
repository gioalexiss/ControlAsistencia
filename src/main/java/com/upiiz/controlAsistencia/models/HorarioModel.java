package com.upiiz.controlAsistencia.models;

import java.time.LocalTime;

public class HorarioModel {
    private Long id;
    private Long idGrupo;
    private String diaSemana;
    private LocalTime horaInicio;
    private LocalTime horaFin;
    private String tipoHorario;
    private String aula;

    public HorarioModel() {}

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