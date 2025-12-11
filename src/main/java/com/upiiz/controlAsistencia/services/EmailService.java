package com.upiiz.controlAsistencia.services;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Attachments;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import com.upiiz.controlAsistencia.models.Alumno;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${sendgrid.api.key}")
    private String sendGridApiKey;

    @Value("${sendgrid.from.email}")
    private String fromEmail;

    @Value("${sendgrid.from.name:Sistema Control de Asistencia}")
    private String fromName;

    public void enviarCorreoConQR(Alumno alumno) throws IOException, WriterException {
        log.info("Iniciando envío de correo a: {}", alumno.getCorreo());
        log.info("Usando FROM: {} <{}>", fromName, fromEmail);

        SendGrid sg = new SendGrid(sendGridApiKey);

        Email from = new Email(fromEmail, fromName);
        Email to = new Email(alumno.getCorreo());
        String subject = "Confirmación de Registro - " + alumno.getMateria();

        // Generar QR
        String qrContent = generarContenidoQR(alumno);
        byte[] qrCode = generarQRCode(qrContent, 200, 200);
        String qrBase64 = Base64.getEncoder().encodeToString(qrCode);

        // Construir contenido del email con QR incrustado
        String contenidoHtml = construirContenidoEmail(alumno, qrBase64);
        Content content = new Content("text/html", contenidoHtml);

        Mail mail = new Mail(from, subject, to, content);

        // También agregar QR como adjunto
        Attachments attachments = new Attachments();
        attachments.setContent(qrBase64);
        attachments.setType("image/png");
        attachments.setFilename("codigo-qr.png");
        attachments.setDisposition("attachment");
        mail.addAttachments(attachments);

        // Enviar
        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            log.info("Enviando request a SendGrid...");
            Response response = sg.api(request);

            log.info("Respuesta de SendGrid - Status: {}", response.getStatusCode());
            log.info("Respuesta de SendGrid - Body: {}", response.getBody());
            log.info("Respuesta de SendGrid - Headers: {}", response.getHeaders());

            if (response.getStatusCode() >= 400) {
                log.error("Error al enviar correo. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
                throw new IOException("Error al enviar correo: " + response.getBody());
            }

            log.info("Correo enviado exitosamente a: {}", alumno.getCorreo());
        } catch (IOException ex) {
            log.error("Excepción al enviar correo: {}", ex.getMessage(), ex);
            throw new IOException("Error al enviar correo con QR: " + ex.getMessage(), ex);
        }
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

    private String construirContenidoEmail(Alumno alumno, String qrBase64) {
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
                ".qr-container { text-align: center; padding: 20px; background-color: #fdf2f6; border-radius: 10px; margin: 20px 0; border-left: 5px solid #8B0A50; }" +
                ".footer { text-align: center; margin-top: 30px; padding: 20px; color: #8B0A50; font-size: 14px; border-top: 2px solid #f0e0e7; }" +
                ".success { color: #8B0A50; font-weight: bold; font-size: 16px; }" +
                ".nombre-alumno { font-size: 20px; color: #8B0A50; font-weight: bold; margin: 15px 0; text-align: center; }" +
                ".datos-label { color: #8B0A50; font-weight: 600; }" +
                ".datos-valor { color: #333; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<div class='container'>" +
                "<div class='header'>" +
                "<h1>✓ Registro Exitoso</h1>" +
                "<p>Sistema de Registro de Alumnos</p>" +
                "</div>" +
                "<div class='content'>" +
                "<p>Hola <strong class='nombre-alumno'>" + alumno.getNombre() + "</strong>,</p>" +
                "<p class='success'>✓ Tu registro ha sido completado exitosamente.</p>" +
                "<p>Aquí están los detalles de tu registro:</p>" +
                "<div class='info'>" +
                "<p><strong>📚 Carrera:</strong> " + alumno.getCarrera() + "</p>" +
                "<p><strong>📊 Grado:</strong> " + alumno.getGrado() + "°</p>" +
                "<p><strong>📖 Materia:</strong> " + alumno.getMateria() + "</p>" +
                "<p><strong>👥 Grupo:</strong> " + alumno.getGrupo() + "</p>" +
                "<p><strong>🎫 Número de Boleta:</strong> " + alumno.getBoleta() + "</p>" +
                "<p><strong>📧 Correo:</strong> " + alumno.getCorreo() + "</p>" +
                "<p><strong>📅 Fecha de Registro:</strong> " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'a las' HH:mm")) + "</p>" +
                "</div>" +
                "<div class='qr-container'>" +
                "<h3 style='color: #8B0A50; margin-top: 0;'>Tu Código QR</h3>" +
                "<img src='data:image/png;base64," + qrBase64 + "' alt='Código QR' width='200' height='200' style='border: 3px solid #8B0A50; border-radius: 10px; display: block; margin: 15px auto;' />" +
                "<p style='color: #666; font-size: 14px;'>Guarda este código QR para registrar tu asistencia</p>" +
                "</div>" +
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

    public void enviarCodigo(String destino, String codigo) {
        log.info("Iniciando envío de código de verificación a: {}", destino);
        log.info("Usando FROM: {} <{}>", fromName, fromEmail);

        try {
            SendGrid sg = new SendGrid(sendGridApiKey);

            Email from = new Email(fromEmail, fromName);
            Email to = new Email(destino);
            String subject = "Código de verificación - Control de Asistencia IPN";

            String htmlTemplate = String.format("""
                <html>
                <head>
                    <meta charset='UTF-8'>
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 0; margin: 0; }
                        .container { max-width: 600px; margin: 20px auto; background: #ffffff;
                                     border-radius: 12px; overflow: hidden;
                                     box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                        .header { background: #6B0026; color: white; padding: 25px; text-align: center; }
                        .header h1 { margin: 0; font-size: 22px; }
                        .content { padding: 25px; color: #333; }
                        .code-box { background: #8A0042; color: white; padding: 15px;
                                    text-align: center; font-size: 28px; font-weight: bold;
                                    border-radius: 8px; margin: 20px 0; letter-spacing: 4px; }
                        .footer { text-align: center; font-size: 12px; padding: 15px;
                                  color: #777; background: #f1e7ea; }
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>Control de Asistencia · IPN</h1>
                        </div>

                        <div class='content'>
                            <p>Hola,</p>
                            <p>Tu código de verificación es:</p>

                            <div class='code-box'>%s</div>

                            <p>Este código expira en <b>10 minutos</b>.</p>
                            <p>Si no solicitaste este código, puedes ignorar este mensaje.</p>
                        </div>

                        <div class='footer'>
                            © 2025 Instituto Politécnico Nacional — Mensaje automático
                        </div>
                    </div>
                </body>
                </html>
                """, codigo);

            Content content = new Content("text/html", htmlTemplate);
            Mail mail = new Mail(from, subject, to, content);

            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            log.info("Enviando código de verificación a SendGrid...");
            Response response = sg.api(request);

            log.info("Respuesta SendGrid (código) - Status: {}", response.getStatusCode());
            log.info("Respuesta SendGrid (código) - Body: {}", response.getBody());

            if (response.getStatusCode() >= 400) {
                log.error("Error al enviar código. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
            } else {
                log.info("Código de verificación enviado exitosamente a: {}", destino);
            }

        } catch (IOException e) {
            log.error("Excepción al enviar código de verificación: {}", e.getMessage(), e);
        }
    }
}
