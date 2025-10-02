package com.upiiz.controlAsistencia.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class DocenteController {
    @PostMapping("/login/valido")
    public String loginDocenteFormulario() {
        return "index"; // Redirige al dashboard después del login
    }

    @GetMapping("/index")
    public String dashboard() {
        return "index"; // Dashboard docente
    }
}
