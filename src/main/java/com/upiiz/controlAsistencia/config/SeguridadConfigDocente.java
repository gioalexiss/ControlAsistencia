package com.upiiz.controlAsistencia.config;

import com.upiiz.controlAsistencia.services.DocenteService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SeguridadConfigDocente {

    private final DocenteService docenteService;

    public SeguridadConfigDocente(DocenteService docenteService) {
        this.docenteService = docenteService;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        AuthenticationManagerBuilder builder = http.getSharedObject(AuthenticationManagerBuilder.class);
        builder.userDetailsService(docenteService).passwordEncoder(passwordEncoder());
        return builder.build();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/assets/**", "/page-login").permitAll()
                        .requestMatchers("/index", "/listado").hasAuthority("ROLE_DOCENTE")
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form
                        .loginPage("/") // controlador que devuelve page-login
                        .loginProcessingUrl("/login/valido") // acción del formulario
                        .failureUrl("/?error=true") // redirige aquí si falla
                        .defaultSuccessUrl("/index", true)
                        .permitAll()
                )

                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/page-login?logout")
                        .permitAll()
                );

        return http.build();
    }
}
