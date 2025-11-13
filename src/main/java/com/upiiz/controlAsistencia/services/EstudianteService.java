package com.upiiz.controlAsistencia.services;

import com.upiiz.controlAsistencia.models.EstudianteEntity;
import com.upiiz.controlAsistencia.repositories.EstudianteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class EstudianteService {

    private final EstudianteRepository estudianteRepository;

    public EstudianteService(EstudianteRepository estudianteRepository) {
        this.estudianteRepository = estudianteRepository;
    }

    /**
     * Guarda una lista de estudiantes desde el PDF
     * Retorna un reporte con éxitos y errores
     */
    @Transactional
    public ResultadoCargaMasiva guardarEstudiantesDesdePDF(List<EstudianteDTO> estudiantes) {
        ResultadoCargaMasiva resultado = new ResultadoCargaMasiva();

        for (EstudianteDTO dto : estudiantes) {
            try {
                // Validar que tenga boleta
                if (dto.getBoleta() == null || dto.getBoleta().trim().isEmpty()) {
                    resultado.agregarError("Estudiante sin boleta: " + dto.getNombre());
                    continue;
                }

                // Verificar si ya existe
                Optional<EstudianteEntity> existente = estudianteRepository.findByBoleta(dto.getBoleta());

                if (existente.isPresent()) {
                    // Actualizar datos si ya existe
                    EstudianteEntity estudiante = existente.get();
                    actualizarDatos(estudiante, dto);
                    estudianteRepository.save(estudiante);
                    resultado.agregarActualizado(dto.getBoleta());
                } else {
                    // Crear nuevo estudiante
                    EstudianteEntity nuevoEstudiante = crearDesdeDTO(dto);
                    estudianteRepository.save(nuevoEstudiante);
                    resultado.agregarNuevo(dto.getBoleta());
                }

            } catch (Exception e) {
                resultado.agregarError("Error con boleta " + dto.getBoleta() + ": " + e.getMessage());
            }
        }

        return resultado;
    }

    /**
     * Convierte DTO a Entity
     */
    private EstudianteEntity crearDesdeDTO(EstudianteDTO dto) {
        EstudianteEntity estudiante = new EstudianteEntity();
        estudiante.setBoleta(dto.getBoleta());

        // Separar nombre completo en nombre y apellido
        String nombreCompleto = dto.getNombre();
        String[] partes = nombreCompleto.split("\\s+", 2);

        if (partes.length >= 2) {
            estudiante.setNombre(partes[0]);
            estudiante.setApellido(partes[1]);
        } else {
            estudiante.setNombre(nombreCompleto);
            estudiante.setApellido("");
        }

        estudiante.setCorreo(dto.getCorreo());
        estudiante.setEstado(EstudianteEntity.Estado.activo);

        return estudiante;
    }

    /**
     * Actualiza los datos de un estudiante existente
     */
    private void actualizarDatos(EstudianteEntity estudiante, EstudianteDTO dto) {
        // Separar nombre completo
        String nombreCompleto = dto.getNombre();
        String[] partes = nombreCompleto.split("\\s+", 2);

        if (partes.length >= 2) {
            estudiante.setNombre(partes[0]);
            estudiante.setApellido(partes[1]);
        }

        if (dto.getCorreo() != null && !dto.getCorreo().isEmpty()) {
            estudiante.setCorreo(dto.getCorreo());
        }
    }

    /**
     * Buscar estudiante por boleta
     */
    public Optional<EstudianteEntity> buscarPorBoleta(String boleta) {
        return estudianteRepository.findByBoleta(boleta);
    }

    /**
     * Obtener todos los estudiantes
     */
    public List<EstudianteEntity> obtenerTodos() {
        return estudianteRepository.findAll();
    }

    // ========================================
    // CLASES INTERNAS
    // ========================================

    /**
     * DTO para recibir datos del PDF
     */
    public static class EstudianteDTO {
        private String boleta;
        private String nombre;
        private String correo;

        public EstudianteDTO() {}

        public EstudianteDTO(String boleta, String nombre, String correo) {
            this.boleta = boleta;
            this.nombre = nombre;
            this.correo = correo;
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

        public String getCorreo() {
            return correo;
        }

        public void setCorreo(String correo) {
            this.correo = correo;
        }
    }

    /**
     * Resultado de la carga masiva
     */
    public static class ResultadoCargaMasiva {
        private List<String> nuevos = new ArrayList<>();
        private List<String> actualizados = new ArrayList<>();
        private List<String> errores = new ArrayList<>();

        public void agregarNuevo(String boleta) {
            nuevos.add(boleta);
        }

        public void agregarActualizado(String boleta) {
            actualizados.add(boleta);
        }

        public void agregarError(String error) {
            errores.add(error);
        }

        public int getTotalNuevos() {
            return nuevos.size();
        }

        public int getTotalActualizados() {
            return actualizados.size();
        }

        public int getTotalErrores() {
            return errores.size();
        }

        public int getTotalProcesados() {
            return nuevos.size() + actualizados.size();
        }

        public List<String> getNuevos() {
            return nuevos;
        }

        public List<String> getActualizados() {
            return actualizados;
        }

        public List<String> getErrores() {
            return errores;
        }

        public String getMensajeResumen() {
            return String.format(
                "Procesados: %d | Nuevos: %d | Actualizados: %d | Errores: %d",
                getTotalProcesados(),
                getTotalNuevos(),
                getTotalActualizados(),
                getTotalErrores()
            );
        }
    }
}
