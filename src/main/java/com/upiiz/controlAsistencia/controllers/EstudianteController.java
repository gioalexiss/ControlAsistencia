package com.upiiz.controlAsistencia.controllers;

import com.upiiz.controlAsistencia.models.EstudianteEntity;
import com.upiiz.controlAsistencia.services.EstudianteService;
import com.upiiz.controlAsistencia.services.PdfExtractorService;
import com.upiiz.controlAsistencia.services.ExcelExtractorService;
import com.upiiz.controlAsistencia.services.QRCodeService;
import com.upiiz.controlAsistencia.services.EstudianteService.EstudianteDTO;
import com.upiiz.controlAsistencia.services.EstudianteService.ResultadoCargaMasiva;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/estudiantes")
public class EstudianteController {

    private final EstudianteService estudianteService;
    private final PdfExtractorService pdfExtractorService;
    private final ExcelExtractorService excelExtractorService;
    private final QRCodeService qrCodeService;

    public EstudianteController(EstudianteService estudianteService,
                               PdfExtractorService pdfExtractorService,
                               ExcelExtractorService excelExtractorService,
                               QRCodeService qrCodeService) {
        this.estudianteService = estudianteService;
        this.pdfExtractorService = pdfExtractorService;
        this.excelExtractorService = excelExtractorService;
        this.qrCodeService = qrCodeService;
    }

    /**
     * Endpoint para extraer datos de un PDF
     * POST /estudiantes/extraer-pdf
     */
    @PostMapping("/extraer-pdf")
    @ResponseBody
    public ResponseEntity<?> extraerDatosDePDF(@RequestParam("file") MultipartFile file) {
        try {
            // Validar archivo
            if (!pdfExtractorService.esArchivoValido(file)) {
                return ResponseEntity
                        .badRequest()
                        .body(crearRespuestaError("El archivo debe ser un PDF válido"));
            }

            // Extraer datos del PDF
            List<EstudianteDTO> estudiantes = pdfExtractorService.extraerDatosDePDF(file);

            if (estudiantes.isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body(crearRespuestaError("No se encontraron datos de estudiantes en el PDF"));
            }

            // Preparar respuesta exitosa
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("success", true);
            respuesta.put("mensaje", "Datos extraídos exitosamente");
            respuesta.put("totalEncontrados", estudiantes.size());
            respuesta.put("estudiantes", estudiantes);

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al procesar el PDF: " + e.getMessage()));
        }
    }

    /**
     * Endpoint para guardar estudiantes desde el PDF
     * POST /estudiantes/guardar-desde-pdf
     */
    @PostMapping("/guardar-desde-pdf")
    @ResponseBody
    public ResponseEntity<?> guardarEstudiantesDesdePDF(@RequestBody List<EstudianteDTO> estudiantes) {
        try {
            // Validar que la lista no esté vacía
            if (estudiantes == null || estudiantes.isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body(crearRespuestaError("La lista de estudiantes está vacía"));
            }

            // Guardar estudiantes
            ResultadoCargaMasiva resultado = estudianteService.guardarEstudiantesDesdePDF(estudiantes);

            // Preparar respuesta
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("success", true);
            respuesta.put("mensaje", resultado.getMensajeResumen());
            respuesta.put("totalProcesados", resultado.getTotalProcesados());
            respuesta.put("nuevos", resultado.getTotalNuevos());
            respuesta.put("actualizados", resultado.getTotalActualizados());
            respuesta.put("errores", resultado.getTotalErrores());
            respuesta.put("listaErrores", resultado.getErrores());

            if (resultado.getTotalErrores() > 0) {
                respuesta.put("advertencia", "Algunos estudiantes no pudieron ser procesados");
            }

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al procesar estudiantes: " + e.getMessage()));
        }
    }

    /**
     * Endpoint para obtener todos los estudiantes
     * GET /estudiantes/todos
     */
    @GetMapping("/todos")
    @ResponseBody
    public ResponseEntity<?> obtenerTodosLosEstudiantes() {
        try {
            List<EstudianteEntity> estudiantes = estudianteService.obtenerTodos();
            return ResponseEntity.ok(estudiantes);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al obtener estudiantes: " + e.getMessage()));
        }
    }

    /**
     * Endpoint para buscar estudiante por boleta
     * GET /estudiantes/boleta/{boleta}
     */
    @GetMapping("/boleta/{boleta}")
    @ResponseBody
    public ResponseEntity<?> buscarPorBoleta(@PathVariable String boleta) {
        try {
            return estudianteService.buscarPorBoleta(boleta)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al buscar estudiante: " + e.getMessage()));
        }
    }

