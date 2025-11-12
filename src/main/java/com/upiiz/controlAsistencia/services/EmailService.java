package com.upiiz.controlAsistencia.services;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.upiiz.controlAsistencia.models.Alumno;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;


import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void enviarCorreoConQR(Alumno alumno) throws MessagingException, IOException, WriterException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setTo(alumno.getCorreo());
        helper.setSubject("Confirmación de Registro - " + alumno.getMateria());

        // Generar QR
        String qrContent = generarContenidoQR(alumno);
        byte[] qrCode = generarQRCode(qrContent, 200, 200);

        // Construir contenido del email
        String contenido = construirContenidoEmail(alumno);

        helper.setText(contenido, true);
        helper.addAttachment("codigo-qr.png", new ByteArrayResource(qrCode));

        mailSender.send(message);
    }

    private byte[] generarQRCode(String text, int width, int height) throws WriterException, IOException {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, width, height);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);

        return outputStream.toByteArray();
    }

    private String generarContenidoQR(Alumno alumno) {
        return String.format(
                "ALUMNO REGISTRADO\n" +
                        "Nombre: %s\n" +
                        "Materia: %s\n" +
                        "Correo: %s\n" +
                        "Grupo: %s\n" +
                        "Boleta: %s\n" +
                        "Fecha: %s",
                alumno.getNombre(),
                alumno.getMateria(),
                alumno.getCorreo(),
                alumno.getGrupo(),
                alumno.getBoleta(),
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
        );
    }

    private String construirContenidoEmail(Alumno alumno) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset='UTF-8'>" +
                "<style>" +
                "body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background-color: #faf7f8; }" +
                ".container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(139, 10, 80, 0.2); border: 1px solid #d8b3c2; }" +
                ".header { background: linear-gradient(135deg, #8B0A50 0%, #A62C63 100%); color: white; padding: 30px; text-align: center; border-radius: 13px 13px 0 0; }" +
                ".content { padding: 30px; }" +
                ".info { background-color: #fdf2f6; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #8B0A50; border-right: 1px solid #edd4df; }" +
                ".footer { text-align: center; margin-top: 30px; padding: 20px; color: #8B0A50; font-size: 14px; border-top: 2px solid #f0e0e7; }" +
                ".success { color: #8B0A50; font-weight: bold; font-size: 16px; }" +
                ".nombre-alumno { font-size: 20px; color: #8B0A50; font-weight: bold; margin: 15px 0; text-align: center; }" +
                ".datos-label { color: #8B0A50; font-weight: 600; }" +
                ".datos-valor { color: #333; }" +
                "</style>"+


                "</head>" +
                "<body>" +
                "<div class='container'>" +
                "<div class='header'>" +
                "<h1> Registro Exitoso</h1>" +
                "<p>Sistema de Registro de Alumnos</p>" +
                "</div>" +
                "<div class='content'>" +
                "<p>Hola <strong class='nombre-alumno'>" + alumno.getNombre() + "</strong>,</p>" +
                "<p class='success'> Tu registro ha sido completado exitosamente.</p>" +
                "<p>Aquí están los detalles de tu registro:</p>" +
                "<div class='info'>" +
                "<p><strong> Carrera:</strong> " + alumno.getCarrera() + "</p>" +
                "<p><strong> Grado:</strong> " + alumno.getGrado() + "°</p>" +
                "<p><strong> Materia:</strong> " + alumno.getMateria() + "</p>" +
                "<p><strong>Grupo:</strong> " + alumno.getGrupo() + "</p>" +
                "<p><strong> Número de Boleta:</strong> " + alumno.getBoleta() + "</p>" +
                "<p><strong> Correo:</strong> " + alumno.getCorreo() + "</p>" +
                "<p><strong> Fecha de Registro:</strong> " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'a las' HH:mm")) + "</p>" +
                "</div>" +
                "<p>Se ha generado un código QR con tu información que puedes encontrar adjunto en este correo.</p>" +
                "<p><strong>Guarda este correo como comprobante de tu registro.</strong></p>" +
                "</div>" +
                "<div class='footer'>" +
                "<p>Sistema de Registro de Alumnos</p>" +
                "<p>Este es un correo automático, por favor no respondas a este mensaje.</p>" +
                "</div>" +
                "</div>" +
                "</body>" +
                "</html>";
    }
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviarCodigo(String destino, String codigo) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setTo(destino);
        mensaje.setSubject("Código de verificación - Control de Asistencia IPN");
        mensaje.setText("Tu código de verificación es: " + codigo + "\n\nExpira en 10 minutos.\n\nSi no solicitaste este código, ignora este mensaje.");
        mailSender.send(mensaje);
    }

}