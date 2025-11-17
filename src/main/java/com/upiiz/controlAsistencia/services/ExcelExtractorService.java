package com.upiiz.controlAsistencia.services;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class ExcelExtractorService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@(.+)$"
    );

    private static final Pattern BOLETA_PATTERN = Pattern.compile("\\d{10,12}");

    /**
     * Extrae datos de estudiantes desde un archivo Excel
     * Espera columnas: Boleta, Nombre, Correo (en cualquier orden)
     */
    public List<Map<String, String>> extraerDatosDeExcel(MultipartFile file) throws IOException {
        List<Map<String, String>> estudiantes = new ArrayList<>();

        if (!esArchivoExcelValido(file)) {
            throw new IllegalArgumentException("El archivo debe ser un Excel válido (.xlsx o .xls)");
        }

        Workbook workbook = null;
        try {
            // Determinar el tipo de archivo Excel
            String filename = file.getOriginalFilename();
            if (filename != null && filename.endsWith(".xlsx")) {
                workbook = new XSSFWorkbook(file.getInputStream());
            } else if (filename != null && filename.endsWith(".xls")) {
                workbook = new HSSFWorkbook(file.getInputStream());
            } else {
                throw new IllegalArgumentException("Formato de archivo no soportado");
            }

            Sheet sheet = workbook.getSheetAt(0); // Primera hoja

            // Leer encabezados de la primera fila
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new IllegalArgumentException("El archivo Excel está vacío");
            }

            Map<String, Integer> columnIndices = identificarColumnas(headerRow);

            // Validar que se encontraron las columnas necesarias
            if (!columnIndices.containsKey("boleta") ||
                !columnIndices.containsKey("nombre") ||
                !columnIndices.containsKey("correo")) {
                throw new IllegalArgumentException(
                    "El archivo Excel debe contener las columnas: Boleta, Nombre y Correo"
                );
            }

            // Leer los datos de cada fila (empezando desde la segunda)
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                Map<String, String> estudiante = new HashMap<>();

                // Extraer boleta
                String boleta = obtenerValorCelda(row, columnIndices.get("boleta"));
                if (boleta == null || boleta.trim().isEmpty()) {
                    continue; // Saltar filas sin boleta
                }

                // Extraer nombre
                String nombre = obtenerValorCelda(row, columnIndices.get("nombre"));
                if (nombre == null || nombre.trim().isEmpty()) {
                    continue; // Saltar filas sin nombre
                }

                // Extraer correo
                String correo = obtenerValorCelda(row, columnIndices.get("correo"));
                if (correo == null || correo.trim().isEmpty()) {
                    continue; // Saltar filas sin correo
                }

                // Validar formato de boleta y correo
                if (!BOLETA_PATTERN.matcher(boleta.trim()).matches()) {
                    System.out.println("Boleta inválida en fila " + (i + 1) + ": " + boleta);
                    continue;
                }

                if (!EMAIL_PATTERN.matcher(correo.trim()).matches()) {
                    System.out.println("Correo inválido en fila " + (i + 1) + ": " + correo);
                    continue;
                }

                estudiante.put("boleta", boleta.trim());
                estudiante.put("nombre", nombre.trim());
                estudiante.put("correo", correo.trim().toLowerCase());

                estudiantes.add(estudiante);
            }

        } finally {
            if (workbook != null) {
                workbook.close();
            }
        }

        return estudiantes;
    }

    /**
     * Identifica las columnas del Excel buscando los encabezados
     */
    private Map<String, Integer> identificarColumnas(Row headerRow) {
        Map<String, Integer> indices = new HashMap<>();

        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            Cell cell = headerRow.getCell(i);
            if (cell != null) {
                String header = cell.getStringCellValue().toLowerCase().trim();

                if (header.contains("boleta") || header.contains("matricula")) {
                    indices.put("boleta", i);
                } else if (header.contains("nombre")) {
                    indices.put("nombre", i);
                } else if (header.contains("correo") || header.contains("email") || header.contains("mail")) {
                    indices.put("correo", i);
                }
            }
        }

        return indices;
    }

    /**
     * Obtiene el valor de una celda como String
     */
    private String obtenerValorCelda(Row row, Integer columnIndex) {
        if (columnIndex == null) return null;

        Cell cell = row.getCell(columnIndex);
        if (cell == null) return null;

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                // Si es un número, convertirlo a string (para boletas numéricas)
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    // Formatear como número entero si no tiene decimales
                    double numValue = cell.getNumericCellValue();
                    if (numValue == Math.floor(numValue)) {
                        return String.valueOf((long) numValue);
                    }
                    return String.valueOf(numValue);
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return null;
        }
    }

    /**
     * Valida que el archivo sea un Excel válido
     */
    private boolean esArchivoExcelValido(MultipartFile file) {
        if (file.isEmpty()) {
            return false;
        }

        String filename = file.getOriginalFilename();
        if (filename == null) {
            return false;
        }

        return filename.endsWith(".xlsx") || filename.endsWith(".xls");
    }
}
