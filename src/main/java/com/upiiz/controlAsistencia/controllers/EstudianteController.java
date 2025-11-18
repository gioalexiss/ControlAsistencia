package com.upiiz.controlAsistencia.controllers;

import com.upiiz.controlAsistencia.models.EstudianteEntity;
import com.upiiz.controlAsistencia.services.EstudianteService;
import com.upiiz.controlAsistencia.services.PdfExtractorService;
import com.upiiz.controlAsistencia.services.ExcelExtractorService;
import com.upiiz.controlAsistencia.services.EstudianteService.EstudianteDTO;
import com.upiiz.controlAsistencia.services.EstudianteService.ResultadoCargaMasiva;
import org.springframework.http.HttpStatus;
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

    public EstudianteController(EstudianteService estudianteService,
                               PdfExtractorService pdfExtractorService,
                               ExcelExtractorService excelExtractorService) {
        this.estudianteService = estudianteService;
        this.pdfExtractorService = pdfExtractorService;
        this.excelExtractorService = excelExtractorService;
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
     * Endpoint para guardar estudiantes desde Excel y vincularlos a un grupo
     * POST /estudiantes/guardar-desde-excel/{idGrupo}
     */
    @PostMapping("/guardar-desde-excel/{idGrupo}")
    @ResponseBody
    public ResponseEntity<?> guardarEstudiantesDesdeExcel(
            @PathVariable Long idGrupo,
            @RequestBody List<EstudianteDTO> estudiantes) {
        try {
            // Validar que la lista no esté vacía
            if (estudiantes == null || estudiantes.isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body(crearRespuestaError("La lista de estudiantes está vacía"));
            }

            // Guardar estudiantes y vincularlos al grupo
            ResultadoCargaMasiva resultado = estudianteService.guardarEstudiantesDesdeExcelYVincular(estudiantes, idGrupo);

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
     * Endpoint para generar QR codes masivamente para todos los estudiantes de un docente
     * POST /estudiantes/generar-qr-masivo/{docenteId}
     */
    @PostMapping("/generar-qr-masivo/{docenteId}")
    @ResponseBody
    public ResponseEntity<?> generarQRMasivo(@PathVariable Long docenteId) {
        try {
            Map<String, Object> resultado = estudianteService.generarQRMasivoParaDocente(docenteId);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al generar QR masivo: " + e.getMessage()));
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
