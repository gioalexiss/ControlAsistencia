/**
 * PDF Processor - Sistema de Extracción de Datos de Estudiantes
 * Extrae: Boleta, Nombre y Correo Electrónico de archivos PDF
 */

let selectedFile = null;
let extractedStudents = [];

$(document).ready(function() {
    initializePDFProcessor();
});

/**
 * Inicializa todos los event listeners
 */
function initializePDFProcessor() {
    const uploadArea = $('#uploadArea');
    const fileInput = $('#pdfFileInput');
    const btnSelectPDF = $('#btnSelectPDF');
    const btnClearFile = $('#btnClearFile');
    const btnProcessPDF = $('#btnProcessPDF');
    const btnSaveStudents = $('#btnSaveStudents');
    const btnExportCSV = $('#btnExportCSV');
    const selectAll = $('#selectAll');

    // Click en el área de carga
    uploadArea.on('click', function() {
        fileInput.click();
    });

    // Click en botón seleccionar
    btnSelectPDF.on('click', function(e) {
        e.stopPropagation();
        fileInput.click();
    });

    // Drag and Drop
    uploadArea.on('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).css({
            'border-color': '#0056b3',
            'background-color': '#e7f3ff'
        });
    });

    uploadArea.on('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).css({
            'border-color': '#1E90FF',
            'background-color': '#f8f9fa'
        });
    });

    uploadArea.on('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).css({
            'border-color': '#1E90FF',
            'background-color': '#f8f9fa'
        });

        const files = e.originalEvent.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            handleFileSelect(files[0]);
        } else {
            showAlert('Por favor, arrastra un archivo PDF válido', 'warning');
        }
    });

    // Selección de archivo
    fileInput.on('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // Cancelar archivo
    btnClearFile.on('click', function() {
        clearFileSelection();
    });

    // Procesar PDF
    btnProcessPDF.on('click', function() {
        if (selectedFile) {
            processPDF(selectedFile);
        }
    });

    // Guardar estudiantes
    btnSaveStudents.on('click', function() {
        saveStudentsList();
    });

    // Exportar CSV
    btnExportCSV.on('click', function() {
        exportToCSV();
    });

    // Seleccionar todos
    selectAll.on('change', function() {
        const isChecked = $(this).prop('checked');
        $('#tbodyEstudiantes input[type="checkbox"]').prop('checked', isChecked);
    });
}

/**
 * Maneja la selección de archivo
 */
function handleFileSelect(file) {
    if (file.type !== 'application/pdf') {
        showAlert('Por favor, selecciona un archivo PDF válido', 'warning');
        return;
    }

    selectedFile = file;
    const fileSize = formatFileSize(file.size);

    $('#fileName').text(file.name);
    $('#fileSize').text(fileSize);
    $('#fileInfo').slideDown();
}

/**
 * Limpia la selección de archivo
 */
function clearFileSelection() {
    selectedFile = null;
    $('#pdfFileInput').val('');
    $('#fileInfo').slideUp();
    $('#extractedDataContainer').slideUp();
    extractedStudents = [];
}

/**
 * Procesa el PDF y extrae los datos
 */
async function processPDF(file) {
    try {
        // Mostrar progreso
        $('#progressContainer').slideDown();
        updateProgress(10, 'Cargando archivo PDF...');

        // Leer el archivo como ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        updateProgress(30, 'Leyendo contenido del PDF...');

        // Cargar el PDF con pdf.js
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        updateProgress(40, `Procesando ${numPages} página(s)...`);

        let fullText = '';

        // Extraer texto de todas las páginas
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';

            const progress = 40 + (pageNum / numPages * 40);
            updateProgress(progress, `Extrayendo texto de página ${pageNum}/${numPages}...`);
        }

        updateProgress(85, 'Analizando datos de estudiantes...');

        // Extraer información de estudiantes
        extractedStudents = extractStudentData(fullText);

        updateProgress(100, 'Proceso completado!');

        // Mostrar resultados
        setTimeout(() => {
            $('#progressContainer').slideUp();
            displayExtractedData(extractedStudents);
        }, 500);

    } catch (error) {
        console.error('Error al procesar PDF:', error);
        $('#progressContainer').slideUp();
        showAlert('Error al procesar el PDF: ' + error.message, 'danger');
    }
}

/**
 * Extrae datos de estudiantes del texto del PDF
 * Busca patrones de: Boleta, Nombre y Correo
 */
function extractStudentData(text) {
    const students = [];
    const lines = text.split('\n');

    // Expresiones regulares para detectar datos
    const boletaRegex = /\b(\d{10}|\d{8})\b/g; // Boleta: 8-10 dígitos
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g; // Email
    const nameRegex = /\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,4})\b/g; // Nombre completo

    // Método 1: Buscar por líneas estructuradas
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const boletas = line.match(boletaRegex);
        const emails = line.match(emailRegex);
        const names = line.match(nameRegex);

        if (boletas && emails) {
            // Si encontramos boleta y email en la misma línea
            students.push({
                boleta: boletas[0],
                nombre: names ? names.join(' ') : 'Sin nombre',
                correo: emails[0]
            });
        }
    }

    // Método 2: Si no encontró con el método 1, intentar búsqueda global
    if (students.length === 0) {
        const allBoletas = [...new Set(text.match(boletaRegex) || [])];
        const allEmails = [...new Set(text.match(emailRegex) || [])];
        const allNames = [...new Set(text.match(nameRegex) || [])];

        const maxLength = Math.max(allBoletas.length, allEmails.length, allNames.length);

        for (let i = 0; i < maxLength; i++) {
            students.push({
                boleta: allBoletas[i] || 'Sin boleta',
                nombre: allNames[i] || 'Sin nombre',
                correo: allEmails[i] || 'sin@correo.com'
            });
        }
    }

    // Método 3: Búsqueda por tabla (común en PDFs)
    if (students.length === 0) {
        const tableData = extractTableData(text);
        if (tableData.length > 0) {
            return tableData;
        }
    }

    // Eliminar duplicados por boleta
    const uniqueStudents = [];
    const seenBoletas = new Set();

    for (const student of students) {
        if (!seenBoletas.has(student.boleta) && student.boleta !== 'Sin boleta') {
            seenBoletas.add(student.boleta);
            uniqueStudents.push(student);
        }
    }

    return uniqueStudents;
}

