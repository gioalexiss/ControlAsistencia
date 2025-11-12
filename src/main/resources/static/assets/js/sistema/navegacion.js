$(document).ready(function() {

    function mostrarSeccion(seccionID) {
        // Oculta todas las secciones
        $('#dashboardPrincipal, #contentMisGrupos, #contentMisEstudiantes, #contentReportes, #contentMiHorario').hide();

        // Remueve la clase 'active' de todos los links del menú
        $('#menu a').removeClass('active');

        // Muestra solo la sección seleccionada
        $(seccionID).show();
    }

    // Manejar clicks en la barra lateral
    $('#linkDashboard').click(function(e){
        e.preventDefault();
        $(this).addClass('active');
        mostrarSeccion('#dashboardPrincipal');
    });

    $('#linkMisGrupos').click(function(e){
        e.preventDefault();
        $(this).addClass('active');
        mostrarSeccion('#contentMisGrupos');
    });

    $('#linkMisEstudiantes').click(function(e){
        e.preventDefault();
        $(this).addClass('active');
        mostrarSeccion('#contentMisEstudiantes');
    });

    $('#linkReportes').click(function(e){
        e.preventDefault();
        $(this).addClass('active');
        mostrarSeccion('#contentReportes');
    });

    $('#linkMiHorario').click(function(e){
        e.preventDefault();
        $(this).addClass('active');
        mostrarSeccion('#contentMiHorario');
    });

    // Inicializa mostrando el panel principal con clase active
    $('#linkDashboard').addClass('active');
    mostrarSeccion('#dashboardPrincipal');
});