package com.upiiz.controlAsistencia.services;

import com.upiiz.controlAsistencia.models.EstudianteEntity;
import com.upiiz.controlAsistencia.models.GrupoEstudianteEntity;
import com.upiiz.controlAsistencia.repositories.EstudianteRepository;
import com.upiiz.controlAsistencia.repositories.GrupoEstudianteRepository;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.mail.internet.MimeMessage;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EstudianteService {

    private final EstudianteRepository estudianteRepository;
    private final GrupoEstudianteRepository grupoEstudianteRepository;
    private final QRCodeService qrCodeService;
    private final JavaMailSender mailSender;

    public EstudianteService(EstudianteRepository estudianteRepository,
                           GrupoEstudianteRepository grupoEstudianteRepository,
                           QRCodeService qrCodeService,
                           JavaMailSender mailSender) {
        this.estudianteRepository = estudianteRepository;
        this.grupoEstudianteRepository = grupoEstudianteRepository;
        this.qrCodeService = qrCodeService;
        this.mailSender = mailSender;
    }

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

        // Guardar nombre completo directamente
        String nombreCompleto = dto.getNombre();
        estudiante.setNombre(nombreCompleto); // Nombre completo
        estudiante.setApellido(""); // Ya no se usa

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

    /**
     * Guardar estudiantes desde Excel y vincularlos a un grupo y unidad específicos
     */
    @Transactional
    public ResultadoCargaMasiva guardarEstudiantesDesdeExcelYVincular(List<EstudianteDTO> estudiantes, Long idGrupo, Long idUnidad) {
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

                EstudianteEntity estudiante;
                if (existente.isPresent()) {
                    // Actualizar datos si ya existe
                    estudiante = existente.get();
                    actualizarDatos(estudiante, dto);
                    estudianteRepository.save(estudiante);
                    resultado.agregarActualizado(dto.getBoleta());
                } else {
                    // Crear nuevo estudiante
                    estudiante = crearDesdeDTO(dto);
                    estudiante = estudianteRepository.save(estudiante);
                    resultado.agregarNuevo(dto.getBoleta());
                }

                // Vincular al grupo y unidad si no está ya vinculado
                if (!grupoEstudianteRepository.existsByIdGrupoAndIdEstudiante(idGrupo, estudiante.getId())) {
                    GrupoEstudianteEntity vinculacion = new GrupoEstudianteEntity(idGrupo, estudiante.getId(), idUnidad);
                    grupoEstudianteRepository.save(vinculacion);
                }

            } catch (Exception e) {
                resultado.agregarError("Error con boleta " + dto.getBoleta() + ": " + e.getMessage());
            }
        }

        return resultado;
    }

    /**
     * Obtener estudiantes de un grupo específico
     */
    public List<EstudianteEntity> obtenerEstudiantesPorGrupo(Long idGrupo) {
        List<GrupoEstudianteEntity> vinculaciones = grupoEstudianteRepository.findByIdGrupo(idGrupo);
        List<Long> idsEstudiantes = vinculaciones.stream()
            .map(GrupoEstudianteEntity::getIdEstudiante)
            .collect(Collectors.toList());

        return estudianteRepository.findAllById(idsEstudiantes);
    }

    /**
     * Verificar si un estudiante pertenece a un grupo y unidad específicos
     */
    public boolean verificarEstudianteEnGrupoYUnidad(Long idEstudiante, Long idGrupo, Long idUnidad) {
        return grupoEstudianteRepository.existsByIdEstudianteAndIdGrupoAndIdUnidad(idEstudiante, idGrupo, idUnidad);
    }

    /**
     * Obtener todos los estudiantes de todos los grupos de un docente
     */
    public List<EstudianteEntity> obtenerEstudiantesPorDocente(Long docenteId) {
        List<GrupoEstudianteEntity> vinculaciones = grupoEstudianteRepository.findAllByDocenteId(docenteId);
        List<Long> idsEstudiantes = vinculaciones.stream()
            .map(GrupoEstudianteEntity::getIdEstudiante)
            .distinct() // Evitar duplicados si un estudiante está en varios grupos
            .collect(Collectors.toList());

        return estudianteRepository.findAllById(idsEstudiantes);
    }

    /**
     * Desvincular un estudiante de un grupo
     */
    @Transactional
    public void desvincularEstudianteDeGrupo(Long idGrupo, Long idEstudiante) {
        grupoEstudianteRepository.deleteByIdGrupoAndIdEstudiante(idGrupo, idEstudiante);
    }

    /**
     * Generar QR codes masivamente para todos los estudiantes de un docente
     */
    @Transactional
    public java.util.Map<String, Object> generarQRMasivoParaDocente(Long docenteId, boolean enviarCorreo) {
        java.util.Map<String, Object> resultado = new java.util.HashMap<>();

        // Obtener todos los estudiantes del docente
        List<EstudianteEntity> estudiantes = obtenerEstudiantesPorDocente(docenteId);

        if (estudiantes.isEmpty()) {
            resultado.put("success", false);
            resultado.put("mensaje", "No hay estudiantes registrados para este docente");
            return resultado;
        }

        int generados = 0;
        int yaExistian = 0;
        int correosEnviados = 0;
        List<String> errores = new ArrayList<>();

        for (EstudianteEntity estudiante : estudiantes) {
            try {
                if (estudiante.getQrCode() == null || estudiante.getQrCode().isEmpty()) {
                    // Generar QR code único basado en la boleta
                    String qrCode = generarCodigoQR(estudiante.getBoleta());
                    estudiante.setQrCode(qrCode);
                    estudianteRepository.save(estudiante);
                    generados++;
                } else {
                    yaExistian++;
                }

                // Enviar correo si se solicita y el estudiante tiene correo
                if (enviarCorreo && estudiante.getCorreo() != null && !estudiante.getCorreo().isEmpty()) {
                    try {
                        enviarQRPorCorreo(estudiante);
                        correosEnviados++;
                    } catch (Exception e) {
                        errores.add("Error al enviar correo a " + estudiante.getBoleta() + ": " + e.getMessage());
                    }
                }
            } catch (Exception e) {
                errores.add("Error al generar QR para " + estudiante.getBoleta() + ": " + e.getMessage());
            }
        }

        resultado.put("success", true);
        resultado.put("totalEstudiantes", estudiantes.size());
        resultado.put("qrGenerados", generados);
        resultado.put("yaExistian", yaExistian);
        resultado.put("correosEnviados", correosEnviados);
        resultado.put("errores", errores);

        String mensaje = String.format("Proceso completado: %d QR generados, %d ya existían", generados, yaExistian);
        if (enviarCorreo) {
            mensaje += String.format(", %d correos enviados", correosEnviados);
        }
        resultado.put("mensaje", mensaje);

        return resultado;
    }

    /**
     * Generar código QR único para un estudiante
     */
    private String generarCodigoQR(String boleta) {
        // Generar un código único basado en la boleta y un timestamp
        long timestamp = System.currentTimeMillis();
        return "QR-" + boleta + "-" + timestamp;
    }

    /**
     * Enviar código QR por correo electrónico
     */
    private void enviarQRPorCorreo(EstudianteEntity estudiante) throws Exception {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, "UTF-8");

            helper.setFrom("esantana.garcia13@gmail.com", "Sistema de Asistencia IPN");
            helper.setTo(estudiante.getCorreo());
            helper.setSubject("Tu código QR de asistencia - IPN");

            // Generar imagen QR
            byte[] qrImage = qrCodeService.generarImagenQR(estudiante.getQrCode());

            String htmlContent = String.format(
                "<!DOCTYPE html>" +
                "<html>" +
                "<head><meta charset='UTF-8'></head>" +
                "<body style='font-family: Arial, sans-serif; text-align: center; padding: 20px; margin: 0;'>" +
                "<div style='max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 30px; border-radius: 10px;'>" +
                "<h2 style='color: #1E90FF; margin-bottom: 20px;'>Hola %s,</h2>" +
                "<p style='font-size: 16px; color: #333; margin-bottom: 20px;'>Este es tu código QR personal para el registro de asistencia.</p>" +
                "<div style='margin: 20px 0; background-color: white; padding: 20px; border-radius: 8px;'>" +
                "<img src='cid:qrImage' alt='Código QR' width='300' height='300' style='display: block; margin: 0 auto; border: 2px solid #1E90FF; border-radius: 8px;'/>" +
                "</div>" +
                "<div style='background-color: white; padding: 15px; border-radius: 8px; margin-top: 20px;'>" +
                "<p style='margin: 5px 0;'><strong>Código:</strong> <code style='background-color: #f0f0f0; padding: 5px 10px; border-radius: 4px;'>%s</code></p>" +
                "<p style='margin: 5px 0;'><strong>Boleta:</strong> %s</p>" +
                "</div>" +
                "<p style='margin-top: 20px; color: #666;'>Guarda este código QR, lo necesitarás para registrar tu asistencia.</p>" +
                "<hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'>" +
                "<p style='color: #999; font-size: 12px;'>Sistema de Control de Asistencia - IPN</p>" +
                "</div>" +
                "</body>" +
                "</html>",
                estudiante.getNombre(),
                estudiante.getQrCode(),
                estudiante.getBoleta()
            );

            helper.setText(htmlContent, true);

            // Adjuntar la imagen QR como recurso inline usando Content-ID
            org.springframework.core.io.ByteArrayResource qrResource = new org.springframework.core.io.ByteArrayResource(qrImage) {
                @Override
                public String getFilename() {
                    return "qr-code.png";
                }
            };

            helper.addInline("qrImage", qrResource, "image/png");

            mailSender.send(message);
        } catch (Exception e) {
            throw new Exception("Error al enviar correo: " + e.getMessage());
        }
    }

    /**
     * Buscar estudiante por ID
     */
    public Optional<EstudianteEntity> buscarPorId(Long id) {
        return estudianteRepository.findById(id);
    }

    /**
     * Buscar estudiante por código QR
     */
    public Optional<EstudianteEntity> buscarPorCodigoQR(String codigoQR) {
        return estudianteRepository.findByQrCode(codigoQR);
    }

    /**
     * Eliminar estudiante
     */
    @Transactional
    public boolean eliminarEstudiante(Long id) {
        try {
            if (estudianteRepository.existsById(id)) {
                // Primero desvincular de todos los grupos
                List<GrupoEstudianteEntity> vinculaciones = grupoEstudianteRepository.findByIdEstudiante(id);
                grupoEstudianteRepository.deleteAll(vinculaciones);

                // Luego eliminar el estudiante
                estudianteRepository.deleteById(id);
                return true;
            }
            return false;
        } catch (Exception e) {
            throw new RuntimeException("Error al eliminar estudiante: " + e.getMessage());
        }
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
