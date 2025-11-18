/**
 * AsistenciaManager - Gestión de toma de asistencia con lector QR
 */
class AsistenciaManager {
    constructor() {
        this.docenteId = null;
        this.unidadSeleccionada = null;
        this.grupoSeleccionado = null;
        this.asistenciasHoy = [];
        this.ultimoEscaneo = null;
        this.soundSuccess = null;
        this.soundError = null;
    }

    async init() {
        console.log('🎯 Inicializando AsistenciaManager...');

        // Obtener ID del docente
        this.docenteId = localStorage.getItem('docenteId');
        if (!this.docenteId) {
            alert('Error: No se encontró el ID del docente');
            return;
        }

        // Inicializar componentes
        await this.cargarUnidades();
        await this.cargarGrupos();
        await this.cargarAsistenciasHoy();
        this.inicializarEventos();
        this.configurarInputQR();
        this.establecerFechaHoy();

        // Crear sonidos de feedback
        this.crearSonidosFeedback();

        console.log('✅ AsistenciaManager inicializado correctamente');
    }

    /**
     * Cargar las unidades (materias) del docente
     */
    async cargarUnidades() {
        try {
            const response = await fetch(`/horario/obtener/${this.docenteId}`);
            if (!response.ok) throw new Error('Error al cargar unidades');

            const unidades = await response.json();
            const select = $('#selectUnidadAsistencia');
            select.empty();
            select.append('<option value="">Seleccione una unidad (materia)</option>');

            unidades.forEach(unidad => {
                select.append(`<option value="${unidad.id}">${unidad.nombreUnidad}</option>`);
            });

            console.log(`📚 ${unidades.length} unidades cargadas`);
        } catch (error) {
            console.error('Error al cargar unidades:', error);
        }
    }

    /**
     * Cargar los grupos del docente
     */
    async cargarGrupos() {
        try {
            const response = await fetch(`/grupos/docente/${this.docenteId}`);
            if (!response.ok) throw new Error('Error al cargar grupos');

            const grupos = await response.json();
            const select = $('#selectGrupoAsistencia');
            select.empty();
            select.append('<option value="">Seleccione un grupo (opcional)</option>');

            grupos.forEach(grupo => {
                select.append(`<option value="${grupo.id}">${grupo.nombreGrupo}</option>`);
            });

            console.log(`👥 ${grupos.length} grupos cargados`);
        } catch (error) {
            console.error('Error al cargar grupos:', error);
        }
    }

    /**
     * Cargar asistencias del día actual
     */
    async cargarAsistenciasHoy() {
        try {
            const response = await fetch(`/asistencia/hoy/${this.docenteId}`);
            if (!response.ok) throw new Error('Error al cargar asistencias');

            this.asistenciasHoy = await response.json();
            this.actualizarContador();
            this.renderizarTablaAsistencias(this.asistenciasHoy);

            console.log(`✅ ${this.asistenciasHoy.length} asistencias hoy`);
        } catch (error) {
            console.error('Error al cargar asistencias:', error);
            this.asistenciasHoy = [];
            this.actualizarContador();
        }
    }

    /**
     * Configurar el input para captura de QR
     */
    configurarInputQR() {
        const input = $('#inputCodigoQR');

        // Auto-focus cuando se hace clic en cualquier parte
        $(document).on('click', '#contentTomarAsistencia', function() {
            input.focus();
        });

        // Procesar código cuando se presiona Enter
        input.on('keypress', async (e) => {
            if (e.which === 13) { // Enter key
                e.preventDefault();
                const codigoQR = input.val().trim();

                if (codigoQR) {
                    await this.procesarCodigoQR(codigoQR);
                    input.val(''); // Limpiar input
                }
            }
        });

        // Mantener focus
        input.on('blur', function() {
            setTimeout(() => {
                if ($('#contentTomarAsistencia').is(':visible')) {
                    $(this).focus();
                }
            }, 100);
        });

        // Auto-focus inicial
        setTimeout(() => {
            input.focus();
        }, 500);
    }

