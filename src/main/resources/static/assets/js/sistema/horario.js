$(document).ready(function() {

    // Mostrar Mi Horario y ocultar Dashboard
    $('#linkMiHorario').click(function(e) {
        e.preventDefault();
        $('#dashboardPrincipal').hide();
        $('#contentMiHorario').show();
    });

    // Botón para regresar al Dashboard
    $('#btnRegresarDashboard').click(function() {
        $('#contentMiHorario').hide();
        $('#dashboardPrincipal').show();
    });

    // Manejar subida de imagen con AJAX
    $('#formHorario').submit(function(e) {
        e.preventDefault();
        var formData = new FormData(this);

        $.ajax({
            url: '/ruta/para/subir/imagen', // reemplaza con tu backend
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(respuesta) {
                $('#respuestaHorario').html('<p class="text-success">Archivo subido correctamente.</p>');
            },
            error: function() {
                $('#respuestaHorario').html('<p class="text-danger">Error al subir el archivo.</p>');
            }
        });
    });

});
