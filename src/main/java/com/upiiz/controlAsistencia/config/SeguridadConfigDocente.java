package com.upiiz.controlAsistencia.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SeguridadConfigDocente {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        // ✅ Rutas públicas (accesibles sin login)
                        .requestMatchers(
                                "/",                              // Página principal (registro alumnos)
                                "/alumno_reg",                    // Página de registro de alumnos
                                "/auth/login",                    // Login de maestros
                                "/auth/register",                 // Registro de maestros (POST)
                                "/auth/verify",                   // Verificación de maestros (POST)
                                "/auth/loginProcess",             // Proceso de login (POST)
                                "/api/registrar",                 // API para registrar alumnos
                                "/api/health",                    // Health check
                                "/assets/**",
                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/favicon.ico"
                        ).permitAll()
                        // ⚠️ NO especificamos /auth/index aquí - lo manejamos con sesión HTTP
                        .anyRequest().permitAll()  // Temporalmente permitimos todo para debugging
                )
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/?logout=true")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .permitAll()
                );

        return http.build();
    }
}