    /**
     * Endpoint para extraer datos de un archivo Excel
     * POST /estudiantes/extraer-excel
     */
    @PostMapping("/extraer-excel")
    @ResponseBody
    public ResponseEntity<?> extraerDatosDeExcel(@RequestParam("file") MultipartFile file) {
        try {
            // Extraer datos del Excel
            List<Map<String, String>> datosExcel = excelExtractorService.extraerDatosDeExcel(file);

            if (datosExcel.isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body(crearRespuestaError("No se encontraron datos de estudiantes en el Excel"));
            }

            // Convertir a DTOs
            List<EstudianteDTO> estudiantes = datosExcel.stream()
                .map(datos -> new EstudianteDTO(
                    datos.get("boleta"),
                    datos.get("nombre"),
                    datos.get("correo")
                ))
                .toList();

            // Preparar respuesta exitosa
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("success", true);
            respuesta.put("mensaje", "Datos extraídos exitosamente del Excel");
            respuesta.put("totalEncontrados", estudiantes.size());
            respuesta.put("estudiantes", estudiantes);

            return ResponseEntity.ok(respuesta);

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(crearRespuestaError(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al procesar el Excel: " + e.getMessage()));
        }
    }

    /**
     * Endpoint para guardar estudiantes desde Excel y vincularlos a un grupo y unidad
     * POST /estudiantes/guardar-desde-excel/{idGrupo}/{idUnidad}
     */
    @PostMapping("/guardar-desde-excel/{idGrupo}/{idUnidad}")
    @ResponseBody
    public ResponseEntity<?> guardarEstudiantesDesdeExcel(
            @PathVariable Long idGrupo,
            @PathVariable Long idUnidad,
            @RequestBody List<EstudianteDTO> estudiantes) {
        try {
            // Validar que la lista no esté vacía
            if (estudiantes == null || estudiantes.isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body(crearRespuestaError("La lista de estudiantes está vacía"));
            }

            // Guardar estudiantes y vincularlos al grupo y unidad
            ResultadoCargaMasiva resultado = estudianteService.guardarEstudiantesDesdeExcelYVincular(estudiantes, idGrupo, idUnidad);

            // Preparar respuesta
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("success", true);
            respuesta.put("mensaje", resultado.getMensajeResumen());
            respuesta.put("totalProcesados", resultado.getTotalProcesados());
            respuesta.put("nuevos", resultado.getTotalNuevos());
            respuesta.put("actualizados", resultado.getTotalActualizados());
            respuesta.put("errores", resultado.getTotalErrores());
            respuesta.put("listaErrores", resultado.getErrores());

            if (resultado.getTotalErrores() > 0) {
                respuesta.put("advertencia", "Algunos estudiantes no pudieron ser procesados");
            }

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al guardar estudiantes: " + e.getMessage()));
        }
    }

    /**
     * Endpoint para obtener estudiantes de un grupo específico
     * GET /estudiantes/grupo/{idGrupo}
     */
    @GetMapping("/grupo/{idGrupo}")
    @ResponseBody
    public ResponseEntity<?> obtenerEstudiantesPorGrupo(@PathVariable Long idGrupo) {
        try {
            List<EstudianteEntity> estudiantes = estudianteService.obtenerEstudiantesPorGrupo(idGrupo);
            return ResponseEntity.ok(estudiantes);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al obtener estudiantes del grupo: " + e.getMessage()));
        }
    }

    /**
     * Endpoint para obtener todos los estudiantes de un docente
     * GET /estudiantes/docente/{docenteId}
     */
    @GetMapping("/docente/{docenteId}")
    @ResponseBody
    public ResponseEntity<?> obtenerEstudiantesPorDocente(@PathVariable Long docenteId) {
        try {
            List<EstudianteEntity> estudiantes = estudianteService.obtenerEstudiantesPorDocente(docenteId);
            return ResponseEntity.ok(estudiantes);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al obtener estudiantes del docente: " + e.getMessage()));
        }
    }

    /**
     * Endpoint para obtener estudiantes de un docente con información de sus grupos
     * GET /estudiantes/docente/{docenteId}/con-grupos
     */
    @GetMapping("/docente/{docenteId}/con-grupos")
    @ResponseBody
    public ResponseEntity<?> obtenerEstudiantesConGruposPorDocente(@PathVariable Long docenteId) {
        try {
            List<Map<String, Object>> estudiantes = estudianteService.obtenerEstudiantesConGruposPorDocente(docenteId);
            return ResponseEntity.ok(estudiantes);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al obtener estudiantes del docente: " + e.getMessage()));
        }
    }

    /**
     * Endpoint para generar QR codes masivamente para todos los estudiantes de un docente
     * POST /estudiantes/generar-qr-masivo/{docenteId}
     */
    @PostMapping("/generar-qr-masivo/{docenteId}")
    @ResponseBody
    public ResponseEntity<?> generarQRMasivo(
            @PathVariable Long docenteId,
            @RequestParam(defaultValue = "false") boolean enviarCorreo) {
        try {
            Map<String, Object> resultado = estudianteService.generarQRMasivoParaDocente(docenteId, enviarCorreo);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al generar QR masivo: " + e.getMessage()));
        }
    }

    /**
     * Endpoint para enviar QR a un estudiante individual
     * POST /estudiantes/{id}/enviar-qr
     */
    @PostMapping("/{id}/enviar-qr")
    @ResponseBody
    public ResponseEntity<?> enviarQRIndividual(@PathVariable Long id) {
        try {
            Map<String, Object> resultado = estudianteService.generarYEnviarQRIndividual(id);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al enviar QR: " + e.getMessage()));
        }
    }

    /**
     * Endpoint para obtener la imagen QR de un estudiante
     * GET /estudiantes/{id}/qr-image
     */
    @GetMapping("/{id}/qr-image")
    public ResponseEntity<byte[]> obtenerImagenQR(@PathVariable Long id) {
        try {
            EstudianteEntity estudiante = estudianteService.buscarPorId(id)
                .orElseThrow(() -> new RuntimeException("Estudiante no encontrado"));

            if (estudiante.getQrCode() == null || estudiante.getQrCode().isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            byte[] imagenQR = qrCodeService.generarImagenQR(estudiante.getQrCode());

            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(imagenQR);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Endpoint para eliminar un estudiante
     * DELETE /estudiantes/{id}
     */
    @DeleteMapping("/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminarEstudiante(@PathVariable Long id) {
        try {
            boolean eliminado = estudianteService.eliminarEstudiante(id);

            if (eliminado) {
                Map<String, Object> respuesta = new HashMap<>();
                respuesta.put("success", true);
                respuesta.put("mensaje", "Estudiante eliminado correctamente");
                return ResponseEntity.ok(respuesta);
            } else {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(crearRespuestaError("Estudiante no encontrado"));
            }
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al eliminar estudiante: " + e.getMessage()));
        }
    }

    /**
     * Endpoint para crear un estudiante individual
     * POST /estudiantes/crear
     * Parámetros opcionales: idGrupo, idUnidad (para vincular al estudiante a un grupo)
     */
    @PostMapping("/crear")
    @ResponseBody
    public ResponseEntity<?> crearEstudiante(
            @RequestBody EstudianteDTO estudianteDTO,
            @RequestParam(required = false) Long idGrupo,
            @RequestParam(required = false) Long idUnidad) {
        try {
            // Validar datos
            if (estudianteDTO.getBoleta() == null || estudianteDTO.getBoleta().trim().isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body(crearRespuestaError("La boleta es obligatoria"));
            }

            if (estudianteDTO.getNombre() == null || estudianteDTO.getNombre().trim().isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body(crearRespuestaError("El nombre es obligatorio"));
            }

            // Verificar si ya existe la boleta
            if (estudianteService.buscarPorBoleta(estudianteDTO.getBoleta()).isPresent()) {
                return ResponseEntity
                        .badRequest()
                        .body(crearRespuestaError("Ya existe un estudiante con esa boleta"));
            }

            // Crear estudiante y opcionalmente vincularlo a un grupo
            EstudianteEntity estudiante = estudianteService.crearEstudianteYVincular(estudianteDTO, idGrupo, idUnidad);

            // Preparar respuesta
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("success", true);

            if (idGrupo != null && idUnidad != null) {
                respuesta.put("mensaje", "Estudiante creado y asignado al grupo correctamente");
            } else {
                respuesta.put("mensaje", "Estudiante creado correctamente");
            }

            respuesta.put("estudiante", estudiante);

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al crear estudiante: " + e.getMessage()));
        }
    }

    /**
     * Endpoint para actualizar un estudiante
     * PUT /estudiantes/{id}
     * Parámetros opcionales: idGrupo, idUnidad (para cambiar el grupo del estudiante)
     */
    @PutMapping("/{id}")
    @ResponseBody
    public ResponseEntity<?> actualizarEstudiante(
            @PathVariable Long id,
            @RequestBody EstudianteDTO estudianteDTO,
            @RequestParam(required = false) Long idGrupo,
            @RequestParam(required = false) Long idUnidad) {
        try {
            // Validar datos
            if (estudianteDTO.getBoleta() == null || estudianteDTO.getBoleta().trim().isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body(crearRespuestaError("La boleta es obligatoria"));
            }

            if (estudianteDTO.getNombre() == null || estudianteDTO.getNombre().trim().isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body(crearRespuestaError("El nombre es obligatorio"));
            }

            // Actualizar estudiante
            EstudianteEntity estudiante = estudianteService.actualizarEstudiante(id, estudianteDTO, idGrupo, idUnidad);

            if (estudiante == null) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(crearRespuestaError("Estudiante no encontrado"));
            }

            // Preparar respuesta
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("success", true);
            respuesta.put("mensaje", "Estudiante actualizado correctamente");
            respuesta.put("estudiante", estudiante);

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al actualizar estudiante: " + e.getMessage()));
        }
    }

    /**
     * Método auxiliar para crear respuestas de error
     */
    private Map<String, Object> crearRespuestaError(String mensaje) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("mensaje", mensaje);
        return error;
    }
}
