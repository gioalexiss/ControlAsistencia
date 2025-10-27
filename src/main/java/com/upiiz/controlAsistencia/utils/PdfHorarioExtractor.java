package com.upiiz.controlAsistencia.utils;

import com.upiiz.controlAsistencia.models.HorarioModel;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.*;
import java.util.regex.*;

@Component
public class PdfHorarioExtractor {

    public List<HorarioModel> extraerHorarios(File pdfFile) {
        List<HorarioModel> lista = new ArrayList<>();

        try (PDDocument document = PDDocument.load(pdfFile)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String texto = stripper.getText(document);

            // Divide el texto en bloques por materia
            String[] bloques = texto.split("(?=\\d{1,2}CM\\d\\s+[A-Z0-9-]+\\s+-)");

            for (String bloque : bloques) {
                if (bloque.trim().isEmpty()) continue;

                // 1️⃣ Extraer materia y profesor
                Pattern header = Pattern.compile("\\d{1,2}CM\\d\\s+[A-Z0-9-]+\\s+-\\s+([A-ZÁÉÍÓÚÑ\\s]+)\\s+\\d{1,2}\\.\\d{2}\\s+([A-ZÁÉÍÓÚÑ\\s]+)");
                Matcher mh = header.matcher(bloque);
                String materia = "Materia desconocida";
                String profesor = "";

                if (mh.find()) {
                    materia = mh.group(1).trim();
                    profesor = mh.group(2).trim();
                }

                // 2️⃣ Extraer las horas (ej. 13:00 - 14:30)
                Pattern horas = Pattern.compile("(\\d{2}:\\d{2}\\s*-\\s*\\d{2}:\\d{2})");
                Matcher matcherHoras = horas.matcher(bloque);
                int index = 0;
                String[] dias = {"Lunes", "Martes", "Miércoles", "Jueves", "Viernes"};

                while (matcherHoras.find() && index < dias.length) {
                    String hora = matcherHoras.group(1);
                    String dia = dias[index];
                    index++;
                    lista.add(new HorarioModel(dia, hora, materia + " (" + profesor + ")"));
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return lista;
    }
}
