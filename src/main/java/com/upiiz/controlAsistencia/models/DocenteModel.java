package com.upiiz.controlAsistencia.models;

public class DocenteModel {
    private Long id;
    private String nombre;
    private String correo;
    private String password;
    private boolean verificado;

    public DocenteModel() {}

    public DocenteModel(Long id, String nombre, String correo, String password, boolean verificado) {
        this.id = id;
        this.nombre = nombre;
        this.correo = correo;
        this.password = password;
        this.verificado = verificado;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public boolean isVerificado() { return verificado; }
    public void setVerificado(boolean verificado) { this.verificado = verificado; }
}