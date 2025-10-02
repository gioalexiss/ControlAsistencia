package com.upiiz.controlAsistencia.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class HomeController {
    @GetMapping("/")
    public String login() {
        return "page-login";
    }

    @PostMapping("/login/valido")
    public String loginValido() {

        return "index";
    }

    @GetMapping("/listado")
    public String listado() {
        return "index";
    }

}
