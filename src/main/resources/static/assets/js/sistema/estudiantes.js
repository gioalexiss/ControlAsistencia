/**
 * Gestor de Estudiantes del Docente
 * Maneja la visualización y filtrado de todos los estudiantes
 */

class EstudianteManager {
    constructor() {
        this.docenteId = localStorage.getItem('docenteId');
        this.estudiantes = [];
        this.estudiantesFiltrados = [];
        this.grupos = [];
        this.grupoSeleccionado = '';
        this.dataTable = null;
        this.inicializado = false;
    }

    /**
     * Inicializa el gestor de estudiantes
     */
    async init() {
        if (!this.docenteId) {
            console.error('No se encontró ID de docente');
            return;
        }

        // Evitar inicialización múltiple
        if (this.inicializado) {
            return;
        }

        await this.cargarGrupos();
        await this.cargarEstudiantes();
        this.configurarEventListeners();
        this.inicializado = true;
    }

    /**
     * Carga la lista de grupos del docente
     */
    async cargarGrupos() {
        try {
            const response = await fetch(`/grupos/docente/${this.docenteId}`);

            if (!response.ok) {
                throw new Error('Error al cargar grupos');
            }

            this.grupos = await response.json();
            this.poblarSelectGrupos();
        } catch (error) {
            console.error('Error al cargar grupos:', error);
        }
    }

