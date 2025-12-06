/**
 * Gestor de Grupos del Docente
 * Maneja la carga, visualización y acciones de los grupos
 */

class GrupoManager {
    constructor() {
        this.docenteId = localStorage.getItem('docenteId');
        this.grupos = [];
        this.estadisticas = {};
        this.grupoSeleccionado = null;
    }

    /**
     * Inicializa el gestor de grupos
     */
    async init() {
        if (!this.docenteId) {
            console.error('No se encontró ID de docente');
            return;
        }

        // Mostrar indicador de carga
        const tbody = document.getElementById('tbodyGrupos');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <p class="mt-2 text-muted">Cargando grupos...</p>
                    </td>
                </tr>
            `;
        }

        await this.cargarGrupos();
        await this.cargarEstadisticas();
        this.configurarEventListeners();
        this.configurarEventosGlobales();
    }

    /**
     * Configura eventos globales (escuchar cambios desde otras secciones)
     */
    configurarEventosGlobales() {
        // Escuchar evento de actualización de horarios
        // Este evento se dispara cuando se guarda o elimina una unidad en "Mi Horario"
        $(document).off('horariosActualizados.grupoManager');
        $(document).on('horariosActualizados.grupoManager', async () => {
            console.log('📢 Evento horariosActualizados recibido - Actualizando grupos...');
            await this.cargarGrupos();
            await this.cargarEstadisticas();
        });
    }

    /**
     * Carga todos los grupos del docente desde el horario
     * Usa el mismo endpoint que horario.js para garantizar datos consistentes
     */
    async cargarGrupos() {
        try {
            const response = await fetch(`/horario/obtener/${this.docenteId}`);

            if (!response.ok) {
                throw new Error('Error al cargar horario');
            }

            const unidades = await response.json();
            this.grupos = unidades || [];

            console.log(`📚 Grupos cargados: ${this.grupos.length} unidades desde horario`);
            this.renderizarGrupos();
        } catch (error) {
            console.error('Error al cargar grupos:', error);
            this.mostrarMensajeSinGrupos();
        }
    }

    /**
     * Carga las estadísticas generales
     */
    async cargarEstadisticas() {
        try {
            const response = await fetch(`/grupos/docente/${this.docenteId}/estadisticas`);
            const data = await response.json();

            if (data.success) {
                this.estadisticas = data;
                this.actualizarWidgetsEstadisticas();
            }
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    }

    /**
     * Renderiza la tabla de grupos
     */
    renderizarGrupos() {
        const tbody = document.getElementById('tbodyGrupos');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.grupos.length === 0) {
            this.mostrarMensajeSinGrupos();
            return;
        }

        console.log('🔍 Renderizando grupos:', this.grupos);

        let totalGruposRenderizados = 0;

        this.grupos.forEach((unidad, indexUnidad) => {
            console.log(`📖 Unidad ${indexUnidad}:`, unidad.nombreUnidad, 'Grupos:', unidad.grupos);

            if (unidad.grupos && unidad.grupos.length > 0) {
                unidad.grupos.forEach((grupo, indexGrupo) => {
                    console.log(`  👥 Renderizando grupo ${indexGrupo}:`, grupo);
                    const fila = this.crearFilaGrupo(grupo, unidad);
                    tbody.appendChild(fila);
                    totalGruposRenderizados++;
                });
            } else {
                console.warn(`⚠️ Unidad "${unidad.nombreUnidad}" no tiene grupos`);
            }
        });

        console.log(`✅ Total grupos renderizados: ${totalGruposRenderizados}`);

        // Inicializar o actualizar DataTable
        this.inicializarDataTable();
    }

    /**
     * Inicializa o actualiza el DataTable
     */
    inicializarDataTable() {
        if (!$.fn.DataTable) {
            console.warn('⚠️ DataTable no está disponible');
            return;
        }

        const tabla = $('#tablaGruposDinamica');
        const tbody = document.getElementById('tbodyGrupos');

        console.log('🔧 Inicializando DataTable...');
        console.log('  📊 Filas en tbody antes de DataTable:', tbody ? tbody.children.length : 0);
        console.log('  📋 HTML del tbody:', tbody ? tbody.innerHTML.substring(0, 200) : 'tbody no encontrado');

        // Si el DataTable ya existe, destruirlo primero
        if ($.fn.DataTable.isDataTable(tabla)) {
            console.log('  🗑️ Destruyendo DataTable existente');
            tabla.DataTable().destroy();
        }

        // Crear nuevo DataTable inmediatamente (el DOM ya está listo)
        console.log('  ✨ Creando nuevo DataTable');
        const dt = tabla.DataTable({
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json'
            },
            pageLength: 10,
            order: [[0, 'asc']],
            responsive: true,
            destroy: true
        });

        console.log('  ✅ DataTable creado, filas visibles:', dt.rows().count());
    }

    /**
     * Crea una fila de la tabla para un grupo
     */
    crearFilaGrupo(grupo, unidad) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-grupo-id', grupo.id);

        tr.innerHTML = `
            <td>${grupo.nombreGrupo || 'N/A'}</td>
            <td>${unidad.nombreUnidad || 'N/A'}</td>
            <td>
                <span class="badge badge-info" id="estudiantes-${grupo.id}">
                    <i class="fas fa-spinner fa-spin"></i>
                </span>
            </td>
            <td>
                <button class="btn btn-success btn-sm btn-importar-estudiantes"
                        data-grupo-id="${grupo.id}"
                        data-grupo-nombre="${grupo.nombreGrupo}"
                        data-unidad-id="${unidad.id}"
                        data-unidad-nombre="${unidad.nombreUnidad}"
                        title="Importar Estudiantes desde Excel">
                    <i class="fas fa-file-excel"></i> Importar Alumnos
                </button>
            </td>
        `;

        // Cargar contador de estudiantes
        this.cargarContadorEstudiantes(grupo.id);

        return tr;
    }

    /**
     * Carga el contador de estudiantes de un grupo
     */
    async cargarContadorEstudiantes(grupoId) {
        try {
            const response = await fetch(`/estudiantes/grupo/${grupoId}`);
            const estudiantes = await response.json();

            const badge = document.getElementById(`estudiantes-${grupoId}`);
            if (badge) {
                badge.innerHTML = `<i class="fas fa-user-graduate"></i> ${estudiantes.length}`;

                if (estudiantes.length > 0) {
                    badge.classList.remove('badge-info');
                    badge.classList.add('badge-success');
                } else {
                    badge.classList.remove('badge-info');
                    badge.classList.add('badge-warning');
                }
            }
        } catch (error) {
            console.error(`Error al cargar estudiantes del grupo ${grupoId}:`, error);
            const badge = document.getElementById(`estudiantes-${grupoId}`);
            if (badge) {
                badge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
                badge.classList.remove('badge-info');
                badge.classList.add('badge-danger');
            }
        }
    }

    /**
     * Actualiza los widgets de estadísticas
     */
    actualizarWidgetsEstadisticas() {
        // Actualizar Total de Grupos
        const elemTotalGrupos = document.getElementById('widgetTotalGrupos');
        if (elemTotalGrupos) {
            elemTotalGrupos.textContent = this.estadisticas.totalGrupos || 0;
        }

        // Actualizar Total de Estudiantes
        const elemTotalEstudiantes = document.getElementById('widgetTotalEstudiantes');
        if (elemTotalEstudiantes) {
            elemTotalEstudiantes.textContent = this.estadisticas.totalEstudiantes || 0;
        }

        // Actualizar Total de Unidades
        const elemTotalUnidades = document.getElementById('widgetTotalUnidades');
        if (elemTotalUnidades) {
            elemTotalUnidades.textContent = this.estadisticas.totalUnidades || 0;
        }
    }

    /**
     * Configura los event listeners
     */
    configurarEventListeners() {
        // Event delegation para botones de importar estudiantes
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-importar-estudiantes')) {
                const btn = e.target.closest('.btn-importar-estudiantes');
                const grupoId = btn.getAttribute('data-grupo-id');
                const grupoNombre = btn.getAttribute('data-grupo-nombre');
                const unidadId = btn.getAttribute('data-unidad-id');
                const unidadNombre = btn.getAttribute('data-unidad-nombre');
                this.mostrarModalImportarEstudiantes(grupoId, grupoNombre, unidadId, unidadNombre);
            }

            if (e.target.closest('.btn-tomar-asistencia')) {
                const btn = e.target.closest('.btn-tomar-asistencia');
                const grupoId = btn.getAttribute('data-grupo-id');
                this.tomarAsistencia(grupoId);
            }
        });
    }

    /**
     * Muestra el modal para importar estudiantes desde Excel
     */
    mostrarModalImportarEstudiantes(grupoId, grupoNombre, unidadId, unidadNombre) {
        this.grupoSeleccionado = {
            id: grupoId,
            nombre: grupoNombre,
            unidadId: unidadId,
            unidadNombre: unidadNombre
        };

        // Limpiar todos los backdrops y modales anteriores
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        const modalAnterior = document.getElementById('modalImportarEstudiantes');
        if (modalAnterior) {
            const modalInstance = bootstrap.Modal.getInstance(modalAnterior);
            if (modalInstance) {
                modalInstance.dispose();
            }
            modalAnterior.remove();
        }

        // Crear modal dinámicamente
        const modalHTML = `
            <div class="modal fade" id="modalImportarEstudiantes" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-file-excel"></i>
                                Importar Estudiantes - ${grupoNombre} (${unidadNombre})
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle"></i>
                                El archivo Excel debe contener las columnas: <strong>Boleta</strong>, <strong>Nombre</strong> y <strong>Correo</strong>
                            </div>

                            <div class="upload-area text-center p-5" id="excelUploadArea" style="
                                border: 2px dashed #28a745;
                                border-radius: 10px;
                                background: #f8f9fa;
                                cursor: pointer;">
                                <i class="fas fa-file-excel fa-3x text-success mb-3"></i>
                                <h5>Arrastra tu archivo Excel aquí</h5>
                                <p class="text-muted">o haz clic para seleccionar</p>
                                <input type="file" id="excelFileInput" accept=".xlsx,.xls" style="display: none;">
                                <button type="button" class="btn btn-success" id="btnSelectExcel">
                                    <i class="fas fa-folder-open"></i> Seleccionar Archivo
                                </button>
                            </div>

                            <div id="excelFileInfo" style="display: none;" class="mt-3">
                                <div class="alert alert-success">
                                    <strong>Archivo seleccionado:</strong> <span id="excelFileName"></span>
                                </div>
                            </div>

                            <div id="estudiantesExtraidos" style="display: none;" class="mt-3">
                                <h6>Estudiantes encontrados: <span id="totalExtraidos" class="badge badge-success"></span></h6>
                                <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                                    <table class="table table-sm table-striped">
                                        <thead class="table-dark">
                                            <tr>
                                                <th>Boleta</th>
                                                <th>Nombre</th>
                                                <th>Correo</th>
                                            </tr>
                                        </thead>
                                        <tbody id="tbodyEstudiantesExtraidos"></tbody>
                                    </table>
                                </div>
                            </div>

                            <div id="resultadoImportacion" style="display: none;" class="mt-3"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-success" id="btnGuardarEstudiantesExcel" style="display: none;">
                                <i class="fas fa-save"></i> Guardar Estudiantes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Inicializar modal de Bootstrap
        const modalElement = document.getElementById('modalImportarEstudiantes');
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

        // Configurar eventos del modal
        this.configurarEventosModalExcel();
    }

