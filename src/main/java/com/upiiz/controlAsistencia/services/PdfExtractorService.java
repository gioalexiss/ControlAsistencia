package com.upiiz.controlAsistencia.services;

import com.upiiz.controlAsistencia.services.EstudianteService.EstudianteDTO;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PdfExtractorService {

    // Patrones regex para extraer información
    private static final Pattern BOLETA_PATTERN = Pattern.compile("\\b(\\d{10,12})\\b"); // Boletas de 10-12 dígitos
    private static final Pattern EMAIL_PATTERN = Pattern.compile("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b");
    private static final Pattern NOMBRE_PATTERN = Pattern.compile("([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)");

    /**
     * Extrae información de estudiantes desde un archivo PDF
     * @param file Archivo PDF subido
     * @return Lista de EstudianteDTO con los datos extraídos
     */
    public List<EstudianteDTO> extraerDatosDePDF(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("El archivo PDF está vacío");
        }

        // Leer el contenido del PDF
        String contenidoPDF = extraerTextoDePDF(file);

        // Extraer los datos estructurados
        return procesarContenidoPDF(contenidoPDF);
    }

    /**
     * Extrae el texto completo del PDF usando PDFBox
     */
    private String extraerTextoDePDF(MultipartFile file) throws IOException {
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    /**
     * Procesa el contenido del PDF y extrae los datos de estudiantes
     * Intenta identificar patrones de: boleta, nombre y correo
     */
    private List<EstudianteDTO> procesarContenidoPDF(String contenido) {
        List<EstudianteDTO> estudiantes = new ArrayList<>();

        // Dividir el contenido en líneas para procesarlo
        String[] lineas = contenido.split("\\r?\\n");

        // Variables para acumular información de un estudiante
        String boletaActual = null;
        String nombreActual = null;
        String correoActual = null;

        for (String linea : lineas) {
            linea = linea.trim();

            if (linea.isEmpty()) {
                // Si encontramos una línea vacía y tenemos datos, guardamos el estudiante
                if (boletaActual != null && nombreActual != null) {
                    estudiantes.add(new EstudianteDTO(boletaActual, nombreActual, correoActual));
                    boletaActual = null;
                    nombreActual = null;
                    correoActual = null;
                }
                continue;
            }

            // Buscar boleta en la línea
            Matcher boletaMatcher = BOLETA_PATTERN.matcher(linea);
            if (boletaMatcher.find() && boletaActual == null) {
                boletaActual = boletaMatcher.group(1);
            }

            // Buscar correo en la línea
            Matcher emailMatcher = EMAIL_PATTERN.matcher(linea);
            if (emailMatcher.find() && correoActual == null) {
                correoActual = emailMatcher.group();
            }

            // Buscar nombre en la línea (debe tener al menos 2 palabras con mayúscula inicial)
            Matcher nombreMatcher = NOMBRE_PATTERN.matcher(linea);
            if (nombreMatcher.find() && nombreActual == null) {
                String nombreEncontrado = nombreMatcher.group(1).trim();
                // Validar que tenga al menos 2 palabras
                if (nombreEncontrado.split("\\s+").length >= 2) {
                    nombreActual = nombreEncontrado;
                }
            }
        }

        // Agregar el último estudiante si quedó pendiente
        if (boletaActual != null && nombreActual != null) {
            estudiantes.add(new EstudianteDTO(boletaActual, nombreActual, correoActual));
        }

        return estudiantes;
    }

    /**
     * Método alternativo: procesa PDF con formato tabular
     * Útil cuando el PDF tiene una estructura de tabla clara
     */
    public List<EstudianteDTO> extraerDatosTabular(MultipartFile file) throws IOException {
        String contenido = extraerTextoDePDF(file);
        List<EstudianteDTO> estudiantes = new ArrayList<>();

        String[] lineas = contenido.split("\\r?\\n");

        for (String linea : lineas) {
            linea = linea.trim();

            // Buscar todas las coincidencias en la misma línea
            Matcher boletaMatcher = BOLETA_PATTERN.matcher(linea);
            Matcher emailMatcher = EMAIL_PATTERN.matcher(linea);
            Matcher nombreMatcher = NOMBRE_PATTERN.matcher(linea);

            String boleta = boletaMatcher.find() ? boletaMatcher.group(1) : null;
            String correo = emailMatcher.find() ? emailMatcher.group() : null;
            String nombre = null;

            if (nombreMatcher.find()) {
                String nombreEncontrado = nombreMatcher.group(1).trim();
                if (nombreEncontrado.split("\\s+").length >= 2) {
                    nombre = nombreEncontrado;
                }
            }

            // Si encontramos al menos boleta y nombre, agregamos el estudiante
            if (boleta != null && nombre != null) {
                estudiantes.add(new EstudianteDTO(boleta, nombre, correo));
            }
        }

        return estudiantes;
    }

    /**
     * Valida que el archivo sea un PDF
     */
    public boolean esArchivoValido(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();

        return (contentType != null && contentType.equals("application/pdf")) ||
               (filename != null && filename.toLowerCase().endsWith(".pdf"));
    }
}