    /**
     * Llena el select de grupos con los datos obtenidos
     */
    poblarSelectGrupos() {
        const selectGrupo = document.getElementById('selectGrupoEstudiante');
        if (!selectGrupo) return;

        // Limpiar opciones existentes excepto la primera
        selectGrupo.innerHTML = '<option value="">Todos los grupos</option>';

        // Agregar opciones de grupos
        this.grupos.forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo.id;
            option.textContent = `${grupo.nombreGrupo} - ${grupo.nombreMateria || 'Sin materia'}`;
            selectGrupo.appendChild(option);
        });
    }

    /**
     * Carga todos los estudiantes del docente
     */
    async cargarEstudiantes() {
        try {
            const response = await fetch(`/estudiantes/docente/${this.docenteId}`);

            if (!response.ok) {
                throw new Error('Error al cargar estudiantes');
            }

            this.estudiantes = await response.json();
            this.aplicarFiltros();
        } catch (error) {
            console.error('Error al cargar estudiantes:', error);
            this.mostrarError('Error al cargar los estudiantes');
        }
    }

    /**
     * Renderiza la tabla de estudiantes
     */
    renderizarTabla() {
        const tbody = document.getElementById('tbodyEstudiantes');
        if (!tbody) {
            console.warn('No se encontró el elemento tbodyEstudiantes');
            return;
        }

        // Si DataTable ya está inicializado, solo actualizar datos
        if (this.dataTable) {
            this.dataTable.clear();

            if (this.estudiantesFiltrados.length > 0) {
                this.estudiantesFiltrados.forEach((estudiante, index) => {
                    const nombreCompleto = `${estudiante.nombre} ${estudiante.apellido || ''}`.trim();
                    const estadoBadge = estudiante.estado === 'activo'
                        ? '<span class="badge badge-success">Activo</span>'
                        : '<span class="badge badge-secondary">Inactivo</span>';

                    this.dataTable.row.add([
                        index + 1,
                        `<strong>${estudiante.boleta}</strong>`,
                        nombreCompleto,
                        estudiante.correo || 'No registrado',
                        estadoBadge,
                        `<div class="btn-group btn-group-sm" role="group">
                            <button class="btn btn-info btn-sm btn-ver-detalle" data-estudiante-id="${estudiante.id}" title="Ver detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-primary btn-sm btn-ver-grupos" data-estudiante-id="${estudiante.id}" title="Ver grupos">
                                <i class="fas fa-users"></i>
                            </button>
                            <button class="btn btn-warning btn-sm btn-editar" data-estudiante-id="${estudiante.id}" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>`
                    ]);
                });
            }

            this.dataTable.draw();

            // Actualizar contador
            const contador = document.getElementById('contadorEstudiantes');
            if (contador) {
                contador.textContent = this.estudiantesFiltrados.length;
            }
            return;
        }

        // Primera inicialización
        tbody.innerHTML = '';

        if (this.estudiantesFiltrados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5">
                        <i class="fas fa-user-graduate fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted">No hay estudiantes registrados</h5>
                        <p class="text-muted">Importa estudiantes desde la sección "Mis Grupos"</p>
                    </td>
                </tr>
            `;
            // Actualizar contador
            const contador = document.getElementById('contadorEstudiantes');
            if (contador) {
                contador.textContent = 0;
            }
            return;
        }

        this.estudiantesFiltrados.forEach((estudiante, index) => {
            const tr = this.crearFilaEstudiante(estudiante, index + 1);
            tbody.appendChild(tr);
        });

        // Actualizar contador
        const contador = document.getElementById('contadorEstudiantes');
        if (contador) {
            contador.textContent = this.estudiantesFiltrados.length;
        }

        // Inicializar DataTable después de un pequeño delay
        setTimeout(() => {
            this.inicializarDataTable();
        }, 100);
    }

    /**
     * Crea una fila de la tabla para un estudiante
     */
    crearFilaEstudiante(estudiante, numero) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-estudiante-id', estudiante.id);

        // Determinar badge de estado
        const estadoBadge = estudiante.estado === 'activo'
            ? '<span class="badge badge-success">Activo</span>'
            : '<span class="badge badge-secondary">Inactivo</span>';

        // Formatear nombre completo
        const nombreCompleto = `${estudiante.nombre} ${estudiante.apellido || ''}`.trim();

        tr.innerHTML = `
            <td class="text-center">${numero}</td>
            <td><strong>${estudiante.boleta}</strong></td>
            <td>${nombreCompleto}</td>
            <td>${estudiante.correo || 'No registrado'}</td>
            <td class="text-center">${estadoBadge}</td>
            <td class="text-center">
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-info btn-sm btn-ver-detalle"
                            data-estudiante-id="${estudiante.id}"
                            title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-primary btn-sm btn-ver-grupos"
                            data-estudiante-id="${estudiante.id}"
                            title="Ver grupos">
                        <i class="fas fa-users"></i>
                    </button>
                    <button class="btn btn-warning btn-sm btn-editar"
                            data-estudiante-id="${estudiante.id}"
                            title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        `;

        return tr;
    }

    /**
     * Inicializa DataTable para la tabla de estudiantes
     */
    inicializarDataTable() {
        // No inicializar si ya existe
        if (this.dataTable) {
            return;
        }

        // Verificar que jQuery y DataTables estén disponibles
        if (typeof $ === 'undefined' || !$.fn.DataTable) {
            console.warn('DataTables no está disponible, mostrando tabla simple');
            return;
        }

        try {
            this.dataTable = $('#tablaEstudiantes').DataTable({
                language: {
                    "sProcessing": "Procesando...",
                    "sLengthMenu": "Mostrar _MENU_ registros",
                    "sZeroRecords": "No se encontraron resultados",
                    "sEmptyTable": "Ningún dato disponible en esta tabla",
                    "sInfo": "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
                    "sInfoEmpty": "Mostrando registros del 0 al 0 de un total de 0 registros",
                    "sInfoFiltered": "(filtrado de un total de _MAX_ registros)",
                    "sInfoPostFix": "",
                    "sSearch": "Buscar:",
                    "sUrl": "",
                    "sInfoThousands": ",",
                    "sLoadingRecords": "Cargando...",
                    "oPaginate": {
                        "sFirst": "Primero",
                        "sLast": "Último",
                        "sNext": "Siguiente",
                        "sPrevious": "Anterior"
                    },
                    "oAria": {
                        "sSortAscending": ": Activar para ordenar la columna de manera ascendente",
                        "sSortDescending": ": Activar para ordenar la columna de manera descendente"
                    }
                },
                pageLength: 25,
                order: [[1, 'asc']], // Ordenar por boleta
                dom: 'Bfrtip',
                buttons: [
                    {
                        extend: 'excelHtml5',
                        text: '<i class="fas fa-file-excel"></i> Exportar a Excel',
                        className: 'btn btn-success btn-sm',
                        exportOptions: {
                            columns: [0, 1, 2, 3, 4]
                        }
                    },
                    {
                        extend: 'pdfHtml5',
                        text: '<i class="fas fa-file-pdf"></i> Exportar a PDF',
                        className: 'btn btn-danger btn-sm',
                        exportOptions: {
                            columns: [0, 1, 2, 3, 4]
                        }
                    },
                    {
                        extend: 'print',
                        text: '<i class="fas fa-print"></i> Imprimir',
                        className: 'btn btn-info btn-sm',
                        exportOptions: {
                            columns: [0, 1, 2, 3, 4]
                        }
                    }
                ],
                retrieve: true,
                stateSave: false
            });
        } catch (error) {
            console.error('Error al inicializar DataTable:', error);
            this.dataTable = null;
        }
    }

    /**
     * Configura los event listeners
     */
    configurarEventListeners() {
        // Filtro de búsqueda personalizado
        const inputBusqueda = document.getElementById('inputBuscarEstudiante');
        if (inputBusqueda) {
            inputBusqueda.addEventListener('input', (e) => {
                this.aplicarFiltros();
            });
        }

        // Filtro por grupo
        const selectGrupo = document.getElementById('selectGrupoEstudiante');
        if (selectGrupo) {
            selectGrupo.addEventListener('change', (e) => {
                this.grupoSeleccionado = e.target.value;
                this.aplicarFiltros();
            });
        }

        // Filtro por estado
        const selectEstado = document.getElementById('selectEstadoEstudiante');
        if (selectEstado) {
            selectEstado.addEventListener('change', (e) => {
                this.aplicarFiltros();
            });
        }

        // Event delegation para botones de acción
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-ver-detalle')) {
                const btn = e.target.closest('.btn-ver-detalle');
                const estudianteId = btn.getAttribute('data-estudiante-id');
                this.verDetalleEstudiante(estudianteId);
            }

            if (e.target.closest('.btn-ver-grupos')) {
                const btn = e.target.closest('.btn-ver-grupos');
                const estudianteId = btn.getAttribute('data-estudiante-id');
                this.verGruposEstudiante(estudianteId);
            }

            if (e.target.closest('.btn-editar')) {
                const btn = e.target.closest('.btn-editar');
                const estudianteId = btn.getAttribute('data-estudiante-id');
                this.editarEstudiante(estudianteId);
            }
        });

        // Botón de recargar
        const btnRecargar = document.getElementById('btnRecargarEstudiantes');
        if (btnRecargar) {
            btnRecargar.addEventListener('click', () => {
                this.cargarEstudiantes();
            });
        }

        // Botón de generar QR masivo
        const btnGenerarQR = document.getElementById('btnGenerarQRMasivo');
        if (btnGenerarQR) {
            btnGenerarQR.addEventListener('click', () => {
                this.generarQRMasivo();
            });
        }
    }

    /**
     * Aplica todos los filtros activos
     */
    async aplicarFiltros() {
        let estudiantesFiltrados = [...this.estudiantes];

        // Filtro por grupo
        if (this.grupoSeleccionado) {
            try {
                const response = await fetch(`/estudiantes/grupo/${this.grupoSeleccionado}`);
                if (response.ok) {
                    const estudiantesDelGrupo = await response.json();
                    const idsEstudiantesGrupo = new Set(estudiantesDelGrupo.map(e => e.id));
                    estudiantesFiltrados = estudiantesFiltrados.filter(est => idsEstudiantesGrupo.has(est.id));
                }
            } catch (error) {
                console.error('Error al filtrar por grupo:', error);
            }
        }

        // Filtro por texto de búsqueda
        const inputBusqueda = document.getElementById('inputBuscarEstudiante');
        if (inputBusqueda && inputBusqueda.value.trim() !== '') {
            const textoLower = inputBusqueda.value.toLowerCase().trim();
            estudiantesFiltrados = estudiantesFiltrados.filter(est => {
                const nombreCompleto = `${est.nombre} ${est.apellido || ''}`.toLowerCase();
                return est.boleta.toLowerCase().includes(textoLower) ||
                       nombreCompleto.includes(textoLower) ||
                       (est.correo && est.correo.toLowerCase().includes(textoLower));
            });
        }

        // Filtro por estado
        const selectEstado = document.getElementById('selectEstadoEstudiante');
        if (selectEstado && selectEstado.value !== 'todos') {
            const estado = selectEstado.value;
            estudiantesFiltrados = estudiantesFiltrados.filter(est => est.estado === estado);
        }

        this.estudiantesFiltrados = estudiantesFiltrados;
        this.renderizarTabla();
    }

    /**
     * Filtra estudiantes por texto de búsqueda (legacy - ahora usa aplicarFiltros)
     */
    filtrarEstudiantes(texto) {
        this.aplicarFiltros();
    }

    /**
     * Filtra estudiantes por estado (legacy - ahora usa aplicarFiltros)
     */
    filtrarPorEstado(estado) {
        this.aplicarFiltros();
    }

    /**
     * Ver detalle de un estudiante
     */
    verDetalleEstudiante(estudianteId) {
        const estudiante = this.estudiantes.find(e => e.id == estudianteId);
        if (!estudiante) {
            this.mostrarError('Estudiante no encontrado');
            return;
        }

        // Limpiar todos los backdrops y modales anteriores
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        const modalAnterior = document.getElementById('modalDetalleEstudiante');
        if (modalAnterior) {
            const modalInstance = bootstrap.Modal.getInstance(modalAnterior);
            if (modalInstance) {
                modalInstance.dispose();
            }
            modalAnterior.remove();
        }

        const modalHTML = `
            <div class="modal fade" id="modalDetalleEstudiante" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-user-graduate"></i>
                                Detalle del Estudiante
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-12 text-center mb-3">
                                    <div class="avatar-lg mx-auto">
                                        <i class="fas fa-user-circle fa-5x text-primary"></i>
                                    </div>
                                </div>
                            </div>
                            <table class="table table-borderless">
                                <tr>
                                    <th width="40%">Boleta:</th>
                                    <td><strong>${estudiante.boleta}</strong></td>
                                </tr>
                                <tr>
                                    <th>Nombre:</th>
                                    <td>${estudiante.nombre}</td>
                                </tr>
                                <tr>
                                    <th>Apellido:</th>
                                    <td>${estudiante.apellido || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Correo:</th>
                                    <td>${estudiante.correo || 'No registrado'}</td>
                                </tr>
                                <tr>
                                    <th>Estado:</th>
                                    <td>
                                        ${estudiante.estado === 'activo'
                                            ? '<span class="badge badge-success">Activo</span>'
                                            : '<span class="badge badge-secondary">Inactivo</span>'}
                                    </td>
                                </tr>
                                <tr>
                                    <th>Código QR:</th>
                                    <td>${estudiante.qrCode ? '<span class="badge badge-success"><i class="fas fa-qrcode"></i> Generado</span>' : '<span class="badge badge-warning">No generado</span>'}</td>
                                </tr>
                            </table>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Mostrar modal
        const modalElement = document.getElementById('modalDetalleEstudiante');
        const modal = new bootstrap.Modal(modalElement);

        // Evento para limpiar el modal cuando se oculta completamente
        modalElement.addEventListener('hidden.bs.modal', function (event) {
            // Limpiar backdrops
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            // Remover el modal del DOM
            modalElement.remove();
            // Asegurar que el body no tenga la clase modal-open
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('padding-right');
        }, { once: true });

        modal.show();
    }

    /**
     * Ver grupos de un estudiante
     */
    verGruposEstudiante(estudianteId) {
        alert(`Ver grupos del estudiante ${estudianteId} - Funcionalidad próximamente`);
    }

    /**
     * Editar estudiante
     */
    editarEstudiante(estudianteId) {
        alert(`Editar estudiante ${estudianteId} - Funcionalidad próximamente`);
    }

    /**
     * Genera códigos QR masivamente para todos los estudiantes
     */
    async generarQRMasivo() {
        if (!confirm('¿Deseas generar códigos QR únicos para todos los estudiantes?\n\nEsto puede tardar unos momentos.')) {
            return;
        }

        try {
            // Mostrar indicador de carga
            const btnGenerarQR = document.getElementById('btnGenerarQRMasivo');
            const textoOriginal = btnGenerarQR.innerHTML;
            btnGenerarQR.disabled = true;
            btnGenerarQR.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';

            const response = await fetch(`/estudiantes/generar-qr-masivo/${this.docenteId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }

            const resultado = await response.json();

            // Restaurar botón
            btnGenerarQR.disabled = false;
            btnGenerarQR.innerHTML = textoOriginal;

            if (resultado.success) {
                // Mostrar resultado
                let mensaje = resultado.mensaje + '\n\n';
                mensaje += `Total de estudiantes: ${resultado.totalEstudiantes}\n`;
                mensaje += `QR generados: ${resultado.qrGenerados}\n`;
                mensaje += `Ya existían: ${resultado.yaExistian}`;

                if (resultado.errores && resultado.errores.length > 0) {
                    mensaje += '\n\nErrores:\n' + resultado.errores.join('\n');
                }

                alert(mensaje);

                // Recargar lista de estudiantes
                await this.cargarEstudiantes();
            } else {
                alert('Error: ' + resultado.mensaje);
            }

        } catch (error) {
            console.error('Error al generar QR masivo:', error);
            alert('Error al generar códigos QR: ' + error.message);

            // Restaurar botón
            const btnGenerarQR = document.getElementById('btnGenerarQRMasivo');
            if (btnGenerarQR) {
                btnGenerarQR.disabled = false;
                btnGenerarQR.innerHTML = '<i class="fas fa-qrcode"></i> Generar QR Masivo';
            }
        }
    }

    /**
     * Muestra un mensaje de error
     */
    mostrarError(mensaje) {
        console.error(mensaje);
        alert(mensaje);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.estudianteManager = new EstudianteManager();
});