/**
 * Intenta extraer datos si están en formato de tabla
 */
function extractTableData(text) {
    const students = [];
    const lines = text.split('\n');

    // Buscar encabezados comunes
    const headerPatterns = ['boleta', 'nombre', 'correo', 'email', 'matricula'];
    let headerIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        const matchCount = headerPatterns.filter(pattern => line.includes(pattern)).length;

        if (matchCount >= 2) {
            headerIndex = i;
            break;
        }
    }

    if (headerIndex >= 0) {
        // Procesar líneas después del encabezado
        for (let i = headerIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(/\s{2,}|\t/); // Split por múltiples espacios o tabs

            if (parts.length >= 3) {
                const boleta = parts.find(p => /^\d{8,10}$/.test(p));
                const email = parts.find(p => /@/.test(p));
                const nombre = parts.find(p => /^[A-ZÁÉÍÓÚÑ]/.test(p) && p !== boleta && p !== email);

                if (boleta || email) {
                    students.push({
                        boleta: boleta || 'Sin boleta',
                        nombre: nombre || 'Sin nombre',
                        correo: email || 'sin@correo.com'
                    });
                }
            }
        }
    }

    return students;
}

/**
 * Muestra los datos extraídos en la tabla
 */
function displayExtractedData(students) {
    const tbody = $('#tbodyEstudiantes');
    tbody.empty();

    if (students.length === 0) {
        $('#extractedDataContainer').slideUp();
        showAlert('No se encontraron datos de estudiantes en el PDF. Verifica que el formato sea correcto.', 'warning');
        return;
    }

    students.forEach((student, index) => {
        const row = `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td><strong>${student.boleta}</strong></td>
                <td>${student.nombre}</td>
                <td>${student.correo}</td>
                <td class="text-center">
                    <input type="checkbox" class="student-checkbox" checked>
                </td>
            </tr>
        `;
        tbody.append(row);
    });

    $('#totalExtracted').text(`${students.length} estudiante${students.length !== 1 ? 's' : ''}`);
    $('#extractedDataContainer').slideDown();

    showAlert(`Se extrajeron ${students.length} estudiantes correctamente`, 'success');
}

/**
 * Guarda la lista de estudiantes (simulación - conectar con backend)
 */
function saveStudentsList() {
    const selectedStudents = [];

    $('#tbodyEstudiantes tr').each(function(index) {
        if ($(this).find('input[type="checkbox"]').prop('checked')) {
            selectedStudents.push(extractedStudents[index]);
        }
    });

    if (selectedStudents.length === 0) {
        showAlert('Selecciona al menos un estudiante para guardar', 'warning');
        return;
    }

    // Aquí conectarías con tu backend para guardar
    console.log('Estudiantes a guardar:', selectedStudents);

    showAlert(`Se guardaron ${selectedStudents.length} estudiantes correctamente`, 'success');

    // Ejemplo de llamada AJAX (descomentar cuando tengas el endpoint)
    /*
    $.ajax({
        url: '/api/estudiantes/guardar',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(selectedStudents),
        success: function(response) {
            showAlert('Estudiantes guardados correctamente', 'success');
        },
        error: function(error) {
            showAlert('Error al guardar estudiantes', 'danger');
        }
    });
    */
}

/**
 * Exporta los datos a CSV
 */
function exportToCSV() {
    if (extractedStudents.length === 0) {
        showAlert('No hay datos para exportar', 'warning');
        return;
    }

    // Crear contenido CSV
    let csv = 'Boleta,Nombre Completo,Correo Electrónico\n';

    $('#tbodyEstudiantes tr').each(function(index) {
        if ($(this).find('input[type="checkbox"]').prop('checked')) {
            const student = extractedStudents[index];
            csv += `${student.boleta},"${student.nombre}",${student.correo}\n`;
        }
    });

    // Crear blob y descargar
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `estudiantes_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert('CSV exportado correctamente', 'success');
}

/**
 * Actualiza la barra de progreso
 */
function updateProgress(percent, text) {
    $('#progressBar').css('width', percent + '%').text(Math.round(percent) + '%');
    $('#progressText').text(text);
}

/**
 * Muestra una alerta
 */
function showAlert(message, type) {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <strong>${type === 'success' ? '¡Éxito!' : type === 'warning' ? 'Advertencia' : 'Error'}:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    // Insertar alerta antes del área de carga
    $('.upload-area').before(alertHtml);

    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        $('.alert').fadeOut(function() {
            $(this).remove();
        });
    }, 5000);
}

/**
 * Formatea el tamaño del archivo
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
