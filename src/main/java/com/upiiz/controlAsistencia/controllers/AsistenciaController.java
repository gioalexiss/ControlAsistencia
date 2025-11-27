package com.upiiz.controlAsistencia.controllers;

import com.upiiz.controlAsistencia.models.AsistenciaEntity;
import com.upiiz.controlAsistencia.models.EstudianteEntity;
import com.upiiz.controlAsistencia.services.AsistenciaService;
import com.upiiz.controlAsistencia.services.EstudianteService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Controller
@RequestMapping("/asistencia")
public class AsistenciaController {

    private final AsistenciaService asistenciaService;
    private final EstudianteService estudianteService;

    public AsistenciaController(AsistenciaService asistenciaService, EstudianteService estudianteService) {
        this.asistenciaService = asistenciaService;
        this.estudianteService = estudianteService;
    }

    /**
     * Registrar asistencia escaneando código QR
     */
    @PostMapping("/registrar")
    @ResponseBody
    public ResponseEntity<?> registrarAsistencia(@RequestBody Map<String, Object> payload) {
        try {
            String codigoQR = (String) payload.get("codigoQR");
            Long docenteId = Long.valueOf(payload.get("docenteId").toString());
            Long unidadId = payload.get("unidadId") != null ? Long.valueOf(payload.get("unidadId").toString()) : null;
            Long grupoId = payload.get("grupoId") != null ? Long.valueOf(payload.get("grupoId").toString()) : null;
            String tipoAsistencia = (String) payload.getOrDefault("tipoAsistencia", "PRESENTE");

            if (codigoQR == null || codigoQR.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "mensaje", "Código QR vacío"));
            }

            // Buscar estudiante por código QR
            Optional<EstudianteEntity> estudianteOpt = estudianteService.buscarPorCodigoQR(codigoQR.trim());

