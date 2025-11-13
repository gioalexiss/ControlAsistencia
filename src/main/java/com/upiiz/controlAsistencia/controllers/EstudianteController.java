package com.upiiz.controlAsistencia.controllers;

import com.upiiz.controlAsistencia.models.EstudianteEntity;
import com.upiiz.controlAsistencia.services.EstudianteService;
import com.upiiz.controlAsistencia.services.PdfExtractorService;
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

    public EstudianteController(EstudianteService estudianteService, PdfExtractorService pdfExtractorService) {
        this.estudianteService = estudianteService;
        this.pdfExtractorService = pdfExtractorService;
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
     * Método auxiliar para crear respuestas de error
     */
    private Map<String, Object> crearRespuestaError(String mensaje) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("mensaje", mensaje);
        return error;
    }
}
