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

    // Drag & Drop
    const dropArea = document.getElementById("dropArea");

    dropArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropArea.classList.add("drag-over");
    });

    dropArea.addEventListener("dragleave", () => {
        dropArea.classList.remove("drag-over");
    });

    dropArea.addEventListener("drop", (e) => {
        e.preventDefault();
        dropArea.classList.remove("drag-over");
        const files = e.dataTransfer.files;
        document.getElementById("imagenHorario").files = files;
    });

    // Manejar subida de imagen/PDF con AJAX
    $('#formHorario').submit(function(e) {
        e.preventDefault();
        var formData = new FormData(this);

        $.ajax({
            url: '/horarios/procesar',  // tu endpoint real
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function() {
                $('#respuestaHorario').html('<p class="text-info">Procesando archivo...</p>');
            },
            success: function(data) {
                $('#respuestaHorario').html('<p class="text-success">Horario procesado correctamente ✅</p>');

                // Generar tabla
                let tabla = '<table class="table table-bordered mt-3"><thead><tr><th>Hora</th><th>Lunes</th><th>Martes</th><th>Miércoles</th><th>Jueves</th><th>Viernes</th></tr></thead><tbody>';
                let horas = [...new Set(data.map(h => h.hora))];
                for (let h of horas) {
                    tabla += `<tr><td>${h}</td>`;
                    for (let dia of ['Lunes','Martes','Miércoles','Jueves','Viernes']) {
                        let materia = data.find(x => x.dia === dia && x.hora === h);
                        tabla += `<td>${materia ? materia.materia : ''}</td>`;
                    }
                    tabla += '</tr>';
                }
                tabla += '</tbody></table>';
                $('#tablaHorario').html(tabla);
            },
            error: function() {
                $('#respuestaHorario').html('<p class="text-danger">Error al procesar el archivo.</p>');
            }
        });
    });

});
