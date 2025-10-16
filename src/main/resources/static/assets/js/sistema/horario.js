$(document).ready(function() {
    // Mostrar Mi Horario y ocultar otros contenidos
    $('#linkMiHorario').click(function() {
        $('.content-body > div').hide();  // Oculta todo dentro de content-body
        $('#contentMiHorario').show();    // Muestra Mi Horario
    });

    // Manejar subida de imagen con AJAX
    $('#formHorario').submit(function(e) {
        e.preventDefault();
        var formData = new FormData();
        formData.append("imagenHorario", $('#imagenHorario')[0].files[0]);

        $.ajax({
            url: '/horarios/procesar',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(data) {
                let tabla = '<table border="1" cellspacing="0" cellpadding="5"><tr><th>Hora</th><th>Lunes</th><th>Martes</th><th>Miércoles</th><th>Jueves</th><th>Viernes</th></tr>';
                let horas = [...new Set(data.map(h => h.hora))];
                for (let h of horas) {
                    tabla += `<tr><td>${h}</td>`;
                    for (let dia of ['Lunes','Martes','Miércoles','Jueves','Viernes']) {
                        let materia = data.find(x => x.dia === dia && x.hora === h);
                        tabla += `<td>${materia ? materia.materia : ''}</td>`;
                    }
                    tabla += '</tr>';
                }
                tabla += '</table>';
                $('#tablaHorario').html(tabla);
            }
        });
    });
});
