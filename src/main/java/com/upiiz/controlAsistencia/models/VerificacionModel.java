package com.upiiz.controlAsistencia.models;

import java.time.LocalDateTime;

public class VerificacionModel {
    private Long id;
    private String correo;
    private String codigo;
    private LocalDateTime expiracion;

    public VerificacionModel() {}

    public VerificacionModel(Long id, String correo, String codigo, LocalDateTime expiracion) {
        this.id = id;
        this.correo = correo;
        this.codigo = codigo;
        this.expiracion = expiracion;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }

    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }

    public LocalDateTime getExpiracion() { return expiracion; }
    public void setExpiracion(LocalDateTime expiracion) { this.expiracion = expiracion; }
}