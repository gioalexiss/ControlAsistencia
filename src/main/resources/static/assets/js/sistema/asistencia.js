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
        this.sesionActiva = false;
        this.asistenciasSesionActual = [];
        this.unidadesCompletas = [];
        this.estudiantesEscaneadosEnSesion = new Set(); // Guarda estudianteId para evitar duplicados
        this.chartsAsistencia = {}; // Gráficos de asistencia en tiempo real
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
        await this.cargarAsistenciasHoy();
        this.inicializarEventos();
        this.configurarInputQR();
        this.establecerFechaHoy();

        // Deshabilitar selector de grupos inicialmente
        $('#selectGrupoAsistencia').prop('disabled', true);

        // Crear sonidos de feedback
        this.crearSonidosFeedback();

        // Desactivar el input de QR inicialmente
        this.desactivarEscaner();

        console.log('✅ AsistenciaManager inicializado correctamente');
    }

    /**
     * Desactivar el escáner QR
     */
    desactivarEscaner() {
        const input = $('#inputCodigoQR');
        input.prop('disabled', true);
        input.attr('placeholder', 'Seleccione una materia y grupo para iniciar...');
        this.sesionActiva = false;
    }

    /**
     * Activar el escáner QR
     */
    activarEscaner() {
        const input = $('#inputCodigoQR');
        input.prop('disabled', false);
        input.attr('placeholder', 'Enfoque aquí y escanee el código QR...');
        input.focus();
        this.sesionActiva = true;
        this.asistenciasSesionActual = [];
        this.estudiantesEscaneadosEnSesion.clear(); // Limpiar la lista de escaneados
    }

    /**
     * Cargar las unidades (materias) del docente
     */
    async cargarUnidades() {
        try {
            const response = await fetch(`/horario/obtener/${this.docenteId}`);
            if (!response.ok) throw new Error('Error al cargar unidades');

            this.unidadesCompletas = await response.json();
            const select = $('#selectUnidadAsistencia');
            select.empty();
            select.append('<option value="">Seleccione una materia</option>');

            this.unidadesCompletas.forEach(unidad => {
                select.append(`<option value="${unidad.id}">${unidad.nombreUnidad}</option>`);
            });

            console.log(`📚 ${this.unidadesCompletas.length} unidades cargadas`);
        } catch (error) {
            console.error('Error al cargar unidades:', error);
        }
    }

    /**
     * Cargar los grupos de una unidad específica
     */
    cargarGruposPorUnidad(unidadId) {
        const select = $('#selectGrupoAsistencia');
        select.empty();
        select.append('<option value="">Seleccione un grupo</option>');

        if (!unidadId) {
            select.prop('disabled', true);
            return;
        }

        // Buscar la unidad seleccionada
        const unidad = this.unidadesCompletas.find(u => u.id == unidadId);

        if (unidad && unidad.grupos && unidad.grupos.length > 0) {
            select.prop('disabled', false);
            unidad.grupos.forEach(grupo => {
                select.append(`<option value="${grupo.id}">${grupo.nombreGrupo}</option>`);
            });
            console.log(`👥 ${unidad.grupos.length} grupos cargados para la unidad ${unidad.nombreUnidad}`);
        } else {
            select.prop('disabled', true);
            select.append('<option value="">No hay grupos para esta materia</option>');
            console.warn('No se encontraron grupos para esta unidad');
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
     * Verificar si se han seleccionado materia y grupo
     */
    verificarSeleccionCompleta() {
        if (this.unidadSeleccionada && this.grupoSeleccionado) {
            $('#btnIniciarSesion').fadeIn();
        } else {
            $('#btnIniciarSesion').fadeOut();
            $('#btnFinalizarSesion').fadeOut();
            if (this.sesionActiva) {
                this.desactivarEscaner();
            }
        }
    }

    /**
     * Iniciar sesión de toma de asistencia
     */
    iniciarSesion() {
        // Mostrar modal de confirmación
        this.mostrarModalIniciarSesion();
    }

    /**
     * Mostrar modal de confirmación para iniciar sesión
     */
    mostrarModalIniciarSesion() {
        // Limpiar modales anteriores
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        const modalAnterior = document.getElementById('modalIniciarSesion');
        if (modalAnterior) {
            const modalInstance = bootstrap.Modal.getInstance(modalAnterior);
            if (modalInstance) {
                modalInstance.dispose();
            }
            modalAnterior.remove();
        }

        const nombreUnidad = $('#selectUnidadAsistencia option:selected').text();
        const nombreGrupo = $('#selectGrupoAsistencia option:selected').text();

        const modalHTML = `
            <div class="modal fade" id="modalIniciarSesion" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-play-circle"></i>
                                Iniciar Toma de Asistencia
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-3">
                                <i class="fas fa-qrcode fa-4x text-success"></i>
                            </div>
                            <h6 class="text-center mb-3">¿Está listo para iniciar la toma de asistencia?</h6>
                            <div class="alert alert-info">
                                <p class="mb-2"><strong>Materia:</strong> ${nombreUnidad}</p>
                                <p class="mb-0"><strong>Grupo:</strong> ${nombreGrupo}</p>
                            </div>
                            <div class="alert alert-warning">
                                <p class="mb-0"><i class="fas fa-info-circle"></i> <strong>Recuerda:</strong> Los estudiantes deben escanear sus códigos QR para registrar su asistencia.</p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            <button type="button" class="btn btn-success" id="btnConfirmarIniciarSesion">
                                <i class="fas fa-check-circle"></i> Sí, Iniciar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Inicializar modal
        const modalElement = document.getElementById('modalIniciarSesion');
        const modal = new bootstrap.Modal(modalElement);

        // Evento para limpiar el modal cuando se oculta
        modalElement.addEventListener('hidden.bs.modal', function (event) {
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            modalElement.remove();
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('padding-right');
        }, { once: true });

        // Evento del botón de confirmar
        document.getElementById('btnConfirmarIniciarSesion').addEventListener('click', () => {
            modal.hide();
            this.ejecutarInicioSesion();
        });

        modal.show();
    }

    /**
     * Ejecutar inicio de sesión (después de confirmar)
     */
    ejecutarInicioSesion() {
        const nombreUnidad = $('#selectUnidadAsistencia option:selected').text();
        const nombreGrupo = $('#selectGrupoAsistencia option:selected').text();

        // Activar escáner
        this.activarEscaner();

        // Deshabilitar los selectores
        $('#selectUnidadAsistencia').prop('disabled', true);
        $('#selectGrupoAsistencia').prop('disabled', true);

        // Cambiar botones
        $('#btnIniciarSesion').fadeOut();
        $('#btnFinalizarSesion').fadeIn();
        $('#btnFinalizarSesionFinal').fadeIn();

        // Mostrar gráficos interactivos
        $('#graficosAsistenciaActual').fadeIn();
        this.inicializarGraficosAsistencia();

        // Mostrar mensaje
        this.mostrarFeedback('success', `
            <h5 class="mb-2">✅ Sesión Iniciada</h5>
            <p class="mb-1"><strong>Materia:</strong> ${nombreUnidad}</p>
            <p class="mb-0"><strong>Grupo:</strong> ${nombreGrupo}</p>
            <p class="mt-2 mb-0 small">Ya puede comenzar a escanear códigos QR</p>
        `);

        console.log('✅ Sesión de asistencia iniciada');
    }

    /**
     * Finalizar sesión de asistencia
     */
    async finalizarSesion() {
        // Mostrar modal de confirmación
        this.mostrarModalFinalizarSesion();
    }

    /**
     * Mostrar modal de confirmación para finalizar sesión
     */
    mostrarModalFinalizarSesion() {
        // Limpiar modales anteriores
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        const modalAnterior = document.getElementById('modalFinalizarSesion');
        if (modalAnterior) {
            const modalInstance = bootstrap.Modal.getInstance(modalAnterior);
            if (modalInstance) {
                modalInstance.dispose();
            }
            modalAnterior.remove();
        }

        const nombreUnidad = $('#selectUnidadAsistencia option:selected').text();
        const nombreGrupo = $('#selectGrupoAsistencia option:selected').text();

        const modalHTML = `
            <div class="modal fade" id="modalFinalizarSesion" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-warning text-dark">
                            <h5 class="modal-title">
                                <i class="fas fa-stop-circle"></i>
                                Finalizar Toma de Asistencia
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-3">
                                <i class="fas fa-clipboard-check fa-4x text-warning"></i>
                            </div>
                            <h6 class="text-center mb-3">¿Está seguro de finalizar la sesión de asistencia?</h6>
                            <div class="alert alert-info">
                                <p class="mb-2"><strong>Materia:</strong> ${nombreUnidad}</p>
                                <p class="mb-2"><strong>Grupo:</strong> ${nombreGrupo}</p>
                                <p class="mb-0"><strong>Asistencias registradas:</strong> ${this.asistenciasSesionActual.length}</p>
                            </div>
                            <p class="text-muted small text-center">
                                Los registros de asistencia se han guardado automáticamente.
                                Podrás verlos en la sección "Mis Reportes".
                            </p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            <button type="button" class="btn btn-warning" id="btnConfirmarFinalizarSesion">
                                <i class="fas fa-check-circle"></i> Sí, Finalizar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Inicializar modal
        const modalElement = document.getElementById('modalFinalizarSesion');
        const modal = new bootstrap.Modal(modalElement);

        // Evento para limpiar el modal cuando se oculta
        modalElement.addEventListener('hidden.bs.modal', function (event) {
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            modalElement.remove();
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('padding-right');
        }, { once: true });

        // Evento del botón de confirmar
        document.getElementById('btnConfirmarFinalizarSesion').addEventListener('click', () => {
            modal.hide();
            this.ejecutarFinalizacionSesion();
        });

        modal.show();
    }

    /**
     * Ejecutar finalización de sesión (después de confirmar)
     */
    ejecutarFinalizacionSesion() {
        // Desactivar escáner
        this.desactivarEscaner();

        // Habilitar selectores
        $('#selectUnidadAsistencia').prop('disabled', false);
        $('#selectGrupoAsistencia').prop('disabled', false);

        // Cambiar botones
        $('#btnFinalizarSesion').fadeOut();
        $('#btnFinalizarSesionFinal').fadeOut();
        $('#btnIniciarSesion').fadeIn();

        // Ocultar gráficos
        $('#graficosAsistenciaActual').fadeOut();
        this.destruirGraficosAsistencia();

        // Mostrar mensaje de éxito
        this.mostrarFeedback('success', `
            <h5 class="mb-2">✅ Sesión Finalizada</h5>
            <p class="mb-0">Se registraron ${this.asistenciasSesionActual.length} asistencias correctamente</p>
            <p class="mt-2 mb-0 small text-success">Puedes ver los reportes en la sección "Mis Reportes"</p>
        `);

        // Limpiar sesión actual y Set de estudiantes escaneados
        this.asistenciasSesionActual = [];
        this.estudiantesEscaneadosEnSesion.clear();

        console.log('✅ Sesión de asistencia finalizada');
    }

    /**
     * Procesar código QR escaneado
     */
    async procesarCodigoQR(codigoQR) {
        console.log('🔍 Procesando código QR:', codigoQR);

        // Verificar que hay una sesión activa
        if (!this.sesionActiva) {
            this.mostrarFeedback('error', 'Debe iniciar una sesión antes de escanear códigos QR');
            this.reproducirSonido('error');
            return;
        }

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
                // Verificar si este estudiante ya fue escaneado en esta sesión
                const estudianteId = resultado.estudiante.id;
                if (this.estudiantesEscaneadosEnSesion.has(estudianteId)) {
                    this.mostrarFeedback('error', `
                        <h5 class="mb-2">❌ Error: Escaneo Duplicado</h5>
                        <p class="mb-0">Este estudiante ya fue registrado en esta sesión</p>
                        <p class="mt-2 mb-0 small text-muted">${resultado.estudiante.nombre}</p>
                    `);
                    this.reproducirSonido('error');
                    return;
                }

                // Éxito - Agregar a la lista de escaneados
                this.estudiantesEscaneadosEnSesion.add(estudianteId);
                this.asistenciasSesionActual.push(resultado.asistencia);
                this.mostrarFeedback('success', `
                    <h5 class="mb-2">✅ Asistencia Registrada</h5>
                    <p class="mb-1"><strong>${resultado.estudiante.nombre}</strong></p>
                    <p class="mb-0">Boleta: ${resultado.estudiante.boleta}</p>
                    <p class="mt-2 mb-0 small text-success">Total en sesión: ${this.asistenciasSesionActual.length}</p>
                `, resultado.estudiante);
                this.reproducirSonido('success');
                await this.cargarAsistenciasHoy(); // Recargar lista
                this.actualizarGraficosAsistencia(); // Actualizar gráficos
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

            // Resetear grupo seleccionado
            self.grupoSeleccionado = null;

            // Cargar grupos de la unidad seleccionada
            self.cargarGruposPorUnidad(self.unidadSeleccionada);

            self.verificarSeleccionCompleta();
        });

        // Cambio de grupo
        $('#selectGrupoAsistencia').on('change', function() {
            self.grupoSeleccionado = $(this).val() || null;
            console.log('Grupo seleccionado:', self.grupoSeleccionado);
            self.verificarSeleccionCompleta();
        });

        // Botón Iniciar Sesión
        $('#btnIniciarSesion').on('click', function() {
            self.iniciarSesion();
        });

        // Botón Finalizar Sesión (panel superior)
        $('#btnFinalizarSesion').on('click', function() {
            self.finalizarSesion();
        });

        // Botón Finalizar Sesión (al final de la tabla)
        $('#btnFinalizarSesionFinal').on('click', function() {
            self.finalizarSesion();
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
            await self.eliminarAsistencia(id);
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
            this.mostrarFeedback('error', `
                <h5 class="mb-2">❌ Error</h5>
                <p class="mb-0">No se pudieron cargar las asistencias</p>
            `);
        }
    }

    /**
     * Eliminar una asistencia
     */
    async eliminarAsistencia(id) {
        this.mostrarModalEliminarAsistencia(id);
    }

    /**
     * Mostrar modal de confirmación para eliminar asistencia
     */
    mostrarModalEliminarAsistencia(id) {
        // Limpiar modales anteriores
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        const modalAnterior = document.getElementById('modalEliminarAsistencia');
        if (modalAnterior) {
            const modalInstance = bootstrap.Modal.getInstance(modalAnterior);
            if (modalInstance) {
                modalInstance.dispose();
            }
            modalAnterior.remove();
        }

        const modalHTML = `
            <div class="modal fade" id="modalEliminarAsistencia" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-trash-alt"></i>
                                Eliminar Registro de Asistencia
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-3">
                                <i class="fas fa-exclamation-triangle fa-4x text-danger"></i>
                            </div>
                            <h6 class="text-center mb-3">¿Está seguro de eliminar este registro de asistencia?</h6>
                            <div class="alert alert-warning">
                                <p class="mb-0"><i class="fas fa-info-circle"></i> <strong>Advertencia:</strong> Esta acción no se puede deshacer.</p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            <button type="button" class="btn btn-danger" id="btnConfirmarEliminar">
                                <i class="fas fa-trash"></i> Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Inicializar modal
        const modalElement = document.getElementById('modalEliminarAsistencia');
        const modal = new bootstrap.Modal(modalElement);

        // Evento para limpiar el modal cuando se oculta
        modalElement.addEventListener('hidden.bs.modal', function (event) {
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            modalElement.remove();
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('padding-right');
        }, { once: true });

        // Evento del botón de confirmar
        document.getElementById('btnConfirmarEliminar').addEventListener('click', async () => {
            modal.hide();
            await this.ejecutarEliminacionAsistencia(id);
        });

        modal.show();
    }

    /**
     * Ejecutar eliminación de asistencia (después de confirmar)
     */
    async ejecutarEliminacionAsistencia(id) {
        try {
            // Buscar la asistencia antes de eliminarla para obtener el estudianteId
            const asistenciaAEliminar = this.asistenciasHoy.find(a => a.id === id);
            const estudianteId = asistenciaAEliminar ? asistenciaAEliminar.estudianteId : null;

            const response = await fetch(`/asistencia/${id}`, { method: 'DELETE' });
            const resultado = await response.json();

            if (resultado.success) {
                // Remover el estudianteId del Set de escaneados para permitir re-registro
                if (estudianteId && this.sesionActiva) {
                    this.estudiantesEscaneadosEnSesion.delete(estudianteId);
                    console.log(`✅ Estudiante ${estudianteId} removido del Set de escaneados`);
                }

                this.mostrarFeedback('success', `
                    <h5 class="mb-2">✅ Asistencia Eliminada</h5>
                    <p class="mb-0">El registro ha sido eliminado correctamente</p>
                `);
                await this.cargarAsistenciasHoy();
            } else {
                this.mostrarFeedback('error', `
                    <h5 class="mb-2">❌ Error al Eliminar</h5>
                    <p class="mb-0">${resultado.mensaje}</p>
                `);
            }
        } catch (error) {
            console.error('Error al eliminar asistencia:', error);
            this.mostrarFeedback('error', `
                <h5 class="mb-2">❌ Error de Conexión</h5>
                <p class="mb-0">${error.message}</p>
            `);
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

    /**
     * Inicializar gráficos de asistencia en tiempo real
     */
    inicializarGraficosAsistencia() {
        this.crearGraficoSesionActual();
        this.crearGraficoTendenciaHoy();
    }

    /**
     * Crear gráfico de resumen de sesión actual
     */
    crearGraficoSesionActual() {
        const canvas = document.getElementById('chartSesionActual');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (this.chartsAsistencia.sesionActual) {
            this.chartsAsistencia.sesionActual.destroy();
        }

        this.chartsAsistencia.sesionActual = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Presentes', 'Sin Registrar'],
                datasets: [{
                    data: [0, 100],
                    backgroundColor: ['#28a745', '#dc3545'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#000',
                            padding: 15,
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + ' estudiantes';
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Crear gráfico de tendencia de asistencias de hoy
     */
    crearGraficoTendenciaHoy() {
        const canvas = document.getElementById('chartTendenciaHoy');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (this.chartsAsistencia.tendenciaHoy) {
            this.chartsAsistencia.tendenciaHoy.destroy();
        }

        this.chartsAsistencia.tendenciaHoy = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Asistencias',
                    data: [],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#28a745',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: '#000'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#000'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#000'
                        }
                    }
                }
            }
        });
    }

    /**
     * Actualizar gráficos de asistencia con datos actuales
     */
    async actualizarGraficosAsistencia() {
        // Actualizar gráfico de sesión actual
        if (this.chartsAsistencia.sesionActual) {
            const totalSesion = this.asistenciasSesionActual.length;

            // Obtener total de estudiantes del grupo actual
            let totalEstudiantes = totalSesion; // Por defecto, asumimos que el total es lo registrado
            if (this.grupoSeleccionado) {
                try {
                    const response = await fetch(`/estudiantes/grupo/${this.grupoSeleccionado}`);
                    const estudiantes = await response.json();
                    totalEstudiantes = estudiantes.length;
                } catch (error) {
                    console.error('Error al obtener estudiantes del grupo:', error);
                }
            }

            const sinRegistrar = Math.max(0, totalEstudiantes - totalSesion);

            this.chartsAsistencia.sesionActual.data.datasets[0].data = [totalSesion, sinRegistrar];
            this.chartsAsistencia.sesionActual.update();
        }

        // Actualizar gráfico de tendencia de hoy
        if (this.chartsAsistencia.tendenciaHoy && this.asistenciasHoy.length > 0) {
            // Agrupar asistencias por hora
            const asistenciasPorHora = {};
            this.asistenciasHoy.forEach(asistencia => {
                const fecha = new Date(asistencia.fechaHora);
                const hora = fecha.getHours();
                if (!asistenciasPorHora[hora]) {
                    asistenciasPorHora[hora] = 0;
                }
                asistenciasPorHora[hora]++;
            });

            const horas = Object.keys(asistenciasPorHora).sort((a, b) => a - b);
            const labels = horas.map(h => `${h}:00`);
            const datos = horas.map(h => asistenciasPorHora[h]);

            this.chartsAsistencia.tendenciaHoy.data.labels = labels;
            this.chartsAsistencia.tendenciaHoy.data.datasets[0].data = datos;
            this.chartsAsistencia.tendenciaHoy.update();
        }
    }

    /**
     * Destruir gráficos de asistencia
     */
    destruirGraficosAsistencia() {
        Object.keys(this.chartsAsistencia).forEach(key => {
            if (this.chartsAsistencia[key]) {
                this.chartsAsistencia[key].destroy();
            }
        });
        this.chartsAsistencia = {};
    }
}

// Crear instancia global
window.asistenciaManager = new AsistenciaManager();
