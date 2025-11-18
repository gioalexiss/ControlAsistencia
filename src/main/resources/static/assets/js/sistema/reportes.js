/**
 * Gestor de Reportes de Asistencia
 * Maneja la visualización y filtrado de reportes de asistencia
 */

class ReporteManager {
    constructor() {
        this.docenteId = localStorage.getItem('docenteId');
        this.asistencias = [];
        this.asistenciasFiltradas = [];
        this.grupos = [];
        this.dataTable = null;
    }

    /**
     * Inicializa el gestor de reportes
     */
    async init() {
        console.log('📊 Inicializando ReporteManager...');

        if (!this.docenteId) {
            console.error('No se encontró ID de docente');
            return;
        }

        await this.cargarGrupos();
        await this.cargarTodasAsistencias();
        this.configurarEventListeners();

        console.log('✅ ReporteManager inicializado correctamente');
    }

    /**
     * Cargar todos los grupos del docente desde el horario
     */
    async cargarGrupos() {
        try {
            const response = await fetch(`/horario/obtener/${this.docenteId}`);
            if (!response.ok) throw new Error('Error al cargar horario');

            const unidades = await response.json();

            // Extraer todos los grupos de todas las unidades
            this.grupos = [];
            unidades.forEach(unidad => {
                if (unidad.grupos && unidad.grupos.length > 0) {
                    unidad.grupos.forEach(grupo => {
                        this.grupos.push({
                            id: grupo.id,
                            nombreGrupo: grupo.nombreGrupo,
                            nombreMateria: unidad.nombreUnidad,
                            idUnidad: unidad.id
                        });
                    });
                }
            });

            this.poblarSelectGrupos();
            console.log(`📚 ${this.grupos.length} grupos cargados`);
        } catch (error) {
            console.error('Error al cargar grupos:', error);
        }
    }

