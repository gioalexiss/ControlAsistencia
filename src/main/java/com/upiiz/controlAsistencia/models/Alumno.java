package com.upiiz.controlAsistencia.models;

public class Alumno {
    private String nombre;
    private String carrera;
    private String grado;
    private String materia;
    private String correo;
    private String grupo;
    private String boleta;

    // Constructores
    public Alumno() {}

    // Getters y Setters
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getCarrera() { return carrera; }
    public void setCarrera(String carrera) { this.carrera = carrera; }

    public String getGrado() { return grado; }
    public void setGrado(String grado) { this.grado = grado; }

    public String getMateria() { return materia; }
    public void setMateria(String materia) { this.materia = materia; }

    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }

    public String getGrupo() { return grupo; }
    public void setGrupo(String grupo) { this.grupo = grupo; }

    public String getBoleta() { return boleta; }
    public void setBoleta(String boleta) { this.boleta = boleta; }

    @Override
    public String toString() {
        return "Alumno{" +
                "nombre='" + nombre + '\'' +
                ", carrera='" + carrera + '\'' +
                ", grado='" + grado + '\'' +
                ", materia='" + materia + '\'' +
                ", correo='" + correo + '\'' +
                ", grupo='" + grupo + '\'' +
                ", boleta='" + boleta + '\'' +
                '}';
    }
}