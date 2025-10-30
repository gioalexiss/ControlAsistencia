$(document).ready(function() {

    function mostrarSeccion(seccionID) {
        // Oculta todas las secciones
        $('#dashboardPrincipal, #contentMisGrupos, #contentTomarAsistencia, #contentReportes, #contentMiHorario').hide();
        // Muestra solo la sección seleccionada
        $(seccionID).show();
    }

    // Manejar clicks en la barra lateral
    $('#linkDashboard').click(function(e){ e.preventDefault(); mostrarSeccion('#dashboardPrincipal'); });
    $('#linkMisGrupos').on('click', function(e) {
        e.preventDefault();
        // Redirigir a la página de grupos
        window.location.href = '/grupos';
});
    $('#linkTomarAsistencia').click(function(e){ e.preventDefault(); mostrarSeccion('#contentTomarAsistencia'); });
    $('#linkReportes').click(function(e){ e.preventDefault(); mostrarSeccion('#contentReportes'); });
    $('#linkMiHorario').click(function(e){ e.preventDefault(); mostrarSeccion('#contentMiHorario'); });

    // Inicializa mostrando el panel principal
    mostrarSeccion('#dashboardPrincipal');
});