    /**
     * Poblar el select de grupos
     */
    poblarSelectGrupos() {
        const select = document.getElementById('selectGrupoReporte');
        if (!select) return;

        select.innerHTML = '<option value="">Todos los grupos</option>';

        this.grupos.forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo.id;
            option.textContent = `${grupo.nombreGrupo} - ${grupo.nombreMateria}`;
            select.appendChild(option);
        });
    }

    /**
     * Cargar todas las asistencias del docente
     */
    async cargarTodasAsistencias() {
        try {
            const response = await fetch(`/asistencia/todas/${this.docenteId}`);
            if (!response.ok) throw new Error('Error al cargar asistencias');

            this.asistencias = await response.json();
            this.asistenciasFiltradas = [...this.asistencias];
            this.renderizarTabla();

            console.log(`✅ ${this.asistencias.length} asistencias cargadas`);
        } catch (error) {
            console.error('Error al cargar asistencias:', error);
            this.mostrarError('Error al cargar las asistencias');
        }
    }

    /**
     * Aplicar filtros a las asistencias
     */
    aplicarFiltros() {
        let asistenciasFiltradas = [...this.asistencias];

        // Filtro por grupo
        const grupoSeleccionado = document.getElementById('selectGrupoReporte').value;
        if (grupoSeleccionado) {
            asistenciasFiltradas = asistenciasFiltradas.filter(
                a => a.grupoId == grupoSeleccionado
            );
        }

        // Filtro por rango de fechas
        const fechaInicio = document.getElementById('fechaInicioReporte').value;
        const fechaFin = document.getElementById('fechaFinReporte').value;

        if (fechaInicio) {
            const fechaInicioObj = new Date(fechaInicio + 'T00:00:00');
            asistenciasFiltradas = asistenciasFiltradas.filter(a => {
                const fechaAsistencia = new Date(a.fechaHora);
                return fechaAsistencia >= fechaInicioObj;
            });
        }

        if (fechaFin) {
            const fechaFinObj = new Date(fechaFin + 'T23:59:59');
            asistenciasFiltradas = asistenciasFiltradas.filter(a => {
                const fechaAsistencia = new Date(a.fechaHora);
                return fechaAsistencia <= fechaFinObj;
            });
        }

        this.asistenciasFiltradas = asistenciasFiltradas;
        this.renderizarTabla();
    }

    /**
     * Renderizar tabla de asistencias
     */
    renderizarTabla() {
        const tbody = document.getElementById('tbodyReporte');
        if (!tbody) return;

        // Destruir DataTable si existe
        if (this.dataTable) {
            this.dataTable.destroy();
            this.dataTable = null;
        }

        tbody.innerHTML = '';

        if (this.asistenciasFiltradas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5">
                        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted">No hay asistencias registradas</h5>
                        <p class="text-muted">Comienza a registrar asistencias desde la sección "Tomar Asistencia"</p>
                    </td>
                </tr>
            `;
            return;
        }

        this.asistenciasFiltradas.forEach((asistencia, index) => {
            const tr = this.crearFilaAsistencia(asistencia, index + 1);
            tbody.appendChild(tr);
        });

        // Inicializar DataTable
        setTimeout(() => {
            this.inicializarDataTable();
        }, 100);
    }

    /**
     * Crear fila de asistencia
     */
    crearFilaAsistencia(asistencia, numero) {
        const tr = document.createElement('tr');

        const fecha = new Date(asistencia.fechaHora);
        const fechaFormateada = fecha.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const horaFormateada = fecha.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const tipoBadge = asistencia.tipoAsistencia === 'PRESENTE'
            ? '<span class="badge bg-success">PRESENTE</span>'
            : asistencia.tipoAsistencia === 'RETARDO'
                ? '<span class="badge bg-warning">RETARDO</span>'
                : '<span class="badge bg-danger">FALTA</span>';

        tr.innerHTML = `
            <td class="text-center">${numero}</td>
            <td>${fechaFormateada}</td>
            <td>${horaFormateada}</td>
            <td><strong>${asistencia.boletaEstudiante || 'N/A'}</strong></td>
            <td>${asistencia.nombreEstudiante || 'N/A'}</td>
            <td>${asistencia.nombreGrupo || 'Sin grupo'}</td>
            <td>${asistencia.nombreUnidad || 'Sin materia'}</td>
            <td class="text-center">${tipoBadge}</td>
        `;

        return tr;
    }

    /**
     * Inicializar DataTable
     */
    inicializarDataTable() {
        if (this.dataTable) return;

        if (typeof $ === 'undefined' || !$.fn.DataTable) {
            console.warn('DataTables no está disponible');
            return;
        }

        try {
            this.dataTable = $('#tablaReporte').DataTable({
                language: {
                    "sProcessing": "Procesando...",
                    "sLengthMenu": "Mostrar _MENU_ registros",
                    "sZeroRecords": "No se encontraron resultados",
                    "sEmptyTable": "Ningún dato disponible en esta tabla",
                    "sInfo": "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
                    "sInfoEmpty": "Mostrando registros del 0 al 0 de un total de 0 registros",
                    "sInfoFiltered": "(filtrado de un total de _MAX_ registros)",
                    "sSearch": "Buscar:",
                    "oPaginate": {
                        "sFirst": "Primero",
                        "sLast": "Último",
                        "sNext": "Siguiente",
                        "sPrevious": "Anterior"
                    }
                },
                pageLength: 25,
                order: [[1, 'desc'], [2, 'desc']], // Ordenar por fecha y hora descendente
                dom: 'Bfrtip',
                buttons: [
                    {
                        extend: 'excelHtml5',
                        text: '<i class="fas fa-file-excel"></i> Exportar a Excel',
                        className: 'btn btn-success btn-sm',
                        title: 'Reporte de Asistencias',
                        exportOptions: {
                            columns: [0, 1, 2, 3, 4, 5, 6, 7]
                        }
                    },
                    {
                        extend: 'pdfHtml5',
                        text: '<i class="fas fa-file-pdf"></i> Exportar a PDF',
                        className: 'btn btn-danger btn-sm',
                        title: 'Reporte de Asistencias',
                        exportOptions: {
                            columns: [0, 1, 2, 3, 4, 5, 6, 7]
                        },
                        orientation: 'landscape',
                        pageSize: 'LEGAL'
                    },
                    {
                        extend: 'print',
                        text: '<i class="fas fa-print"></i> Imprimir',
                        className: 'btn btn-info btn-sm',
                        title: 'Reporte de Asistencias',
                        exportOptions: {
                            columns: [0, 1, 2, 3, 4, 5, 6, 7]
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
     * Configurar event listeners
     */
    configurarEventListeners() {
        // Filtro por grupo
        const selectGrupo = document.getElementById('selectGrupoReporte');
        if (selectGrupo) {
            selectGrupo.addEventListener('change', () => {
                this.aplicarFiltros();
            });
        }

        // Botón generar reporte (aplicar filtros)
        const btnGenerar = document.getElementById('btnGenerarReporte');
        if (btnGenerar) {
            btnGenerar.addEventListener('click', () => {
                this.aplicarFiltros();
            });
        }

        // Filtros de fecha
        const fechaInicio = document.getElementById('fechaInicioReporte');
        const fechaFin = document.getElementById('fechaFinReporte');

        if (fechaInicio) {
            fechaInicio.addEventListener('change', () => {
                this.aplicarFiltros();
            });
        }

        if (fechaFin) {
            fechaFin.addEventListener('change', () => {
                this.aplicarFiltros();
            });
        }
    }

    /**
     * Mostrar mensaje de error
     */
    mostrarError(mensaje) {
        console.error(mensaje);
        alert(mensaje);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.reporteManager = new ReporteManager();
});
