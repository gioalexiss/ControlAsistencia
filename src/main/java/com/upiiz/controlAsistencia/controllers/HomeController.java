package com.upiiz.controlAsistencia.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "auth";  // Muestra auth.html (registro/login/verificación)
    }
}