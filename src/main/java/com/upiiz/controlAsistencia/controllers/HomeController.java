package com.upiiz.controlAsistencia.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class HomeController {
    @GetMapping("/")
    public String login() {
        return "page-login"; // Aquí pones el nombre de tu archivo de login (sin .html)
    }

    @PostMapping("/login/valido")
    public String loginValido() {
        // Por ahora, redirige al listado sin validar
        return "index";
    }

    @GetMapping("/listado")
    public String listado() {
        return "index"; // listado.html en templates
    }

}
