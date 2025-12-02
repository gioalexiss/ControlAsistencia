package com.upiiz.controlAsistencia.services;

import com.upiiz.controlAsistencia.models.EstudianteEntity;
import com.upiiz.controlAsistencia.models.GrupoEstudianteEntity;
import com.upiiz.controlAsistencia.models.GrupoEntity;
import com.upiiz.controlAsistencia.models.UnidadEntity;
import com.upiiz.controlAsistencia.repositories.EstudianteRepository;
import com.upiiz.controlAsistencia.repositories.GrupoEstudianteRepository;
import com.upiiz.controlAsistencia.repositories.GrupoRepository;
import com.upiiz.controlAsistencia.repositories.UnidadRepository;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.mail.internet.MimeMessage;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EstudianteService {

    private final EstudianteRepository estudianteRepository;
    private final GrupoEstudianteRepository grupoEstudianteRepository;
    private final GrupoRepository grupoRepository;
    private final UnidadRepository unidadRepository;
    private final QRCodeService qrCodeService;
    private final JavaMailSender mailSender;

    public EstudianteService(EstudianteRepository estudianteRepository,
                           GrupoEstudianteRepository grupoEstudianteRepository,
                           GrupoRepository grupoRepository,
                           UnidadRepository unidadRepository,
                           QRCodeService qrCodeService,
                           JavaMailSender mailSender) {
        this.estudianteRepository = estudianteRepository;
        this.grupoEstudianteRepository = grupoEstudianteRepository;
        this.grupoRepository = grupoRepository;
        this.unidadRepository = unidadRepository;
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
        // Guardar nombre completo directamente (igual que en crearDesdeDTO)
        String nombreCompleto = dto.getNombre();
        if (nombreCompleto != null && !nombreCompleto.trim().isEmpty()) {
            estudiante.setNombre(nombreCompleto.trim()); // Nombre completo
            estudiante.setApellido(""); // Ya no se usa, mantener vacío
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
     * Obtener estudiantes de un docente con información de sus grupos
     */
    public List<Map<String, Object>> obtenerEstudiantesConGruposPorDocente(Long docenteId) {
        // Obtener todas las vinculaciones del docente
        List<GrupoEstudianteEntity> vinculaciones = grupoEstudianteRepository.findAllByDocenteId(docenteId);

        // Agrupar vinculaciones por estudiante
        Map<Long, List<GrupoEstudianteEntity>> vinculacionesPorEstudiante = vinculaciones.stream()
            .collect(Collectors.groupingBy(GrupoEstudianteEntity::getIdEstudiante));

        // Obtener todos los estudiantes únicos
        List<Long> idsEstudiantes = new ArrayList<>(vinculacionesPorEstudiante.keySet());
        List<EstudianteEntity> estudiantes = estudianteRepository.findAllById(idsEstudiantes);

        // Construir respuesta con información de grupos
        List<Map<String, Object>> resultado = new ArrayList<>();

        for (EstudianteEntity estudiante : estudiantes) {
            Map<String, Object> estudianteConGrupos = new HashMap<>();

            // Información del estudiante
            estudianteConGrupos.put("id", estudiante.getId());
            estudianteConGrupos.put("boleta", estudiante.getBoleta());
            estudianteConGrupos.put("nombre", estudiante.getNombre());
            estudianteConGrupos.put("correo", estudiante.getCorreo());
            estudianteConGrupos.put("estado", estudiante.getEstado().toString());
            estudianteConGrupos.put("qrCode", estudiante.getQrCode());

            // Obtener información de grupos
            List<Map<String, Object>> grupos = new ArrayList<>();
            List<GrupoEstudianteEntity> vinculacionesEstudiante = vinculacionesPorEstudiante.get(estudiante.getId());

            if (vinculacionesEstudiante != null) {
                for (GrupoEstudianteEntity vinculacion : vinculacionesEstudiante) {
                    Map<String, Object> grupoInfo = new HashMap<>();

                    // Obtener información del grupo
                    Optional<GrupoEntity> grupoOpt = grupoRepository.findById(vinculacion.getIdGrupo());
                    if (grupoOpt.isPresent()) {
                        GrupoEntity grupo = grupoOpt.get();
                        grupoInfo.put("idGrupo", grupo.getId());
                        grupoInfo.put("nombreGrupo", grupo.getNombreGrupo());

                        // Obtener información de la unidad/materia
                        Optional<UnidadEntity> unidadOpt = unidadRepository.findById(vinculacion.getIdUnidad());
                        if (unidadOpt.isPresent()) {
                            UnidadEntity unidad = unidadOpt.get();
                            grupoInfo.put("idUnidad", unidad.getId());
                            grupoInfo.put("nombreMateria", unidad.getNombreUnidad());
                        }

                        grupos.add(grupoInfo);
                    }
                }
            }

            estudianteConGrupos.put("grupos", grupos);
            resultado.add(estudianteConGrupos);
        }

        return resultado;
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
                            "<body style='font-family: Arial, sans-serif; padding: 25px; margin: 0; background-color: #F5F5F5;'>" +

                            "<div style='max-width: 650px; margin: 0 auto; background-color: #FFFFFF; padding: 35px; " +
                            "border-radius: 12px; box-shadow: 0 4px 25px rgba(0,0,0,0.15); border: 1px solid #D9D9D9;'>" +

// LOGO
                            "<div style='text-align: center; margin-bottom: 25px;'>" +
                            "<img src='https://sociedadtecnologiaydeontologia.wordpress.com/wp-content/uploads/2019/01/logotipo_ipn.png?w=640' " +
                            "alt='IPN' width='140' style='display:block; margin:auto;'>" +
                            "</div>" +

// TÍTULO
                            "<h2 style='color: #8B0A50; margin-bottom: 10px; text-align: center; font-size: 26px; font-weight: 700;'>Instituto Politécnico Nacional</h2>" +
                            "<p style='text-align:center; color:#555; margin-bottom:30px; font-size:15px;'>Unidad Profesional Interdisciplinaria de Ingeniería Campus Zacatecas</p>" +

// SALUDO
                            "<h3 style='color: #8B0A50; margin-bottom: 10px; text-align: center;'>Hola %s,</h3>" +
                            "<p style='font-size: 16px; color: #333; text-align: center;'>Este es tu código QR personal para el control de asistencia.</p>" +

// QR
                            "<div style='text-align: center; padding: 20px; background-color: #F4E8EC; border-radius: 10px; border-left: 6px solid #8B0A50; margin: 25px 0;'>" +
                            "<img src='cid:qrImage' alt='Código QR' width='260' height='260' " +
                            "style='display:block; margin:auto; border: 3px solid #8B0A50; border-radius: 10px;'>" +
                            "</div>" +

// DATOS
                            "<div style='background-color: #FAFAFA; padding: 18px; border-radius: 10px; border: 1px solid #E0E0E0;'>" +
                            "<p style='margin: 10px 0; font-size: 15px;'><strong style='color: #8B0A50;'>Código:</strong> " +
                            "<code style='background-color: #EDEDED; padding: 6px 12px; border-radius: 5px; font-size: 15px;'>%s</code></p>" +

                            "<p style='margin: 10px 0; font-size: 15px;'><strong style='color: #8B0A50;'>Boleta:</strong> %s</p>" +
                            "</div>" +

// NOTA
                            "<p style='margin-top: 25px; color: #444; text-align: center; font-size: 14px;'>Guarda este código QR, lo necesitarás para registrar tu asistencia.</p>" +

                            "<hr style='border: none; border-top: 1px solid #D6C4C9; margin: 30px 0;'>" +

// FOOTER
                            "<p style='color: #8B0A50; font-size: 13px; text-align: center; font-weight: bold;'>Sistema de Control de Asistencia - IPN</p>" +
                            "<p style='color: #999; font-size: 12px; text-align: center;'>Este mensaje fue generado automáticamente, por favor no responder.</p>" +

                            "</div>" +
                            "</body>" +
                            "</html>"
                    ,

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

    /**
     * Crear un estudiante individual
     */
    @Transactional
    public EstudianteEntity crearEstudiante(EstudianteDTO dto) {
        // Validar que no exista la boleta
        if (estudianteRepository.findByBoleta(dto.getBoleta()).isPresent()) {
            throw new RuntimeException("Ya existe un estudiante con la boleta: " + dto.getBoleta());
        }

        // Crear nuevo estudiante
        EstudianteEntity estudiante = crearDesdeDTO(dto);

        // Guardar en la base de datos
        return estudianteRepository.save(estudiante);
    }

    /**
     * Crear un estudiante individual y opcionalmente vincularlo a un grupo
     */
    @Transactional
    public EstudianteEntity crearEstudianteYVincular(EstudianteDTO dto, Long idGrupo, Long idUnidad) {
        // Validar que no exista la boleta
        if (estudianteRepository.findByBoleta(dto.getBoleta()).isPresent()) {
            throw new RuntimeException("Ya existe un estudiante con la boleta: " + dto.getBoleta());
        }

        // Crear nuevo estudiante
        EstudianteEntity estudiante = crearDesdeDTO(dto);

        // Guardar en la base de datos
        estudiante = estudianteRepository.save(estudiante);

        // Si se proporcionó idGrupo e idUnidad, vincular al estudiante
        if (idGrupo != null && idUnidad != null) {
            // Verificar que no esté ya vinculado
            if (!grupoEstudianteRepository.existsByIdGrupoAndIdEstudiante(idGrupo, estudiante.getId())) {
                GrupoEstudianteEntity vinculacion = new GrupoEstudianteEntity(idGrupo, estudiante.getId(), idUnidad);
                grupoEstudianteRepository.save(vinculacion);
            }
        }

        return estudiante;
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
