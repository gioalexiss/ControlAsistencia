package com.upiiz.controlAsistencia.controllers;

import com.upiiz.controlAsistencia.models.HorarioModel;
import com.upiiz.controlAsistencia.services.HorarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.ui.Model;

import java.util.List;

@Controller
@RequestMapping("/horarios")
public class HorarioController {

    @Autowired
    private HorarioService horarioService;

    @GetMapping("/subir")
    public String subirHorarioPage() {
        return "subir-horario"; // Página HTML con formulario para subir imagen
    }

    @PostMapping("/procesar")
    @ResponseBody
    public List<HorarioModel> procesarHorario(@RequestParam("imagenHorario") MultipartFile imagen) {
        return horarioService.procesarImagen(imagen);
    }
}