    /**
     * Procesar código QR escaneado
     */
    async procesarCodigoQR(codigoQR) {
        console.log('🔍 Procesando código QR:', codigoQR);

        // Evitar escaneos duplicados muy rápidos (menos de 3 segundos)
        const ahora = Date.now();
        if (this.ultimoEscaneo && (ahora - this.ultimoEscaneo) < 3000) {
            this.mostrarFeedback('warning', 'Espere unos segundos antes del siguiente escaneo');
            this.reproducirSonido('error');
            return;
        }

        this.ultimoEscaneo = ahora;

        try {
            // Registrar asistencia
            const response = await fetch('/asistencia/registrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    codigoQR: codigoQR,
                    docenteId: this.docenteId,
                    unidadId: this.unidadSeleccionada,
                    grupoId: this.grupoSeleccionado,
                    tipoAsistencia: 'PRESENTE'
                })
            });

            const resultado = await response.json();

            if (resultado.success) {
                // Éxito
                this.mostrarFeedback('success', `
                    <h5 class="mb-2">✅ Asistencia Registrada</h5>
                    <p class="mb-1"><strong>${resultado.estudiante.nombre}</strong></p>
                    <p class="mb-0">Boleta: ${resultado.estudiante.boleta}</p>
                `, resultado.estudiante);
                this.reproducirSonido('success');
                await this.cargarAsistenciasHoy(); // Recargar lista
            } else {
                // Error o advertencia
                if (resultado.tipo === 'warning') {
                    this.mostrarFeedback('warning', `
                        <h5 class="mb-2">⚠️ ${resultado.mensaje}</h5>
                        ${resultado.estudiante ? `
                            <p class="mb-1"><strong>${resultado.estudiante.nombre}</strong></p>
                            <p class="mb-0">Boleta: ${resultado.estudiante.boleta}</p>
                            <p class="mb-0 text-muted">Registrado a las: ${new Date(resultado.estudiante.horaRegistro).toLocaleTimeString()}</p>
                        ` : ''}
                    `);
                } else {
                    this.mostrarFeedback('error', `
                        <h5 class="mb-2">❌ ${resultado.mensaje}</h5>
                        <p class="mb-0">Código: ${codigoQR}</p>
                    `);
                }
                this.reproducirSonido('error');
            }

        } catch (error) {
            console.error('Error al registrar asistencia:', error);
            this.mostrarFeedback('error', `
                <h5 class="mb-2">❌ Error de Conexión</h5>
                <p class="mb-0">${error.message}</p>
            `);
            this.reproducirSonido('error');
        }
    }

    /**
     * Mostrar feedback visual al usuario
     */
    mostrarFeedback(tipo, contenido, estudiante = null) {
        const panel = $('#panelFeedback');
        const alert = $('#alertFeedback');
        const icono = $('#iconoFeedback');
        const contenidoDiv = $('#contenidoFeedback');

        // Ocultar panel actual
        panel.fadeOut(200, () => {
            // Configurar clases según tipo
            alert.removeClass('alert-success alert-warning alert-danger');

            switch(tipo) {
                case 'success':
                    alert.addClass('alert-success');
                    icono.html('<i class="fas fa-check-circle fa-3x text-success"></i>');
                    break;
                case 'warning':
                    alert.addClass('alert-warning');
                    icono.html('<i class="fas fa-exclamation-triangle fa-3x text-warning"></i>');
                    break;
                case 'error':
                    alert.addClass('alert-danger');
                    icono.html('<i class="fas fa-times-circle fa-3x text-danger"></i>');
                    break;
            }

            // Establecer contenido
            contenidoDiv.html(contenido);

            // Mostrar panel con animación
            panel.fadeIn(300);

            // Auto-ocultar después de 5 segundos (excepto errores)
            if (tipo !== 'error') {
                setTimeout(() => {
                    panel.fadeOut(300);
                }, 5000);
            }
        });
    }

    /**
     * Actualizar contador de asistencias
     */
    actualizarContador() {
        $('#contadorAsistenciasHoy').text(this.asistenciasHoy.length);
    }

    /**
     * Renderizar tabla de asistencias
     */
    renderizarTablaAsistencias(asistencias) {
        const tbody = $('#tbodyAsistencias');
        tbody.empty();

        if (!asistencias || asistencias.length === 0) {
            tbody.html(`
                <tr>
                    <td colspan="8" class="text-center text-muted py-4">
                        <i class="fas fa-clipboard-list fa-3x mb-3 d-block"></i>
                        <p>No hay asistencias registradas para la fecha seleccionada</p>
                    </td>
                </tr>
            `);
            return;
        }

        asistencias.forEach((asistencia, index) => {
            const fecha = new Date(asistencia.fechaHora);
            const hora = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

            const tipoBadge = asistencia.tipoAsistencia === 'PRESENTE'
                ? 'bg-success'
                : asistencia.tipoAsistencia === 'RETARDO'
                    ? 'bg-warning'
                    : 'bg-danger';

            tbody.append(`
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${hora}</td>
                    <td>${asistencia.boletaEstudiante || 'N/A'}</td>
                    <td>${asistencia.nombreEstudiante || 'N/A'}</td>
                    <td>${asistencia.nombreGrupo || 'Sin grupo'}</td>
                    <td>${asistencia.nombreUnidad || 'Sin materia'}</td>
                    <td class="text-center">
                        <span class="badge ${tipoBadge}">${asistencia.tipoAsistencia}</span>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-danger btn-xs btnEliminarAsistencia" data-id="${asistencia.id}" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `);
        });
    }

    /**
     * Inicializar eventos
     */
    inicializarEventos() {
        const self = this;

        // Cambio de unidad
        $('#selectUnidadAsistencia').on('change', function() {
            self.unidadSeleccionada = $(this).val() || null;
            console.log('Unidad seleccionada:', self.unidadSeleccionada);
        });

        // Cambio de grupo
        $('#selectGrupoAsistencia').on('change', function() {
            self.grupoSeleccionado = $(this).val() || null;
            console.log('Grupo seleccionado:', self.grupoSeleccionado);
        });

        // Filtrar por fecha
        $('#btnFiltrarPorFecha').on('click', async function() {
            const fecha = $('#inputFechaFiltro').val();
            if (!fecha) {
                alert('Por favor seleccione una fecha');
                return;
            }
            await self.cargarAsistenciasPorFecha(fecha);
        });

        // Reset a fecha de hoy
        $('#btnResetFiltro').on('click', async function() {
            self.establecerFechaHoy();
            await self.cargarAsistenciasHoy();
        });

        // Eliminar asistencia
        $(document).on('click', '.btnEliminarAsistencia', async function() {
            const id = $(this).data('id');
            if (confirm('¿Está seguro de eliminar esta asistencia?')) {
                await self.eliminarAsistencia(id);
            }
        });
    }

    /**
     * Cargar asistencias por fecha específica
     */
    async cargarAsistenciasPorFecha(fecha) {
        try {
            const response = await fetch(`/asistencia/fecha/${this.docenteId}/${fecha}`);
            if (!response.ok) throw new Error('Error al cargar asistencias');

            const asistencias = await response.json();
            this.renderizarTablaAsistencias(asistencias);
            console.log(`✅ ${asistencias.length} asistencias en ${fecha}`);
        } catch (error) {
            console.error('Error al cargar asistencias:', error);
            alert('Error al cargar asistencias: ' + error.message);
        }
    }

    /**
     * Eliminar una asistencia
     */
    async eliminarAsistencia(id) {
        try {
            const response = await fetch(`/asistencia/${id}`, { method: 'DELETE' });
            const resultado = await response.json();

            if (resultado.success) {
                alert('✅ Asistencia eliminada correctamente');
                await this.cargarAsistenciasHoy();
            } else {
                alert('❌ Error: ' + resultado.mensaje);
            }
        } catch (error) {
            console.error('Error al eliminar asistencia:', error);
            alert('Error al eliminar asistencia: ' + error.message);
        }
    }

    /**
     * Establecer fecha de hoy en el input
     */
    establecerFechaHoy() {
        const hoy = new Date().toISOString().split('T')[0];
        $('#inputFechaFiltro').val(hoy);
    }

    /**
     * Crear sonidos de feedback
     */
    crearSonidosFeedback() {
        // Crear AudioContext para generar sonidos
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (e) {
            console.warn('AudioContext no soportado');
        }
    }

    /**
     * Reproducir sonido según tipo
     */
    reproducirSonido(tipo) {
        if (!this.audioContext) return;

        const oscilador = this.audioContext.createOscillator();
        const ganancia = this.audioContext.createGain();

        oscilador.connect(ganancia);
        ganancia.connect(this.audioContext.destination);

        if (tipo === 'success') {
            // Sonido de éxito (dos tonos ascendentes)
            oscilador.frequency.value = 800;
            ganancia.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            oscilador.start(this.audioContext.currentTime);
            oscilador.frequency.setValueAtTime(1000, this.audioContext.currentTime + 0.1);
            oscilador.stop(this.audioContext.currentTime + 0.2);
        } else {
            // Sonido de error (tono bajo)
            oscilador.frequency.value = 200;
            ganancia.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            oscilador.start(this.audioContext.currentTime);
            oscilador.stop(this.audioContext.currentTime + 0.3);
        }
    }
}

// Crear instancia global
window.asistenciaManager = new AsistenciaManager();