            if (estudianteOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "mensaje", "Código QR no encontrado",
                    "tipo", "error"
                ));
            }

            EstudianteEntity estudiante = estudianteOpt.get();

            // Verificar si el estudiante pertenece al grupo y unidad seleccionados
            if (grupoId != null && unidadId != null) {
                boolean perteneceAlGrupo = estudianteService.verificarEstudianteEnGrupoYUnidad(
                    estudiante.getId(), grupoId, unidadId
                );

                if (!perteneceAlGrupo) {
                    return ResponseEntity.ok(Map.of(
                        "success", false,
                        "mensaje", "El estudiante NO está asignado a este grupo y materia",
                        "tipo", "error",
                        "estudiante", Map.of(
                            "nombre", estudiante.getNombre(),
                            "boleta", estudiante.getBoleta()
                        )
                    ));
                }
            }

            // Verificar si ya registró asistencia hoy en esta unidad
            LocalDate hoy = LocalDate.now();
            if (unidadId != null) {
                Optional<AsistenciaEntity> asistenciaExistente =
                    asistenciaService.findByEstudianteIdAndFechaAndUnidadId(estudiante.getId(), hoy, unidadId);

                if (asistenciaExistente.isPresent()) {
                    return ResponseEntity.ok(Map.of(
                        "success", false,
                        "mensaje", "El estudiante ya registró asistencia hoy en esta materia",
                        "tipo", "warning",
                        "estudiante", Map.of(
                            "nombre", estudiante.getNombre(),
                            "boleta", estudiante.getBoleta(),
                            "horaRegistro", asistenciaExistente.get().getFechaHora()
                        )
                    ));
                }
            }

            // Registrar nueva asistencia
            AsistenciaEntity asistencia = new AsistenciaEntity();
            asistencia.setEstudianteId(estudiante.getId());
            asistencia.setGrupoId(grupoId);
            asistencia.setUnidadId(unidadId);
            asistencia.setDocenteId(docenteId);
            asistencia.setFechaHora(LocalDateTime.now());
            asistencia.setTipoAsistencia(tipoAsistencia);

            AsistenciaEntity nuevaAsistencia = asistenciaService.save(asistencia);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "mensaje", "Asistencia registrada correctamente",
                "tipo", "success",
                "asistencia", Map.of(
                    "id", nuevaAsistencia.getId(),
                    "fechaHora", nuevaAsistencia.getFechaHora()
                ),
                "estudiante", Map.of(
                    "id", estudiante.getId(),
                    "nombre", estudiante.getNombre(),
                    "boleta", estudiante.getBoleta(),
                    "correo", estudiante.getCorreo() != null ? estudiante.getCorreo() : ""
                )
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "mensaje", "Error al registrar asistencia: " + e.getMessage(),
                "tipo", "error"
            ));
        }
    }

    /**
     * Obtener asistencias del día actual del docente
     */
    @GetMapping("/hoy/{docenteId}")
    @ResponseBody
    public ResponseEntity<?> obtenerAsistenciasHoy(@PathVariable Long docenteId) {
        try {
            LocalDate hoy = LocalDate.now();
            List<AsistenciaEntity> asistencias = asistenciaService.findByDocenteIdAndFechaConDetalles(docenteId, hoy);
            return ResponseEntity.ok(asistencias);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener asistencias por fecha
     */
    @GetMapping("/fecha/{docenteId}/{fecha}")
    @ResponseBody
    public ResponseEntity<?> obtenerAsistenciasPorFecha(@PathVariable Long docenteId, @PathVariable String fecha) {
        try {
            LocalDate fechaConsulta = LocalDate.parse(fecha);
            List<AsistenciaEntity> asistencias = asistenciaService.findByDocenteIdAndFechaConDetalles(docenteId, fechaConsulta);
            return ResponseEntity.ok(asistencias);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener todas las asistencias del docente
     */
    @GetMapping("/todas/{docenteId}")
    @ResponseBody
    public ResponseEntity<?> obtenerTodasAsistencias(@PathVariable Long docenteId) {
        try {
            List<AsistenciaEntity> asistencias = asistenciaService.findByDocenteIdConDetalles(docenteId);
            return ResponseEntity.ok(asistencias);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Eliminar una asistencia
     */
    @DeleteMapping("/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminarAsistencia(@PathVariable Long id) {
        try {
            int rows = asistenciaService.delete(id);
            if (rows > 0) {
                return ResponseEntity.ok(Map.of("success", true, "mensaje", "Asistencia eliminada"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("success", false, "mensaje", "Asistencia no encontrada"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "mensaje", "Error: " + e.getMessage()));
        }
    }

    /**
     * Validar código QR (sin registrar, solo para verificar)
     */
    @PostMapping("/validar")
    @ResponseBody
    public ResponseEntity<?> validarCodigoQR(@RequestBody Map<String, String> payload) {
        try {
            String codigoQR = payload.get("codigoQR");

            if (codigoQR == null || codigoQR.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("valido", false, "mensaje", "Código vacío"));
            }

            Optional<EstudianteEntity> estudianteOpt = estudianteService.buscarPorCodigoQR(codigoQR.trim());

            if (estudianteOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of("valido", false, "mensaje", "Código QR no encontrado"));
            }

            EstudianteEntity estudiante = estudianteOpt.get();
            return ResponseEntity.ok(Map.of(
                "valido", true,
                "estudiante", Map.of(
                    "id", estudiante.getId(),
                    "nombre", estudiante.getNombre(),
                    "boleta", estudiante.getBoleta(),
                    "correo", estudiante.getCorreo() != null ? estudiante.getCorreo() : ""
                )
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("valido", false, "mensaje", "Error: " + e.getMessage()));
        }
    }

    /**
     * Registrar asistencia manual (sin QR)
     */
    @PostMapping("/registrar-manual")
    @ResponseBody
    public ResponseEntity<?> registrarAsistenciaManual(@RequestBody Map<String, Object> payload) {
        try {
            Long estudianteId = Long.valueOf(payload.get("estudianteId").toString());
            Long grupoId = payload.get("grupoId") != null ? Long.valueOf(payload.get("grupoId").toString()) : null;
            Long unidadId = payload.get("unidadId") != null ? Long.valueOf(payload.get("unidadId").toString()) : null;
            Long docenteId = Long.valueOf(payload.get("docenteId").toString());
            String tipoAsistencia = (String) payload.getOrDefault("tipoAsistencia", "PRESENTE");
            String observaciones = (String) payload.get("observaciones");

            // Buscar estudiante
            Optional<EstudianteEntity> estudianteOpt = estudianteService.buscarPorId(estudianteId);

            if (estudianteOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "mensaje", "Estudiante no encontrado",
                    "tipo", "error"
                ));
            }

            EstudianteEntity estudiante = estudianteOpt.get();

            // Verificar si ya registró asistencia hoy en esta unidad
            LocalDate hoy = LocalDate.now();
            if (unidadId != null) {
                Optional<AsistenciaEntity> asistenciaExistente =
                    asistenciaService.findByEstudianteIdAndFechaAndUnidadId(estudianteId, hoy, unidadId);

                if (asistenciaExistente.isPresent()) {
                    return ResponseEntity.ok(Map.of(
                        "success", false,
                        "mensaje", "El estudiante ya registró asistencia hoy en esta materia",
                        "tipo", "warning"
                    ));
                }
            }

            // Registrar nueva asistencia
            AsistenciaEntity asistencia = new AsistenciaEntity();
            asistencia.setEstudianteId(estudianteId);
            asistencia.setGrupoId(grupoId);
            asistencia.setUnidadId(unidadId);
            asistencia.setDocenteId(docenteId);
            asistencia.setFechaHora(LocalDateTime.now());
            asistencia.setTipoAsistencia(tipoAsistencia);
            asistencia.setObservaciones(observaciones);

            AsistenciaEntity nuevaAsistencia = asistenciaService.save(asistencia);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "mensaje", "Asistencia registrada correctamente como " + tipoAsistencia,
                "tipo", "success",
                "asistencia", Map.of(
                    "id", nuevaAsistencia.getId(),
                    "fechaHora", nuevaAsistencia.getFechaHora(),
                    "tipoAsistencia", nuevaAsistencia.getTipoAsistencia()
                ),
                "estudiante", Map.of(
                    "id", estudiante.getId(),
                    "nombre", estudiante.getNombre(),
                    "boleta", estudiante.getBoleta()
                )
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "mensaje", "Error al registrar asistencia: " + e.getMessage(),
                "tipo", "error"
            ));
        }
    }
}
