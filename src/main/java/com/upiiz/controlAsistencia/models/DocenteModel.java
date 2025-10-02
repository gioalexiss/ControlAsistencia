package com.upiiz.controlAsistencia.models;

public class DocenteModel {
    private Long id;
    private String correo;
    private String contrasena;

    public DocenteModel() {}

    public DocenteModel(String correo, String contrasena) {
        this.correo = correo;
        this.contrasena = contrasena;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getContrasena() {
        return contrasena;
    }

    public void setContrasena(String contrasena) {
        this.contrasena = contrasena;
    }
}
