    package com.upiiz.controlAsistencia.controllers;

    import com.upiiz.controlAsistencia.services.DocenteService;
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

        // 🔹 MOSTRAR LA PÁGINA DE AUTH (login/registro/verificación)
        @GetMapping("/login")
        public String mostrarLogin() {
            return "auth";
        }

        // 🔹 PROCESAR EL REGISTRO
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

        // 🔹 PROCESAR EL LOGIN (AJAX)
        @PostMapping("/loginProcess")
        @ResponseBody
        public ResponseEntity<String> loginProcess(@RequestParam String correo,
                                                   @RequestParam String password) {
            String resultado = authService.login(correo, password);
            if (resultado.startsWith("OK:")) {
                return ResponseEntity.ok(resultado);
            } else {
                return ResponseEntity.badRequest().body(resultado);
            }
        }

        // 🔹 PÁGINA PRINCIPAL DESPUÉS DEL LOGIN
        @GetMapping("/index")
        public String mostrarIndex() {
            return "index";  // Tu dashboard
        }
    }