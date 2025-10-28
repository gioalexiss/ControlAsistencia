package com.upiiz.controlAsistencia.controllers;



import com.upiiz.controlAsistencia.models.Alumno;
import com.upiiz.controlAsistencia.services.EmailService;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class RegistroController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/registrar")
    public ResponseEntity<Map<String, String>> registrarAlumno(@RequestBody Alumno alumno) {
        Map<String, String> response = new HashMap<>();

        try {
            // Validar datos básicos
            if (alumno.getNombre() == null || alumno.getNombre().trim().isEmpty() ||
                    alumno.getCorreo() == null || alumno.getCorreo().trim().isEmpty()) {
                response.put("error", "Nombre y correo son obligatorios");
                return ResponseEntity.badRequest().body(response);
            }

            // Enviar correo con QR
            emailService.enviarCorreoConQR(alumno);

            response.put("mensaje", "Registro exitoso. Se ha enviado un correo con el código QR a " + alumno.getCorreo());
            return ResponseEntity.ok(response);

        } catch (MessagingException | IOException e) {
            e.printStackTrace();
            response.put("error", "Error al enviar el correo: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("error", "Error en el registro: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @Controller
    public class alumno {
        @GetMapping("/alumno_reg")
        public String login() {
            return "alumno_reg";
        }

    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Servicio funcionando correctamente");
    }
}