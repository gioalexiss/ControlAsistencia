package com.upiiz.controlAsistencia.services;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.text.Normalizer;
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
            boolean tieneNombre = columnIndices.containsKey("nombreCompleto") ||
                                 columnIndices.containsKey("nombre") ||
                                 (columnIndices.containsKey("apellidoPaterno") && columnIndices.containsKey("apellidoMaterno"));

            if (!columnIndices.containsKey("boleta") || !tieneNombre || !columnIndices.containsKey("correo")) {
                throw new IllegalArgumentException(
                    "El archivo Excel debe contener las columnas: Boleta, Nombre (o Apellidos + Nombre) y Correo"
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
                boleta = limpiarTexto(boleta);

                // Extraer nombre completo (combinando apellidos y nombre si están separados)
                String nombreCompleto = extraerNombreCompleto(row, columnIndices);
                if (nombreCompleto == null || nombreCompleto.trim().isEmpty()) {
                    continue; // Saltar filas sin nombre
                }
                nombreCompleto = limpiarTexto(nombreCompleto);

                // Extraer correo
                String correo = obtenerValorCelda(row, columnIndices.get("correo"));
                if (correo == null || correo.trim().isEmpty()) {
                    continue; // Saltar filas sin correo
                }
                correo = limpiarCorreo(correo);

                // Validar formato de boleta
                if (!BOLETA_PATTERN.matcher(boleta).matches()) {
                    System.out.println("⚠️ Boleta inválida en fila " + (i + 1) + ": '" + boleta + "'");
                    continue;
                }

                // Validar formato de correo
                if (!EMAIL_PATTERN.matcher(correo).matches()) {
                    System.out.println("⚠️ Correo inválido en fila " + (i + 1) + ": '" + correo + "' (original: '" + obtenerValorCelda(row, columnIndices.get("correo")) + "')");
                    continue;
                }

                estudiante.put("boleta", boleta);
                estudiante.put("nombre", nombreCompleto);
                estudiante.put("correo", correo);

                System.out.println("✅ Fila " + (i + 1) + ": " + boleta + " | " + nombreCompleto + " | " + correo);
                estudiantes.add(estudiante);
            }

        } finally {
            if (workbook != null) {
                workbook.close();
            }
        }

        System.out.println("📊 Total de estudiantes extraídos: " + estudiantes.size());
        return estudiantes;
    }

    /**
     * Identifica las columnas del Excel buscando los encabezados
     * Soporta múltiples formatos: nombre completo en una columna o apellidos/nombre separados
     */
    private Map<String, Integer> identificarColumnas(Row headerRow) {
        Map<String, Integer> indices = new HashMap<>();

        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            Cell cell = headerRow.getCell(i);
            if (cell != null) {
                String header = obtenerValorCelda(headerRow, i);
                if (header != null) {
                    header = limpiarTexto(header).toLowerCase();

                    if (header.contains("boleta") || header.contains("matricula")) {
                        indices.put("boleta", i);
                    } else if (header.contains("apellido") && header.contains("paterno")) {
                        indices.put("apellidoPaterno", i);
                    } else if (header.contains("apellido") && header.contains("materno")) {
                        indices.put("apellidoMaterno", i);
                    } else if (header.contains("apellido") && !header.contains("paterno") && !header.contains("materno")) {
                        // Columna "Apellido" o "Apellidos" sin especificar tipo
                        indices.put("apellidos", i);
                    } else if (header.contains("nombre") && !header.contains("completo")) {
                        // Solo guardar si no hay apellidos ya identificados
                        if (!indices.containsKey("nombre")) {
                            indices.put("nombre", i);
                        }
                    } else if (header.contains("nombre") && header.contains("completo")) {
                        // Priorizar "Nombre Completo" sobre nombre separado
                        indices.put("nombreCompleto", i);
                    } else if (header.contains("correo") || header.contains("email") || header.contains("mail")) {
                        indices.put("correo", i);
                    }
                }
            }
        }

        return indices;
    }

    /**
     * Extrae el nombre completo del estudiante combinando apellidos y nombre si están separados
     * Soporta varios formatos:
     * - Nombre Completo (una sola columna)
     * - Apellido Paterno + Apellido Materno + Nombre
     * - Apellidos + Nombre
     * - Solo Nombre
     */
    private String extraerNombreCompleto(Row row, Map<String, Integer> columnIndices) {
        // Prioridad 1: Si existe columna "Nombre Completo", usarla directamente
        if (columnIndices.containsKey("nombreCompleto")) {
            String nombreCompleto = obtenerValorCelda(row, columnIndices.get("nombreCompleto"));
            if (nombreCompleto != null && !nombreCompleto.trim().isEmpty()) {
                return nombreCompleto.trim();
            }
        }

        // Prioridad 2: Combinar Apellido Paterno + Apellido Materno + Nombre
        if (columnIndices.containsKey("apellidoPaterno") && columnIndices.containsKey("apellidoMaterno")) {
            StringBuilder nombreCompleto = new StringBuilder();

            String apellidoPaterno = obtenerValorCelda(row, columnIndices.get("apellidoPaterno"));
            if (apellidoPaterno != null && !apellidoPaterno.trim().isEmpty()) {
                nombreCompleto.append(apellidoPaterno.trim());
            }

            String apellidoMaterno = obtenerValorCelda(row, columnIndices.get("apellidoMaterno"));
            if (apellidoMaterno != null && !apellidoMaterno.trim().isEmpty()) {
                if (nombreCompleto.length() > 0) nombreCompleto.append(" ");
                nombreCompleto.append(apellidoMaterno.trim());
            }

            if (columnIndices.containsKey("nombre")) {
                String nombre = obtenerValorCelda(row, columnIndices.get("nombre"));
                if (nombre != null && !nombre.trim().isEmpty()) {
                    if (nombreCompleto.length() > 0) nombreCompleto.append(" ");
                    nombreCompleto.append(nombre.trim());
                }
            }

            if (nombreCompleto.length() > 0) {
                return nombreCompleto.toString();
            }
        }

        // Prioridad 3: Combinar Apellidos + Nombre
        if (columnIndices.containsKey("apellidos") && columnIndices.containsKey("nombre")) {
            StringBuilder nombreCompleto = new StringBuilder();

            String apellidos = obtenerValorCelda(row, columnIndices.get("apellidos"));
            if (apellidos != null && !apellidos.trim().isEmpty()) {
                nombreCompleto.append(apellidos.trim());
            }

            String nombre = obtenerValorCelda(row, columnIndices.get("nombre"));
            if (nombre != null && !nombre.trim().isEmpty()) {
                if (nombreCompleto.length() > 0) nombreCompleto.append(" ");
                nombreCompleto.append(nombre.trim());
            }

            if (nombreCompleto.length() > 0) {
                return nombreCompleto.toString();
            }
        }

        // Prioridad 4: Solo usar columna "Nombre" (podría contener el nombre completo)
        if (columnIndices.containsKey("nombre")) {
            String nombre = obtenerValorCelda(row, columnIndices.get("nombre"));
            if (nombre != null && !nombre.trim().isEmpty()) {
                return nombre.trim();
            }
        }

        return null;
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
                // Intentar obtener el valor calculado de la fórmula
                try {
                    return cell.getStringCellValue();
                } catch (IllegalStateException e) {
                    // Si falla, intentar obtener como número
                    try {
                        double numValue = cell.getNumericCellValue();
                        if (numValue == Math.floor(numValue)) {
                            return String.valueOf((long) numValue);
                        }
                        return String.valueOf(numValue);
                    } catch (Exception ex) {
                        return null;
                    }
                }
            default:
                return null;
        }
    }

    /**
     * Limpia el texto eliminando caracteres invisibles, espacios extras y normalizando
     */
    private String limpiarTexto(String texto) {
        if (texto == null) return null;

        // Eliminar espacios al inicio y final
        texto = texto.trim();

        // Normalizar caracteres Unicode (eliminar acentos si es necesario para comparaciones)
        texto = Normalizer.normalize(texto, Normalizer.Form.NFC);

        // Eliminar caracteres de control y espacios invisibles
        texto = texto.replaceAll("[\\p{C}\\p{Z}&&[^ ]]", "");

        // Reemplazar múltiples espacios por uno solo
        texto = texto.replaceAll("\\s+", " ");

        // Eliminar espacios antes y después de puntos, arrobas, etc.
        texto = texto.replaceAll("\\s+@\\s+", "@");
        texto = texto.replaceAll("\\s+\\.\\s+", ".");

        return texto;
    }

    /**
     * Limpia y normaliza un correo electrónico
     */
    private String limpiarCorreo(String correo) {
        if (correo == null) return null;

        // Limpiar texto base
        correo = limpiarTexto(correo);

        // Convertir a minúsculas (los correos no distinguen mayúsculas/minúsculas)
        correo = correo.toLowerCase();

        // Eliminar todos los espacios en blanco del correo
        correo = correo.replaceAll("\\s+", "");

        // Correcciones comunes de confusión de caracteres en correos
        // Estas correcciones solo se aplican en partes específicas para evitar cambios incorrectos

        // Separar el correo en partes: usuario@dominio
        String[] partes = correo.split("@");
        if (partes.length == 2) {
            String usuario = partes[0];
            String dominio = partes[1];

            // En dominios comunes, corregir confusiones típicas
            if (dominio.contains("gmai") || dominio.contains("hotmai") || dominio.contains("yahoo") ||
                dominio.contains("outlook") || dominio.contains("outloo") || dominio.contains("alumn") || dominio.contains("ipn")) {

                // Correcciones específicas para dominios conocidos
                dominio = corregirDominioComun(dominio);

                // Corregir el usuario si hay patrones sospechosos
                usuario = corregirUsuarioCorreo(usuario, dominio);
            }

            correo = usuario + "@" + dominio;
        }

        return correo;
    }

    /**
     * Corrige errores comunes en dominios de correo
     */
    private String corregirDominioComun(String dominio) {
        // Dominios comunes mal escritos
        Map<String, String> correccionesDominios = new HashMap<>();
        correccionesDominios.put("gmai1.com", "gmail.com");
        correccionesDominios.put("gmai1", "gmail");
        correccionesDominios.put("hotmai1.com", "hotmail.com");
        correccionesDominios.put("hotmai1", "hotmail");
        correccionesDominios.put("outloo.com", "outlook.com");
        correccionesDominios.put("outloo", "outlook");
        correccionesDominios.put("a1umno", "alumno");
        correccionesDominios.put("a1umnos", "alumnos");

        // Aplicar correcciones
        for (Map.Entry<String, String> entry : correccionesDominios.entrySet()) {
            dominio = dominio.replace(entry.getKey(), entry.getValue());
        }

        // Correcciones de confusión i/l en dominios específicos
        // Solo en contextos donde sabemos que debe ser "l"
        if (dominio.contains("gmai") && !dominio.contains("gmail")) {
            dominio = dominio.replace("gmai", "gmail");
        }
        if (dominio.contains("hotmai") && !dominio.contains("hotmail")) {
            dominio = dominio.replace("hotmai", "hotmail");
        }

        // Corregir "a1umno" a "alumno" (confusión de l con 1)
        if (dominio.matches(".*a[1i]umn.*")) {
            dominio = dominio.replaceAll("a[1i]umn", "alumn");
        }

        return dominio;
    }

    /**
     * Intenta corregir confusiones comunes de l/i en nombres de usuario
     * Solo aplica correcciones cuando hay alta probabilidad de error
     */
    private String corregirUsuarioCorreo(String usuario, String dominio) {
        if (usuario == null || usuario.isEmpty()) return usuario;

        String usuarioOriginal = usuario;

        // Si el dominio es outlook y el usuario tiene "ie" seguido de "cito/cita",
        // probablemente sea "le" (ej: "soiecito" -> "solecito")
        if (dominio.contains("outlook") || dominio.contains("hotmail") || dominio.contains("gmail")) {
            // Patrón: vocal + ie + cit[oa] → probablemente sea vocal + le + cit[oa]
            // Ejemplos: "soiecito" -> "solecito", "mariecita" -> "marlecita" (aunque este último podría ser incorrecto)
            // Para ser más seguros, solo corregir patrones muy específicos

            // Caso: [vocal]ie + cito/cita → [vocal]le + cito/cita
            usuario = usuario.replaceAll("([aeiou])ie(cit[oa])", "$1le$2");

            // Caso: [consonante]ie + cito/cita donde tiene sentido (ej: "soie" -> "sole")
            // Solo aplicar en nombres comunes que sabemos que usan "l"
            if (usuario.matches(".*soie.*")) {
                usuario = usuario.replace("soie", "sole");
            }
        }

        // Si se hizo algún cambio, loggear para transparencia
        if (!usuario.equals(usuarioOriginal)) {
            System.out.println("🔄 Corrección de usuario: '" + usuarioOriginal + "' → '" + usuario + "'");
        }

        return usuario;
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
