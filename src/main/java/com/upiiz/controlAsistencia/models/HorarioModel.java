package com.upiiz.controlAsistencia.models;

public class HorarioModel {
    private Long id;
    private String dia;
    private String hora;
    private String materia;

    public HorarioModel() {}

    public HorarioModel(String dia, String hora, String materia) {
        this.dia = dia;
        this.hora = hora;
        this.materia = materia;
    }

    // Getters y setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDia() { return dia; }
    public void setDia(String dia) { this.dia = dia; }

    public String getHora() { return hora; }
    public void setHora(String hora) { this.hora = hora; }

    public String getMateria() { return materia; }
    public void setMateria(String materia) { this.materia = materia; }
}
