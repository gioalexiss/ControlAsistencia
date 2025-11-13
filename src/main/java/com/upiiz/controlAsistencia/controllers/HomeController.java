package com.upiiz.controlAsistencia.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    //  PÁGINA PRINCIPAL - Registro de alumnos
    @GetMapping("/")
    public String home() {
        return "alumno_reg";  // Muestra alumno_reg.html como página principal
    }

}