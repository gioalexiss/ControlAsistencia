/**
 * Gestor de Estudiantes del Docente
 * Maneja la visualización y filtrado de todos los estudiantes
 */

class EstudianteManager {
    constructor() {
        this.docenteId = localStorage.getItem('docenteId');
        this.estudiantes = [];
        this.estudiantesFiltrados = [];
        this.dataTable = null;
    }

    /**
     * Inicializa el gestor de estudiantes
     */
    async init() {
        if (!this.docenteId) {
            console.error('No se encontró ID de docente');
            return;
        }

        await this.cargarEstudiantes();
        this.configurarEventListeners();
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
            this.estudiantesFiltrados = [...this.estudiantes];
            this.renderizarTabla();
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

        // Inicializar DataTable si no está inicializado
        this.inicializarDataTable();
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
        // Destruir DataTable anterior si existe
        if (this.dataTable) {
            this.dataTable.destroy();
        }

        // Inicializar nuevo DataTable
        if ($.fn.DataTable) {
            this.dataTable = $('#tablaEstudiantes').DataTable({
                language: {
                    url: '//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json'
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
                ]
            });
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
                this.filtrarEstudiantes(e.target.value);
            });
        }

        // Filtro por estado
        const selectEstado = document.getElementById('selectEstadoEstudiante');
        if (selectEstado) {
            selectEstado.addEventListener('change', (e) => {
                this.filtrarPorEstado(e.target.value);
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
    }

    /**
     * Filtra estudiantes por texto de búsqueda
     */
    filtrarEstudiantes(texto) {
        const textoLower = texto.toLowerCase().trim();

        if (textoLower === '') {
            this.estudiantesFiltrados = [...this.estudiantes];
        } else {
            this.estudiantesFiltrados = this.estudiantes.filter(est => {
                const nombreCompleto = `${est.nombre} ${est.apellido || ''}`.toLowerCase();
                return est.boleta.toLowerCase().includes(textoLower) ||
                       nombreCompleto.includes(textoLower) ||
                       (est.correo && est.correo.toLowerCase().includes(textoLower));
            });
        }

        this.renderizarTabla();
    }

    /**
     * Filtra estudiantes por estado
     */
    filtrarPorEstado(estado) {
        if (estado === 'todos') {
            this.estudiantesFiltrados = [...this.estudiantes];
        } else {
            this.estudiantesFiltrados = this.estudiantes.filter(est => est.estado === estado);
        }

        this.renderizarTabla();
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

        const modalHTML = `
            <div class="modal fade" id="modalDetalleEstudiante" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-user-graduate"></i>
                                Detalle del Estudiante
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
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

        // Remover modal anterior si existe
        const modalAnterior = document.getElementById('modalDetalleEstudiante');
        if (modalAnterior) {
            modalAnterior.remove();
        }

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalDetalleEstudiante'));
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
