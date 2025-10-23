$(document).ready(function() {

    function mostrarSeccion(seccionID) {
        // Oculta todas las secciones
        $('#dashboardPrincipal, #contentMisGrupos, #contentTomarAsistencia, #contentReportes, #contentMiHorario').hide();
        // Muestra solo la sección seleccionada
        $(seccionID).show();
    }

    // Manejar clicks en la barra lateral
    $('#linkDashboard').click(function(e){ e.preventDefault(); mostrarSeccion('#dashboardPrincipal'); });
    $('#linkMisGrupos').click(function(e){ e.preventDefault(); mostrarSeccion('#contentMisGrupos'); });
    $('#linkTomarAsistencia').click(function(e){ e.preventDefault(); mostrarSeccion('#contentTomarAsistencia'); });
    $('#linkReportes').click(function(e){ e.preventDefault(); mostrarSeccion('#contentReportes'); });
    $('#linkMiHorario').click(function(e){ e.preventDefault(); mostrarSeccion('#contentMiHorario'); });

    // Inicializa mostrando el panel principal
    mostrarSeccion('#dashboardPrincipal');
});
