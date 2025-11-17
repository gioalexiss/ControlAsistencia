package com.upiiz.controlAsistencia.controllers;

import com.upiiz.controlAsistencia.models.GrupoModel;
import com.upiiz.controlAsistencia.services.GrupoService;
import com.upiiz.controlAsistencia.services.HorarioCompletoService;
import com.upiiz.controlAsistencia.services.EstudianteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/grupos")
public class GrupoController {

    private final GrupoService grupoService;
    private final HorarioCompletoService horarioCompletoService;
    private final EstudianteService estudianteService;

    public GrupoController(GrupoService grupoService,
                          HorarioCompletoService horarioCompletoService,
                          EstudianteService estudianteService) {
        this.grupoService = grupoService;
        this.horarioCompletoService = horarioCompletoService;
        this.estudianteService = estudianteService;
    }

    /**
     * Obtener todos los grupos de un docente con información completa
     * GET /grupos/docente/{docenteId}
     */
    @GetMapping("/docente/{docenteId}")
    @ResponseBody
    public ResponseEntity<?> obtenerGruposDelDocente(@PathVariable Long docenteId) {
        try {
            // Obtener el horario completo del docente (incluye unidades y grupos)
            var horarioCompleto = horarioCompletoService.obtenerHorarioDocente(docenteId);

            if (horarioCompleto == null || horarioCompleto.isEmpty()) {
                Map<String, Object> respuesta = new HashMap<>();
                respuesta.put("success", true);
                respuesta.put("mensaje", "No se encontraron grupos para este docente");
                respuesta.put("grupos", List.of());
                return ResponseEntity.ok(respuesta);
            }

            // Preparar respuesta con grupos y sus datos
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("success", true);
            respuesta.put("unidades", horarioCompleto);

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al obtener grupos: " + e.getMessage()));
        }
    }

    /**
     * Obtener información de un grupo específico con estadísticas
     * GET /grupos/{idGrupo}/info
     */
    @GetMapping("/{idGrupo}/info")
    @ResponseBody
    public ResponseEntity<?> obtenerInfoGrupo(@PathVariable Long idGrupo) {
        try {
            GrupoModel grupo = grupoService.findById(idGrupo);
            if (grupo == null) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(crearRespuestaError("Grupo no encontrado"));
            }

            // Obtener estadísticas del grupo
            int totalEstudiantes = estudianteService.obtenerEstudiantesPorGrupo(idGrupo).size();

            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("success", true);
            respuesta.put("grupo", grupo);
            respuesta.put("totalEstudiantes", totalEstudiantes);

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al obtener información del grupo: " + e.getMessage()));
        }
    }

    /**
     * Obtener estadísticas generales de todos los grupos del docente
     * GET /grupos/docente/{docenteId}/estadisticas
     */
    @GetMapping("/docente/{docenteId}/estadisticas")
    @ResponseBody
    public ResponseEntity<?> obtenerEstadisticasDocente(@PathVariable Long docenteId) {
        try {
            var horarioCompleto = horarioCompletoService.obtenerHorarioDocente(docenteId);

            int totalGrupos = 0;
            int totalEstudiantes = 0;

            // Contar grupos y estudiantes
            if (horarioCompleto != null) {
                for (var unidad : horarioCompleto) {
                    if (unidad.getGrupos() != null) {
                        totalGrupos += unidad.getGrupos().size();

                        // Contar estudiantes de cada grupo
                        for (var grupo : unidad.getGrupos()) {
                            totalEstudiantes += estudianteService.obtenerEstudiantesPorGrupo(grupo.getId()).size();
                        }
                    }
                }
            }

            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("success", true);
            respuesta.put("totalGrupos", totalGrupos);
            respuesta.put("totalEstudiantes", totalEstudiantes);
            respuesta.put("totalUnidades", horarioCompleto != null ? horarioCompleto.size() : 0);

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(crearRespuestaError("Error al obtener estadísticas: " + e.getMessage()));
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
