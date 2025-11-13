package com.upiiz.controlAsistencia.controllers;

import com.upiiz.controlAsistencia.services.DocenteService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/auth")
public class DocenteController {

    private final DocenteService authService;

    public DocenteController(DocenteService authService) {
        this.authService = authService;
    }

    // 🔹 MOSTRAR LA PÁGINA DE LOGIN/REGISTRO DE MAESTROS
    @GetMapping("/login")
    public String mostrarLogin(HttpSession session) {
        // Si ya está autenticado, redirigir al dashboard
        Boolean autenticado = (Boolean) session.getAttribute("usuarioAutenticado");
        if (autenticado != null && autenticado) {
            return "redirect:/auth/index";
        }
        return "auth";
    }

    // 🔹 PROCESAR EL REGISTRO DE MAESTROS
    @PostMapping("/register")
    @ResponseBody
    public String registrar(@RequestParam String nombre,
                            @RequestParam String correo,
                            @RequestParam String password) {
        return authService.registrar(nombre, correo, password);
    }

    // 🔹 PROCESAR LA VERIFICACIÓN
    @PostMapping("/verify")
    @ResponseBody
    public String verificar(@RequestParam String correo,
                            @RequestParam String codigo) {
        return authService.verificar(correo, codigo);
    }

    // 🔹 PROCESAR EL LOGIN (AJAX) - ✅ ACTUALIZADO
    @PostMapping("/loginProcess")
    @ResponseBody
    public ResponseEntity<String> loginProcess(@RequestParam String correo,
                                               @RequestParam String password,
                                               HttpSession session) {
        String resultado = authService.login(correo, password);

        if (resultado.startsWith("OK:")) {
            // ✅ Crear sesión HTTP para el usuario autenticado
            session.setAttribute("usuarioAutenticado", true);
            session.setAttribute("correoDocente", correo);
            session.setAttribute("nombreDocente", resultado.substring(3)); // Quita "OK:"

            System.out.println("✅ Sesión creada para: " + correo);

            return ResponseEntity.ok(resultado);
        } else {
            return ResponseEntity.badRequest().body(resultado);
        }
    }

    // 🔹 DASHBOARD DE MAESTROS - ✅ PROTEGIDO
    @GetMapping("/index")
    public String mostrarIndex(HttpSession session) {
        // Verificar que hay sesión activa
        Boolean autenticado = (Boolean) session.getAttribute("usuarioAutenticado");

        if (autenticado == null || !autenticado) {
            System.out.println("❌ Acceso denegado - No hay sesión activa");
            return "redirect:/auth/login";
        }

        String nombre = (String) session.getAttribute("nombreDocente");
        System.out.println("✅ Acceso permitido al dashboard para: " + nombre);

        return "index";  // Dashboard de maestros
    }

    // 🔹 LOGOUT MANUAL (opcional, además del que ya tiene Spring Security)
    @GetMapping("/logout-manual")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/?logout=true";
    }
}