    /**
     * Configura los eventos del modal de Excel
     */
    configurarEventosModalExcel() {
        const uploadArea = document.getElementById('excelUploadArea');
        const fileInput = document.getElementById('excelFileInput');
        const btnSelect = document.getElementById('btnSelectExcel');

        // Click para seleccionar archivo
        btnSelect.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('click', (e) => {
            if (e.target !== btnSelect) fileInput.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#155724';
            uploadArea.style.background = '#d4edda';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#28a745';
            uploadArea.style.background = '#f8f9fa';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#28a745';
            uploadArea.style.background = '#f8f9fa';

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                this.procesarArchivoExcel(files[0]);
            }
        });

        // Change en input file
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.procesarArchivoExcel(e.target.files[0]);
            }
        });
    }

    /**
     * Procesa el archivo Excel seleccionado
     */
    async procesarArchivoExcel(file) {
        // Mostrar nombre del archivo
        document.getElementById('excelFileName').textContent = file.name;
        document.getElementById('excelFileInfo').style.display = 'block';

        // Crear FormData
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/estudiantes/extraer-excel', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.mostrarEstudiantesExtraidos(data.estudiantes);
            } else {
                this.mostrarError(data.mensaje || 'Error al procesar el archivo Excel');
            }
        } catch (error) {
            console.error('Error al procesar Excel:', error);
            this.mostrarError('Error al procesar el archivo Excel');
        }
    }

    /**
     * Muestra los estudiantes extraídos del Excel
     */
    mostrarEstudiantesExtraidos(estudiantes) {
        this.estudiantesTemporales = estudiantes;

        document.getElementById('totalExtraidos').textContent = estudiantes.length;
        document.getElementById('estudiantesExtraidos').style.display = 'block';
        document.getElementById('btnGuardarEstudiantesExcel').style.display = 'block';

        const tbody = document.getElementById('tbodyEstudiantesExtraidos');
        tbody.innerHTML = '';

        estudiantes.forEach(est => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${est.boleta}</td>
                <td>${est.nombre}</td>
                <td>${est.correo}</td>
            `;
            tbody.appendChild(tr);
        });

        // Configurar botón de guardar
        document.getElementById('btnGuardarEstudiantesExcel').onclick = () => {
            this.guardarEstudiantesExcel();
        };
    }

    /**
     * Guarda los estudiantes extraídos en el grupo
     */
    async guardarEstudiantesExcel() {
        if (!this.grupoSeleccionado || !this.estudiantesTemporales) {
            this.mostrarError('No hay estudiantes para guardar');
            return;
        }

        const btnGuardar = document.getElementById('btnGuardarEstudiantesExcel');
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

        try {
            const response = await fetch(`/estudiantes/guardar-desde-excel/${this.grupoSeleccionado.id}/${this.grupoSeleccionado.unidadId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.estudiantesTemporales)
            });

            const data = await response.json();

            if (data.success) {
                this.mostrarResultadoImportacion(data);
                // Recargar contador de estudiantes
                this.cargarContadorEstudiantes(this.grupoSeleccionado.id);
                // Recargar estadísticas
                this.cargarEstadisticas();
            } else {
                this.mostrarError(data.mensaje || 'Error al guardar estudiantes');
            }
        } catch (error) {
            console.error('Error al guardar estudiantes:', error);
            this.mostrarError('Error al guardar los estudiantes');
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar Estudiantes';
        }
    }

    /**
     * Muestra el resultado de la importación
     */
    mostrarResultadoImportacion(data) {
        const divResultado = document.getElementById('resultadoImportacion');
        divResultado.style.display = 'block';

        let alertClass = 'alert-success';
        if (data.errores > 0) {
            alertClass = 'alert-warning';
        }

        divResultado.innerHTML = `
            <div class="alert ${alertClass}">
                <h6><i class="fas fa-check-circle"></i> Importación completada</h6>
                <ul class="mb-0">
                    <li>Estudiantes nuevos: <strong>${data.nuevos}</strong></li>
                    <li>Estudiantes vinculados (ya existían): <strong>${data.vinculados || 0}</strong></li>
                    <li>Estudiantes actualizados: <strong>${data.actualizados || 0}</strong></li>
                    <li>Total procesados: <strong>${data.totalProcesados}</strong></li>
                    ${data.errores > 0 ? `<li class="text-danger">Errores: <strong>${data.errores}</strong></li>` : ''}
                </ul>
            </div>
        `;

        // Ocultar botón de guardar
        document.getElementById('btnGuardarEstudiantesExcel').style.display = 'none';
    }

    /**
     * Función para tomar asistencia (placeholder)
     */
    tomarAsistencia(grupoId) {
        alert(`Función de tomar asistencia para grupo ${grupoId} - Próximamente`);
    }

    /**
     * Muestra mensaje cuando no hay grupos
     */
    mostrarMensajeSinGrupos() {
        const tbody = document.getElementById('tbodyGrupos');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-5">
                        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted">No hay grupos registrados</h5>
                        <p class="text-muted">Agrega tus horarios en la sección "Mi Horario" para comenzar</p>
                    </td>
                </tr>
            `;
        }
    }

    /**
     * Muestra un mensaje de error
     */
    mostrarError(mensaje) {
        console.error(mensaje);
        // Aquí puedes implementar un sistema de notificaciones toast
        alert(mensaje);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.grupoManager = new GrupoManager();
    // La inicialización se hará cuando se navegue a la sección de grupos
});
