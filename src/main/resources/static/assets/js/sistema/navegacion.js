$(document).ready(function() {

    function mostrarSeccion(seccionID, linkActivo) {
        // Oculta todas las secciones
        $('#dashboardPrincipal, #contentMisGrupos, #contentMisEstudiantes, #contentTomarAsistencia, #contentReportes, #contentMiHorario').hide();

        // Remueve la clase 'active' de todos los links del menú
        $('#menu a').removeClass('active');

        // Cambia todos los iconos SVG a color gris
        $('#menu .svg-icon-path').attr('stroke', '#888888');

        // Agrega la clase 'active' al link seleccionado
        $(linkActivo).addClass('active');

        // Cambia los iconos SVG del link activo a color azul
        $(linkActivo).find('.svg-icon-path').attr('stroke', '#1E90FF');

        // Muestra solo la sección seleccionada
        $(seccionID).show();
    }

    // Manejar clicks en la barra lateral
    $('#linkDashboard').click(function(e){
        e.preventDefault();
        mostrarSeccion('#dashboardPrincipal', this);
    });

    $('#linkMisGrupos').click(function(e){
        e.preventDefault();
        mostrarSeccion('#contentMisGrupos', this);
    });

    $('#linkMisEstudiantes').click(function(e){
        e.preventDefault();
        mostrarSeccion('#contentMisEstudiantes', this);
        // Inicializar gestor de estudiantes si existe
        if (window.estudianteManager && typeof window.estudianteManager.init === 'function') {
            window.estudianteManager.init();
        }
    });

    $('#linkTomarAsistencia').click(function(e){
        e.preventDefault();
        mostrarSeccion('#contentTomarAsistencia', this);
        // Inicializar gestor de asistencia si existe
        if (window.asistenciaManager && typeof window.asistenciaManager.init === 'function') {
            window.asistenciaManager.init();
        }
    });

    $('#linkReportes').click(function(e){
        e.preventDefault();
        mostrarSeccion('#contentReportes', this);
    });

    // IMPORTANTE: El handler de #linkMiHorario también se maneja aquí para la navegación
    // La carga de datos específica se maneja en horario.js
    $('#linkMiHorario').click(function(e){
        e.preventDefault();
        mostrarSeccion('#contentMiHorario', this);
        // Disparar evento personalizado para que horario.js cargue datos si es necesario
        $(document).trigger('horarioSeccionMostrada');
    });

    // Inicializa mostrando el panel principal con clase active
    mostrarSeccion('#dashboardPrincipal', '#linkDashboard');
});