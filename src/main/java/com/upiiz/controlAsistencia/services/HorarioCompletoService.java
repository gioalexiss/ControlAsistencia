package com.upiiz.controlAsistencia.services;

import com.upiiz.controlAsistencia.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HorarioCompletoService {

    @Autowired
    private UnidadService unidadService;

    @Autowired
    private GrupoService grupoService;

    @Autowired
    private HorarioService horarioService;

    // DTOs para recibir datos del frontend
    public static class GrupoConHorarios {
        private String grupo;
        private Integer semestre;
        private String tipo;
        private List<HorarioData> horarios;

        // Getters y Setters
        public String getGrupo() { return grupo; }
        public void setGrupo(String grupo) { this.grupo = grupo; }

        public Integer getSemestre() { return semestre; }
        public void setSemestre(Integer semestre) { this.semestre = semestre; }

        public String getTipo() { return tipo; }
        public void setTipo(String tipo) { this.tipo = tipo; }

        public List<HorarioData> getHorarios() { return horarios; }
        public void setHorarios(List<HorarioData> horarios) { this.horarios = horarios; }
    }

    public static class HorarioData {
        private String dia;
        private String inicio;
        private String fin;
        private String tipo;

        // Getters y Setters
        public String getDia() { return dia; }
        public void setDia(String dia) { this.dia = dia; }

        public String getInicio() { return inicio; }
        public void setInicio(String inicio) { this.inicio = inicio; }

        public String getFin() { return fin; }
        public void setFin(String fin) { this.fin = fin; }

        public String getTipo() { return tipo; }
        public void setTipo(String tipo) { this.tipo = tipo; }
    }

    public String guardarHorarioCompleto(Long docenteId, String nombreUnidad, List<GrupoConHorarios> grupos) {
        try {
            // 1️⃣ Guardar unidad
            UnidadModel unidad = new UnidadModel();
            unidad.setIdDocente(docenteId);
            unidad.setNombreUnidad(nombreUnidad);
            unidad = unidadService.save(unidad);

            // 2️⃣ Guardar grupos y horarios
            for (GrupoConHorarios grupoData : grupos) {
                GrupoModel grupo = new GrupoModel();
                grupo.setIdUnidad(unidad.getId());
                grupo.setNombreGrupo(grupoData.getGrupo());
                grupo.setSemestre(grupoData.getSemestre());
                grupo.setTipo(grupoData.getTipo());
                grupo = grupoService.save(grupo);

                // 3️⃣ Guardar horarios del grupo
                for (HorarioData horarioData : grupoData.getHorarios()) {
                    HorarioModel horario = new HorarioModel();
                    horario.setIdGrupo(grupo.getId());
                    horario.setDiaSemana(horarioData.getDia());
                    horario.setHoraInicio(java.time.LocalTime.parse(horarioData.getInicio()));
                    horario.setHoraFin(java.time.LocalTime.parse(horarioData.getFin()));
                    horario.setTipoHorario(horarioData.getTipo());
                    horario.setAula("Aula por definir");
                    horarioService.save(horario);
                }
            }

            return "OK: Horario guardado correctamente";
        } catch (Exception e) {
            return "ERROR: " + e.getMessage();
        }
    }

    public List<UnidadModel> obtenerHorarioDocente(Long docenteId) {
        return unidadService.findAllByDocenteId(docenteId);
    }
}