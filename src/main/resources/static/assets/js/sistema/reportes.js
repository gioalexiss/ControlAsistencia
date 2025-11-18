/**
 * Gestor de Reportes de Asistencia
 * Maneja reportes agrupados por sesión (grupo + materia + fecha)
 */

class ReporteManager {
    constructor() {
        this.docenteId = localStorage.getItem('docenteId');
        this.asistencias = [];
        this.reportes = []; // Reportes agrupados por sesión
        this.reportesFiltrados = [];
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
     * Cargar todas las asistencias y agrupar por sesión
     */
    async cargarTodasAsistencias() {
        try {
            const response = await fetch(`/asistencia/todas/${this.docenteId}`);
            if (!response.ok) throw new Error('Error al cargar asistencias');

            this.asistencias = await response.json();
            this.agruparPorSesion();
            this.reportesFiltrados = [...this.reportes];
            this.renderizarTabla();

            console.log(`✅ ${this.asistencias.length} asistencias cargadas, ${this.reportes.length} sesiones encontradas`);
        } catch (error) {
            console.error('Error al cargar asistencias:', error);
            this.mostrarError('Error al cargar las asistencias');
        }
    }

    /**
     * Agrupar asistencias por sesión (grupo + materia + fecha)
     */
    agruparPorSesion() {
        const sesionesMap = new Map();

        this.asistencias.forEach(asistencia => {
            const fecha = new Date(asistencia.fechaHora);
            const fechaKey = fecha.toISOString().split('T')[0]; // Solo la fecha YYYY-MM-DD
            const grupoId = asistencia.grupoId || 'sin-grupo';
            const unidadId = asistencia.unidadId || 'sin-unidad';

            // Clave única para cada sesión: fecha + grupo + unidad
            const key = `${fechaKey}-${grupoId}-${unidadId}`;

            if (!sesionesMap.has(key)) {
                sesionesMap.set(key, {
                    fecha: fechaKey,
                    grupoId: grupoId,
                    unidadId: unidadId,
                    nombreGrupo: asistencia.nombreGrupo || 'Sin grupo',
                    nombreUnidad: asistencia.nombreUnidad || 'Sin materia',
                    asistencias: []
                });
            }

            sesionesMap.get(key).asistencias.push(asistencia);
        });

        // Convertir Map a Array y ordenar por fecha descendente
        this.reportes = Array.from(sesionesMap.values())
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    /**
     * Aplicar filtro por grupo
     */
    aplicarFiltros() {
        const grupoSeleccionado = document.getElementById('selectGrupoReporte').value;

        if (!grupoSeleccionado) {
            this.reportesFiltrados = [...this.reportes];
        } else {
            this.reportesFiltrados = this.reportes.filter(
                r => r.grupoId == grupoSeleccionado
            );
        }

        this.renderizarTabla();
    }

    /**
     * Renderizar tabla de reportes
     */
    renderizarTabla() {
        const tbody = document.getElementById('tbodyReportes');
        if (!tbody) return;

        // Destruir DataTable si existe
        if (this.dataTable) {
            this.dataTable.destroy();
            this.dataTable = null;
        }

        tbody.innerHTML = '';

        if (this.reportesFiltrados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5">
                        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted">No hay reportes disponibles</h5>
                        <p class="text-muted">Los reportes se generan automáticamente al registrar asistencias</p>
                    </td>
                </tr>
            `;
            return;
        }

        this.reportesFiltrados.forEach((reporte, index) => {
            const tr = this.crearFilaReporte(reporte, index + 1);
            tbody.appendChild(tr);
        });

        // Inicializar DataTable (sin clear para preservar datos)
        setTimeout(() => {
            this.inicializarDataTable();
        }, 100);
    }

    /**
     * Crear fila de reporte
     */
    crearFilaReporte(reporte, numero) {
        const tr = document.createElement('tr');

        const fecha = new Date(reporte.fecha + 'T00:00:00');
        const fechaFormateada = fecha.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const totalAlumnos = reporte.asistencias.length;

        // Serializar el reporte para pasarlo a las funciones
        const reporteData = JSON.stringify(reporte);
        const reporteDataEscaped = reporteData.replace(/"/g, '&quot;');

        tr.innerHTML = `
            <td class="text-center">${numero}</td>
            <td>${fechaFormateada}</td>
            <td><strong>${reporte.nombreGrupo}</strong></td>
            <td>${reporte.nombreUnidad}</td>
            <td class="text-center">
                <span class="badge bg-primary">${totalAlumnos} alumnos</span>
            </td>
            <td class="text-center">
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-info btn-sm btn-ver-detalle"
                            data-reporte="${reporteDataEscaped}"
                            title="Ver lista de alumnos">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-success btn-sm btn-descargar-excel"
                            data-reporte="${reporteDataEscaped}"
                            title="Descargar Excel">
                        <i class="fas fa-file-excel"></i>
                    </button>
                    <button class="btn btn-danger btn-sm btn-descargar-pdf"
                            data-reporte="${reporteDataEscaped}"
                            title="Descargar PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button class="btn btn-warning btn-sm btn-eliminar-reporte"
                            data-reporte="${reporteDataEscaped}"
                            title="Eliminar reporte">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
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
            this.dataTable = $('#tablaReportes').DataTable({
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
                pageLength: 10,
                order: [[1, 'desc']], // Ordenar por fecha descendente
                destroy: true
            });
        } catch (error) {
            console.error('Error al inicializar DataTable:', error);
            this.dataTable = null;
        }
    }

    /**
     * Ver detalle del reporte (lista de alumnos)
     */
    verDetalleReporte(reporte) {
        // Limpiar modales anteriores
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        const modalAnterior = document.getElementById('modalDetalleReporte');
        if (modalAnterior) {
            const modalInstance = bootstrap.Modal.getInstance(modalAnterior);
            if (modalInstance) {
                modalInstance.dispose();
            }
            modalAnterior.remove();
        }

        const fecha = new Date(reporte.fecha + 'T00:00:00');
        const fechaFormateada = fecha.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Generar lista de estudiantes
        let listaEstudiantes = '';
        reporte.asistencias.forEach((asistencia, index) => {
            const hora = new Date(asistencia.fechaHora).toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit'
            });
            listaEstudiantes += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${asistencia.boletaEstudiante}</td>
                    <td>${asistencia.nombreEstudiante}</td>
                    <td>${hora}</td>
                    <td><span class="badge bg-success">${asistencia.tipoAsistencia}</span></td>
                </tr>
            `;
        });

        const modalHTML = `
            <div class="modal fade" id="modalDetalleReporte" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-clipboard-list"></i>
                                Detalle del Reporte
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <p class="mb-1"><strong>Fecha:</strong> ${fechaFormateada}</p>
                                <p class="mb-1"><strong>Grupo:</strong> ${reporte.nombreGrupo}</p>
                                <p class="mb-0"><strong>Materia:</strong> ${reporte.nombreUnidad}</p>
                            </div>
                            <h6>Lista de Alumnos (${reporte.asistencias.length})</h6>
                            <div class="table-responsive">
                                <table class="table table-sm table-striped">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>#</th>
                                            <th>Boleta</th>
                                            <th>Nombre</th>
                                            <th>Hora</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${listaEstudiantes}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modalElement = document.getElementById('modalDetalleReporte');
        const modal = new bootstrap.Modal(modalElement);

        modalElement.addEventListener('hidden.bs.modal', function (event) {
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            modalElement.remove();
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('padding-right');
        }, { once: true });

        modal.show();
    }

    /**
     * Descargar reporte como Excel
     */
    descargarExcel(reporte) {
        // Crear tabla HTML
        let html = `
            <table>
                <tr>
                    <th colspan="5" style="text-align:center; font-size:16px; font-weight:bold;">
                        Reporte de Asistencia
                    </th>
                </tr>
                <tr>
                    <th>Fecha:</th>
                    <td colspan="4">${reporte.fecha}</td>
                </tr>
                <tr>
                    <th>Grupo:</th>
                    <td colspan="4">${reporte.nombreGrupo}</td>
                </tr>
                <tr>
                    <th>Materia:</th>
                    <td colspan="4">${reporte.nombreUnidad}</td>
                </tr>
                <tr><td colspan="5">&nbsp;</td></tr>
                <tr style="background-color:#4472C4; color:white; font-weight:bold;">
                    <th>#</th>
                    <th>Boleta</th>
                    <th>Nombre</th>
                    <th>Hora</th>
                    <th>Estado</th>
                </tr>
        `;

        reporte.asistencias.forEach((asistencia, index) => {
            const hora = new Date(asistencia.fechaHora).toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit'
            });
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${asistencia.boletaEstudiante}</td>
                    <td>${asistencia.nombreEstudiante}</td>
                    <td>${hora}</td>
                    <td>${asistencia.tipoAsistencia}</td>
                </tr>
            `;
        });

        html += '</table>';

        // Convertir a blob y descargar
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_${reporte.nombreGrupo}_${reporte.fecha}.xls`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Descargar reporte como PDF
     */
    descargarPDF(reporte) {
        // Usar window.print() con una página personalizada
        const fecha = new Date(reporte.fecha + 'T00:00:00');
        const fechaFormateada = fecha.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let listaEstudiantes = '';
        reporte.asistencias.forEach((asistencia, index) => {
            const hora = new Date(asistencia.fechaHora).toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit'
            });
            listaEstudiantes += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${asistencia.boletaEstudiante}</td>
                    <td>${asistencia.nombreEstudiante}</td>
                    <td>${hora}</td>
                    <td>${asistencia.tipoAsistencia}</td>
                </tr>
            `;
        });

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reporte de Asistencia</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { text-align: center; color: #333; }
                    .info { margin: 20px 0; }
                    .info p { margin: 5px 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #4472C4; color: white; }
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <h1>Reporte de Asistencia</h1>
                <div class="info">
                    <p><strong>Fecha:</strong> ${fechaFormateada}</p>
                    <p><strong>Grupo:</strong> ${reporte.nombreGrupo}</p>
                    <p><strong>Materia:</strong> ${reporte.nombreUnidad}</p>
                    <p><strong>Total de Alumnos:</strong> ${reporte.asistencias.length}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Boleta</th>
                            <th>Nombre</th>
                            <th>Hora</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${listaEstudiantes}
                    </tbody>
                </table>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    }

    /**
     * Configurar event listeners
     */
    configurarEventListeners() {
        // Botón filtrar
        const btnFiltrar = document.getElementById('btnFiltrarReporte');
        if (btnFiltrar) {
            btnFiltrar.addEventListener('click', () => {
                this.aplicarFiltros();
            });
        }

        // Filtro por grupo
        const selectGrupo = document.getElementById('selectGrupoReporte');
        if (selectGrupo) {
            selectGrupo.addEventListener('change', () => {
                this.aplicarFiltros();
            });
        }

        // Event delegation para botones de acción
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-ver-detalle')) {
                const btn = e.target.closest('.btn-ver-detalle');
                const reporteData = btn.getAttribute('data-reporte');
                const reporte = JSON.parse(reporteData.replace(/&quot;/g, '"'));
                this.verDetalleReporte(reporte);
            }

            if (e.target.closest('.btn-descargar-excel')) {
                const btn = e.target.closest('.btn-descargar-excel');
                const reporteData = btn.getAttribute('data-reporte');
                const reporte = JSON.parse(reporteData.replace(/&quot;/g, '"'));
                this.descargarExcel(reporte);
            }

            if (e.target.closest('.btn-descargar-pdf')) {
                const btn = e.target.closest('.btn-descargar-pdf');
                const reporteData = btn.getAttribute('data-reporte');
                const reporte = JSON.parse(reporteData.replace(/&quot;/g, '"'));
                this.descargarPDF(reporte);
            }

            if (e.target.closest('.btn-eliminar-reporte')) {
                const btn = e.target.closest('.btn-eliminar-reporte');
                const reporteData = btn.getAttribute('data-reporte');
                const reporte = JSON.parse(reporteData.replace(/&quot;/g, '"'));
                this.mostrarModalEliminarReporte(reporte);
            }
        });
    }

    /**
     * Mostrar modal de confirmación para eliminar reporte
     */
    mostrarModalEliminarReporte(reporte) {
        // Limpiar modales anteriores
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        const modalAnterior = document.getElementById('modalEliminarReporte');
        if (modalAnterior) {
            const modalInstance = bootstrap.Modal.getInstance(modalAnterior);
            if (modalInstance) {
                modalInstance.dispose();
            }
            modalAnterior.remove();
        }

        const fecha = new Date(reporte.fecha + 'T00:00:00');
        const fechaFormateada = fecha.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const modalHTML = `
            <div class="modal fade" id="modalEliminarReporte" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-trash-alt"></i>
                                Eliminar Reporte de Asistencia
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-3">
                                <i class="fas fa-exclamation-triangle fa-4x text-danger"></i>
                            </div>
                            <h6 class="text-center mb-3">¿Está seguro de eliminar este reporte?</h6>
                            <div class="alert alert-info">
                                <p class="mb-1"><strong>Fecha:</strong> ${fechaFormateada}</p>
                                <p class="mb-1"><strong>Grupo:</strong> ${reporte.nombreGrupo}</p>
                                <p class="mb-1"><strong>Materia:</strong> ${reporte.nombreUnidad}</p>
                                <p class="mb-0"><strong>Total de registros:</strong> ${reporte.asistencias.length} asistencias</p>
                            </div>
                            <div class="alert alert-warning">
                                <p class="mb-0"><i class="fas fa-info-circle"></i> <strong>Advertencia:</strong> Esto eliminará todos los registros de asistencia de esta sesión. Esta acción no se puede deshacer.</p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            <button type="button" class="btn btn-danger" id="btnConfirmarEliminarReporte">
                                <i class="fas fa-trash"></i> Sí, Eliminar Reporte
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modalElement = document.getElementById('modalEliminarReporte');
        const modal = new bootstrap.Modal(modalElement);

        modalElement.addEventListener('hidden.bs.modal', function (event) {
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            modalElement.remove();
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('padding-right');
        }, { once: true });

        document.getElementById('btnConfirmarEliminarReporte').addEventListener('click', async () => {
            modal.hide();
            await this.eliminarReporte(reporte);
        });

        modal.show();
    }

    /**
     * Eliminar reporte (elimina todas las asistencias de la sesión)
     */
    async eliminarReporte(reporte) {
        try {
            // Eliminar todas las asistencias del reporte
            let errores = 0;
            let eliminadas = 0;

            for (const asistencia of reporte.asistencias) {
                try {
                    const response = await fetch(`/asistencia/${asistencia.id}`, { method: 'DELETE' });
                    const resultado = await response.json();
                    if (resultado.success) {
                        eliminadas++;
                    } else {
                        errores++;
                    }
                } catch (error) {
                    console.error(`Error al eliminar asistencia ${asistencia.id}:`, error);
                    errores++;
                }
            }

            if (errores === 0) {
                alert(`✅ Reporte eliminado correctamente\n\n${eliminadas} registros de asistencia eliminados.`);
            } else {
                alert(`⚠️ Reporte eliminado parcialmente\n\n${eliminadas} registros eliminados\n${errores} errores encontrados`);
            }

            // Recargar los reportes
            await this.cargarTodasAsistencias();

        } catch (error) {
            console.error('Error al eliminar reporte:', error);
            alert('❌ Error al eliminar el reporte: ' + error.message);
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
