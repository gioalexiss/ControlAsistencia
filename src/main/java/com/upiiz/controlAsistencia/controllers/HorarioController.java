package com.upiiz.controlAsistencia.controllers;

import com.upiiz.controlAsistencia.services.HorarioCompletoService;
import com.upiiz.controlAsistencia.services.UnidadService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/horario")
public class HorarioController {

    private final UnidadService unidadService;
    private final HorarioCompletoService horarioCompletoService;

    public HorarioController(HorarioCompletoService horarioCompletoService, UnidadService unidadService) {
        this.horarioCompletoService = horarioCompletoService;
        this.unidadService = unidadService;
    }

    public static class GuardarHorarioRequest {
        private Long docenteId;
        private String unidad;
        private List<HorarioCompletoService.GrupoConHorarios> grupos;

        public Long getDocenteId() { return docenteId; }
        public void setDocenteId(Long docenteId) { this.docenteId = docenteId; }

        public String getUnidad() { return unidad; }
        public void setUnidad(String unidad) { this.unidad = unidad; }

        public List<HorarioCompletoService.GrupoConHorarios> getGrupos() { return grupos; }
        public void setGrupos(List<HorarioCompletoService.GrupoConHorarios> grupos) { this.grupos = grupos; }
    }


    // 🔹 GUARDAR HORARIO COMPLETO
    @PostMapping("/guardar")
    @ResponseBody
    public ResponseEntity<String> guardarHorario(@RequestBody GuardarHorarioRequest request) {
        String resultado = horarioCompletoService.guardarHorarioCompleto(
                request.getDocenteId(),
                request.getUnidad(),
                request.getGrupos()
        );

        if (resultado.startsWith("OK:")) {
            return ResponseEntity.ok(resultado);
        } else {
            return ResponseEntity.badRequest().body(resultado);
        }
    }

    // 🔹 OBTENER HORARIO DEL DOCENTE
    @GetMapping("/obtener/{docenteId}")
    @ResponseBody
    public ResponseEntity<?> obtenerHorarioDocente(@PathVariable Long docenteId) {
        try {
            var unidades = horarioCompletoService.obtenerHorarioDocente(docenteId);
            return ResponseEntity.ok(unidades);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 🔹 ELIMINAR UNIDAD
    @DeleteMapping("/unidad/{id}")
    @ResponseBody
    public ResponseEntity<String> eliminarUnidad(@PathVariable Long id) {
        try {
            int rows = unidadService.delete(id); // Usando tu UnidadService
            if (rows > 0) {
                return ResponseEntity.ok("OK: Unidad eliminada");
            } else {
                return ResponseEntity.badRequest().body("❌ No se encontró la unidad");
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("❌ Error: " + e.getMessage());
        }
    }

}
