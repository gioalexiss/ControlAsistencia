package com.upiiz.controlAsistencia.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "estudiantes")
public class EstudianteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "boleta", unique = true, nullable = false, length = 50)
    private String boleta;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "apellido", nullable = false, length = 100)
    private String apellido;

    @Column(name = "correo", length = 150)
    private String correo;

    @Column(name = "qr_code", unique = true, length = 255)
    private String qrCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private Estado estado = Estado.activo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum Estado {
        activo, inactivo
    }

    // Constructor vacío
    public EstudianteEntity() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructor con parámetros
    public EstudianteEntity(String boleta, String nombre, String apellido, String correo) {
        this.boleta = boleta;
        this.nombre = nombre;
        this.apellido = apellido;
        this.correo = correo;
        this.estado = Estado.activo;
        this.createdAt = LocalDateTime.now();
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBoleta() {
        return boleta;
    }

    public void setBoleta(String boleta) {
        this.boleta = boleta;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getApellido() {
        return apellido;
    }

    public void setApellido(String apellido) {
        this.apellido = apellido;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getQrCode() {
        return qrCode;
    }

    public void setQrCode(String qrCode) {
        this.qrCode = qrCode;
    }

    public Estado getEstado() {
        return estado;
    }

    public void setEstado(Estado estado) {
        this.estado = estado;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "EstudianteEntity{" +
                "id=" + id +
                ", boleta='" + boleta + '\'' +
                ", nombre='" + nombre + '\'' +
                ", apellido='" + apellido + '\'' +
                ", correo='" + correo + '\'' +
                ", estado=" + estado +
                ", createdAt=" + createdAt +
                '}';
    }
}
