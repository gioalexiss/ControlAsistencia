$(document).ready(function() {

    // Mostrar "Mi Horario" y ocultar el Dashboard
    $('#linkMiHorario').click(function(e) {
        e.preventDefault();
        $('#dashboardPrincipal').hide();
        $('#contentMiHorario').fadeIn();
    });

    // Botón para regresar al Dashboard
    $('#btnRegresarDashboard').click(function() {
        $('#contentMiHorario').fadeOut(function() {
            $('#dashboardPrincipal').fadeIn();
        });
    });

    // ---- DRAG & DROP ----
    const dropArea = document.getElementById("dropArea");
    const fileInput = document.getElementById("imagenHorario");

    // Arrastrar sobre el área
    dropArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropArea.classList.add("drag-over");
    });

    // Salir del área
    dropArea.addEventListener("dragleave", () => {
        dropArea.classList.remove("drag-over");
    });

    // Soltar archivo
    dropArea.addEventListener("drop", (e) => {
        e.preventDefault();
        dropArea.classList.remove("drag-over");
        const files = e.dataTransfer.files;
        fileInput.files = files; // Asignar el archivo al input oculto
    });

    // Click en el área → abrir selector de archivos
    dropArea.addEventListener("click", () => {
        fileInput.click();
    });

    // ---- SUBIDA CON AJAX ----
    $('#formHorario').submit(function(e) {
        e.preventDefault();

        if (!fileInput.files.length) {
            $('#respuestaHorario').html('<p class="text-danger">⚠️ Por favor selecciona un archivo antes de continuar.</p>');
            return;
        }

        const formData = new FormData(this);

        $.ajax({
            url: '/horarios/procesar',  // Endpoint del backend
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function() {
                $('#respuestaHorario').html('<p class="text-info">Procesando archivo... ⏳</p>');
                $('#tablaHorario').empty();
            },
            success: function(data) {
                $('#respuestaHorario').html('<p class="text-success">Horario procesado correctamente ✅</p>');

                // Generar tabla con los datos del backend
                if (data.length === 0) {
                    $('#tablaHorario').html('<p class="text-warning">No se detectaron horarios válidos en el archivo.</p>');
                    return;
                }

                let tabla = `
                    <table class="table table-bordered mt-3 text-center align-middle">
                        <thead class="table-primary">
                            <tr>
                                <th>Hora</th>
                                <th>Lunes</th>
                                <th>Martes</th>
                                <th>Miércoles</th>
                                <th>Jueves</th>
                                <th>Viernes</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                let horas = [...new Set(data.map(h => h.hora))];
                for (let h of horas) {
                    tabla += `<tr><td><strong>${h}</strong></td>`;
                    for (let dia of ['Lunes','Martes','Miércoles','Jueves','Viernes']) {
                        let materia = data.find(x => x.dia === dia && x.hora === h);
                        tabla += `<td>${materia ? materia.materia : '-'}</td>`;
                    }
                    tabla += '</tr>';
                }
                tabla += '</tbody></table>';
                $('#tablaHorario').html(tabla);
            },
            error: function() {
                $('#respuestaHorario').html('<p class="text-danger">❌ Error al procesar el archivo. Inténtalo de nuevo.</p>');
            }
        });
    });

});
