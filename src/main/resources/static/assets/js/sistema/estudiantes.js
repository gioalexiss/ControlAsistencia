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
        this.eventListenersConfigurados = false;
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
     * Carga la lista de grupos del docente desde el horario registrado
     */
    async cargarGrupos() {
        try {
            // Obtener el horario completo que incluye todas las unidades y sus grupos
            const response = await fetch(`/horario/obtener/${this.docenteId}`);

            if (!response.ok) {
                throw new Error('Error al cargar horario');
            }

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
        } catch (error) {
            console.error('Error al cargar grupos:', error);
        }
    }

    /**
     * Llena el select de grupos con los datos obtenidos del horario
     */
    poblarSelectGrupos() {
        const selectGrupo = document.getElementById('selectGrupoEstudiante');
        if (!selectGrupo) return;

        // Limpiar opciones existentes excepto la primera
        selectGrupo.innerHTML = '<option value="">Todos los grupos</option>';

        // Agregar opciones de grupos ordenados por materia
        this.grupos.forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo.id;
            option.textContent = `${grupo.nombreGrupo} - ${grupo.nombreMateria}`;
            selectGrupo.appendChild(option);
        });
    }

    /**
     * Carga todos los estudiantes del docente con información de grupos
     */
    async cargarEstudiantes() {
        try {
            const response = await fetch(`/estudiantes/docente/${this.docenteId}/con-grupos`);

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
                    const nombreCompleto = estudiante.nombre; // Ya contiene el nombre completo
                    const estadoBadge = estudiante.estado === 'activo'
                        ? '<span class="badge badge-success">Activo</span>'
                        : '<span class="badge badge-secondary">Inactivo</span>';

                    this.dataTable.row.add([
                        index + 1,
                        `<strong>${estudiante.boleta}</strong>`,
                        nombreCompleto,
                        estudiante.correo || 'No registrado',
                        estadoBadge,
                        `<div class="btn-group" role="group">
                            <button class="btn btn-info btn-sm btn-ver-detalle" data-estudiante-id="${estudiante.id}" title="Ver detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-warning btn-sm btn-editar-estudiante" data-estudiante-id="${estudiante.id}" title="Editar estudiante">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-sm btn-eliminar-estudiante" data-estudiante-id="${estudiante.id}" title="Eliminar estudiante">
                                <i class="fas fa-trash"></i>
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
                        <p class="text-muted">Agrega estudiantes manualmente o importa desde la sección "Mis Grupos"</p>
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

        // El nombre ya contiene el nombre completo
        const nombreCompleto = estudiante.nombre;

        tr.innerHTML = `
            <td class="text-center">${numero}</td>
            <td><strong>${estudiante.boleta}</strong></td>
            <td>${nombreCompleto}</td>
            <td>${estudiante.correo || 'No registrado'}</td>
            <td class="text-center">${estadoBadge}</td>
            <td class="text-center">
                <div class="btn-group" role="group">
                    <button class="btn btn-info btn-sm btn-ver-detalle"
                            data-estudiante-id="${estudiante.id}"
                            title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-warning btn-sm btn-editar-estudiante"
                            data-estudiante-id="${estudiante.id}"
                            title="Editar estudiante">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm btn-eliminar-estudiante"
                            data-estudiante-id="${estudiante.id}"
                            title="Eliminar estudiante">
                        <i class="fas fa-trash"></i>
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
                lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Todos"]],
                order: [[0, 'asc']], // Ordenar por # (número de fila)
                dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"B>>rtip',
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
                stateSave: true
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
        // Evitar configurar event listeners múltiples veces
        if (this.eventListenersConfigurados) {
            return;
        }

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

            // Botón de generar QR masivo usando event delegation
            if (e.target.closest('#btnGenerarQRMasivo')) {
                this.generarQRMasivo();
            }

            // Botón de enviar QR personal
            if (e.target.closest('#btnEnviarQRPersonal')) {
                this.mostrarModalEnviarQRPersonal();
            }

            // Botón de recargar usando event delegation
            if (e.target.closest('#btnRecargarEstudiantes')) {
                this.cargarEstudiantes();
            }

            // Botón de agregar estudiante
            if (e.target.closest('#btnAgregarEstudiante')) {
                this.mostrarModalAgregarEstudiante();
            }

            // Botón de guardar estudiante
            if (e.target.closest('#btnGuardarEstudiante')) {
                this.guardarNuevoEstudiante();
            }

            // Botón de editar estudiante
            if (e.target.closest('.btn-editar-estudiante')) {
                const btn = e.target.closest('.btn-editar-estudiante');
                const estudianteId = btn.getAttribute('data-estudiante-id');
                this.mostrarModalEditarEstudiante(estudianteId);
            }

            // Botón de eliminar estudiante
            if (e.target.closest('.btn-eliminar-estudiante')) {
                const btn = e.target.closest('.btn-eliminar-estudiante');
                const estudianteId = btn.getAttribute('data-estudiante-id');
                this.eliminarEstudiante(estudianteId);
            }

            // Botón de actualizar estudiante
            if (e.target.closest('#btnActualizarEstudiante')) {
                this.actualizarEstudiante();
            }
        });

        // Marcar como configurados
        this.eventListenersConfigurados = true;
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
                const nombreCompleto = est.nombre.toLowerCase(); // Ya contiene el nombre completo
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
                                    <th>Nombre Completo:</th>
                                    <td>${estudiante.nombre}</td>
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
                                    <th>Grupos Asignados:</th>
                                    <td>
                                        ${estudiante.grupos && estudiante.grupos.length > 0
                                            ? estudiante.grupos.map(g => `<span class="badge bg-primary me-1 mb-1">${g.nombreGrupo}</span>`).join('')
                                            : '<span class="badge bg-secondary">Sin grupos asignados</span>'}
                                    </td>
                                </tr>
                                <tr>
                                    <th>Materias:</th>
                                    <td>
                                        ${estudiante.grupos && estudiante.grupos.length > 0
                                            ? '<ul class="mb-0 ps-3" style="list-style-type: disc;">' + estudiante.grupos.map(g => `<li style="margin-bottom: 4px;">${g.nombreMateria}</li>`).join('') + '</ul>'
                                            : '<span class="badge bg-secondary">Sin materias asignadas</span>'}
                                    </td>
                                </tr>
                                <tr>
                                    <th>Código QR:</th>
                                    <td>
                                        ${estudiante.qrCode ? `
                                            <span class="badge badge-success mb-2"><i class="fas fa-qrcode"></i> Generado</span>
                                            <div class="text-center mt-2">
                                                <img src="/estudiantes/${estudiante.id}/qr-image"
                                                     alt="Código QR"
                                                     class="img-fluid"
                                                     style="max-width: 250px; border: 2px solid #ddd; padding: 10px; border-radius: 8px;"
                                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                                <div style="display: none;" class="alert alert-warning">
                                                    Error al cargar imagen QR
                                                </div>
                                                <p class="mt-2"><small><code>${estudiante.qrCode}</code></small></p>
                                            </div>
                                        ` : '<span class="badge badge-warning">No generado</span>'}
                                    </td>
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
     * Mostrar modal para agregar estudiante
     */
    mostrarModalAgregarEstudiante() {
        // Limpiar formulario
        const form = document.getElementById('formAgregarEstudiante');
        if (form) {
            form.reset();
        }

        // Llenar select de grupos
        this.llenarSelectGruposModal();

        // Mostrar modal
        const modalElement = document.getElementById('modalAgregarEstudiante');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }

    /**
     * Llenar el select de grupos en el modal
     */
    llenarSelectGruposModal() {
        const selectGrupo = document.getElementById('selectGrupoModal');
        if (!selectGrupo) return;

        // Limpiar opciones existentes excepto la primera
        selectGrupo.innerHTML = '<option value="">Sin asignar (puedes asignarlo después)</option>';

        // Agregar opciones de grupos ordenados por materia
        this.grupos.forEach(grupo => {
            const option = document.createElement('option');
            option.value = JSON.stringify({ idGrupo: grupo.id, idUnidad: grupo.idUnidad });
            option.textContent = `${grupo.nombreGrupo} - ${grupo.nombreMateria}`;
            selectGrupo.appendChild(option);
        });
    }

    /**
     * Guardar nuevo estudiante
     */
    async guardarNuevoEstudiante() {
        const form = document.getElementById('formAgregarEstudiante');

        // Validar formulario
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Obtener datos del formulario
        const boleta = document.getElementById('inputBoleta').value.trim();
        const nombre = document.getElementById('inputNombre').value.trim();
        const correo = document.getElementById('inputCorreo').value.trim();
        const grupoValue = document.getElementById('selectGrupoModal').value;

        // Validar boleta
        if (!boleta) {
            alert('La boleta es obligatoria');
            return;
        }

        // Validar nombre
        if (!nombre) {
            alert('El nombre completo es obligatorio');
            return;
        }

        // Preparar datos
        const estudianteDTO = {
            boleta: boleta,
            nombre: nombre,
            correo: correo || null
        };

        // Preparar URL con parámetros de grupo si se seleccionó
        let url = '/estudiantes/crear';
        if (grupoValue) {
            try {
                const grupoData = JSON.parse(grupoValue);
                url += `?idGrupo=${grupoData.idGrupo}&idUnidad=${grupoData.idUnidad}`;
            } catch (e) {
                console.error('Error al parsear datos del grupo:', e);
            }
        }

        try {
            // Deshabilitar botón
            const btnGuardar = document.getElementById('btnGuardarEstudiante');
            const textoOriginal = btnGuardar.innerHTML;
            btnGuardar.disabled = true;
            btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

            // Enviar petición
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(estudianteDTO)
            });

            const resultado = await response.json();

            // Restaurar botón
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = textoOriginal;

            if (resultado.success) {
                alert(resultado.mensaje);

                // Cerrar modal
                const modalElement = document.getElementById('modalAgregarEstudiante');
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }

                // Recargar lista de estudiantes
                await this.cargarEstudiantes();
            } else {
                alert('Error: ' + resultado.mensaje);
            }

        } catch (error) {
            console.error('Error al guardar estudiante:', error);
            alert('Error al guardar el estudiante: ' + error.message);

            // Restaurar botón
            const btnGuardar = document.getElementById('btnGuardarEstudiante');
            if (btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar';
            }
        }
    }

    /**
     * Mostrar modal para editar estudiante
     */
    mostrarModalEditarEstudiante(estudianteId) {
        const estudiante = this.estudiantes.find(e => e.id == estudianteId);
        if (!estudiante) {
            this.mostrarError('Estudiante no encontrado');
            return;
        }

        // Prellenar formulario con datos del estudiante
        document.getElementById('editEstudianteId').value = estudiante.id;
        document.getElementById('editInputBoleta').value = estudiante.boleta;
        document.getElementById('editInputNombre').value = estudiante.nombre;
        document.getElementById('editInputCorreo').value = estudiante.correo || '';
        document.getElementById('editSelectEstado').value = estudiante.estado;

        // Llenar select de grupos
        this.llenarSelectGruposModalEditar();

        // Preseleccionar el grupo actual si tiene
        if (estudiante.grupos && estudiante.grupos.length > 0) {
            const primerGrupo = estudiante.grupos[0];
            const grupoValue = JSON.stringify({ idGrupo: primerGrupo.idGrupo, idUnidad: primerGrupo.idUnidad });
            document.getElementById('editSelectGrupoModal').value = grupoValue;
        }

        // Mostrar modal
        const modalElement = document.getElementById('modalEditarEstudiante');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }

    /**
     * Llenar el select de grupos en el modal de edición
     */
    llenarSelectGruposModalEditar() {
        const selectGrupo = document.getElementById('editSelectGrupoModal');
        if (!selectGrupo) return;

        // Limpiar opciones existentes excepto la primera
        selectGrupo.innerHTML = '<option value="">Sin asignar</option>';

        // Agregar opciones de grupos ordenados por materia
        this.grupos.forEach(grupo => {
            const option = document.createElement('option');
            option.value = JSON.stringify({ idGrupo: grupo.id, idUnidad: grupo.idUnidad });
            option.textContent = `${grupo.nombreGrupo} - ${grupo.nombreMateria}`;
            selectGrupo.appendChild(option);
        });
    }

    /**
     * Actualizar estudiante
     */
    async actualizarEstudiante() {
        const form = document.getElementById('formEditarEstudiante');

        // Validar formulario
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Obtener datos del formulario
        const id = document.getElementById('editEstudianteId').value;
        const boleta = document.getElementById('editInputBoleta').value.trim();
        const nombre = document.getElementById('editInputNombre').value.trim();
        const correo = document.getElementById('editInputCorreo').value.trim();
        const estado = document.getElementById('editSelectEstado').value;
        const grupoValue = document.getElementById('editSelectGrupoModal').value;

        // Validar
        if (!boleta) {
            alert('La boleta es obligatoria');
            return;
        }

        if (!nombre) {
            alert('El nombre completo es obligatorio');
            return;
        }

        // Preparar datos
        const estudianteDTO = {
            boleta: boleta,
            nombre: nombre,
            correo: correo || null,
            estado: estado
        };

        // Preparar URL con parámetros de grupo si se seleccionó
        let url = `/estudiantes/${id}`;
        if (grupoValue) {
            try {
                const grupoData = JSON.parse(grupoValue);
                url += `?idGrupo=${grupoData.idGrupo}&idUnidad=${grupoData.idUnidad}`;
            } catch (e) {
                console.error('Error al parsear datos del grupo:', e);
            }
        }

        try {
            // Deshabilitar botón
            const btnActualizar = document.getElementById('btnActualizarEstudiante');
            const textoOriginal = btnActualizar.innerHTML;
            btnActualizar.disabled = true;
            btnActualizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';

            // Enviar petición
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(estudianteDTO)
            });

            const resultado = await response.json();

            // Restaurar botón
            btnActualizar.disabled = false;
            btnActualizar.innerHTML = textoOriginal;

            if (resultado.success) {
                alert(resultado.mensaje);

                // Cerrar modal
                const modalElement = document.getElementById('modalEditarEstudiante');
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }

                // Recargar lista de estudiantes
                await this.cargarEstudiantes();
            } else {
                alert('Error: ' + resultado.mensaje);
            }

        } catch (error) {
            console.error('Error al actualizar estudiante:', error);
            alert('Error al actualizar el estudiante: ' + error.message);

            // Restaurar botón
            const btnActualizar = document.getElementById('btnActualizarEstudiante');
            if (btnActualizar) {
                btnActualizar.disabled = false;
                btnActualizar.innerHTML = '<i class="fas fa-save"></i> Actualizar';
            }
        }
    }

    /**
     * Eliminar estudiante
     */
    async eliminarEstudiante(estudianteId) {
        const estudiante = this.estudiantes.find(e => e.id == estudianteId);
        if (!estudiante) {
            this.mostrarError('Estudiante no encontrado');
            return;
        }

        const nombreCompleto = estudiante.nombre; // Ya contiene el nombre completo
        const confirmacion = confirm(
            `¿Estás seguro de que deseas eliminar al estudiante ${nombreCompleto} (${estudiante.boleta})?\n\n` +
            `Esta acción no se puede deshacer y el estudiante será removido de todos sus grupos.`
        );

        if (!confirmacion) {
            return;
        }

        try {
            const response = await fetch(`/estudiantes/${estudianteId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }

            const resultado = await response.json();

            if (resultado.success) {
                alert(`Estudiante eliminado correctamente`);
                // Recargar lista de estudiantes
                await this.cargarEstudiantes();
            } else {
                alert('Error: ' + resultado.mensaje);
            }

        } catch (error) {
            console.error('Error al eliminar estudiante:', error);
            alert('Error al eliminar el estudiante: ' + error.message);
        }
    }

    /**
     * Genera códigos QR masivamente para todos los estudiantes
     */
    async generarQRMasivo() {
        const confirmacion = confirm(
            '¿Deseas generar códigos QR únicos para todos los estudiantes?\n\n' +
            'Esto puede tardar unos momentos.'
        );

        if (!confirmacion) {
            return;
        }

        // Preguntar si desea enviar correos
        const enviarCorreo = confirm(
            '¿Deseas enviar los códigos QR por correo electrónico a los estudiantes?\n\n' +
            'Solo se enviarán a estudiantes que tengan correo registrado.'
        );

        try {
            // Mostrar indicador de carga
            const btnGenerarQR = document.getElementById('btnGenerarQRMasivo');
            const textoOriginal = btnGenerarQR.innerHTML;
            btnGenerarQR.disabled = true;
            btnGenerarQR.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';

            const response = await fetch(`/estudiantes/generar-qr-masivo/${this.docenteId}?enviarCorreo=${enviarCorreo}`, {
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
     * Mostrar modal para enviar QR de manera personal (selectiva)
     */
    mostrarModalEnviarQRPersonal() {
        if (this.estudiantes.length === 0) {
            alert('No hay estudiantes registrados');
            return;
        }

        // Limpiar modales anteriores
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        const modalAnterior = document.getElementById('modalEnviarQRPersonal');
        if (modalAnterior) {
            const modalInstance = bootstrap.Modal.getInstance(modalAnterior);
            if (modalInstance) {
                modalInstance.dispose();
            }
            modalAnterior.remove();
        }

        // Crear lista de estudiantes con checkboxes
        let listaEstudiantes = '';
        this.estudiantes.forEach(estudiante => {
            const correo = estudiante.correo || 'Sin correo';
            const tieneCorreo = estudiante.correo && estudiante.correo.trim() !== '';
            listaEstudiantes += `
                <div class="form-check mb-2">
                    <input class="form-check-input estudiante-check" type="checkbox"
                           value="${estudiante.id}"
                           id="check-${estudiante.id}"
                           ${!tieneCorreo ? 'disabled' : ''}>
                    <label class="form-check-label ${!tieneCorreo ? 'text-muted' : ''}" for="check-${estudiante.id}">
                        <strong>${estudiante.boleta}</strong> - ${estudiante.nombre}
                        <br><small class="${tieneCorreo ? 'text-primary' : 'text-danger'}">${correo}</small>
                    </label>
                </div>
            `;
        });

        const modalHTML = `
            <div class="modal fade" id="modalEnviarQRPersonal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-paper-plane"></i>
                                Enviar QR de Forma Personal
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle"></i>
                                Selecciona los estudiantes a los que deseas enviar su código QR por correo electrónico.
                                Solo se pueden seleccionar estudiantes con correo registrado.
                            </div>

                            <div class="mb-3">
                                <button type="button" class="btn btn-sm btn-primary" id="btnSeleccionarTodos">
                                    <i class="fas fa-check-square"></i> Seleccionar Todos
                                </button>
                                <button type="button" class="btn btn-sm btn-secondary" id="btnDeseleccionarTodos">
                                    <i class="fas fa-square"></i> Deseleccionar Todos
                                </button>
                            </div>

                            <div style="max-height: 400px; overflow-y: auto; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px;">
                                ${listaEstudiantes}
                            </div>

                            <!-- Barra de progreso (oculta inicialmente) -->
                            <div id="progressContainer" class="mt-3" style="display: none;">
                                <h6>Enviando correos...</h6>
                                <div class="progress" style="height: 30px;">
                                    <div class="progress-bar progress-bar-striped progress-bar-animated bg-success"
                                         role="progressbar"
                                         id="progressBar"
                                         style="width: 0%"
                                         aria-valuenow="0"
                                         aria-valuemin="0"
                                         aria-valuemax="100">
                                        <span id="progressText">0%</span>
                                    </div>
                                </div>
                                <p class="mt-2 mb-0" id="progressStatus">Preparando envío...</p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-info" id="btnConfirmarEnvioPersonal">
                                <i class="fas fa-paper-plane"></i> Enviar QR Seleccionados
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Inicializar modal
        const modalElement = document.getElementById('modalEnviarQRPersonal');
        const modal = new bootstrap.Modal(modalElement);

        // Evento para limpiar el modal cuando se oculta
        modalElement.addEventListener('hidden.bs.modal', function (event) {
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            modalElement.remove();
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('padding-right');
        }, { once: true });

        // Configurar botones de selección
        document.getElementById('btnSeleccionarTodos').addEventListener('click', () => {
            document.querySelectorAll('.estudiante-check:not(:disabled)').forEach(cb => cb.checked = true);
        });

        document.getElementById('btnDeseleccionarTodos').addEventListener('click', () => {
            document.querySelectorAll('.estudiante-check').forEach(cb => cb.checked = false);
        });

        // Evento del botón de confirmar
        document.getElementById('btnConfirmarEnvioPersonal').addEventListener('click', () => {
            this.enviarQRPersonal();
        });

        modal.show();
    }

    /**
     * Enviar QR de manera personal a los estudiantes seleccionados
     */
    async enviarQRPersonal() {
        // Obtener estudiantes seleccionados
        const checkboxes = document.querySelectorAll('.estudiante-check:checked');
        if (checkboxes.length === 0) {
            alert('Por favor selecciona al menos un estudiante');
            return;
        }

        const estudiantesSeleccionados = Array.from(checkboxes).map(cb => parseInt(cb.value));

        // Mostrar barra de progreso
        document.getElementById('progressContainer').style.display = 'block';
        const btnEnviar = document.getElementById('btnConfirmarEnvioPersonal');
        btnEnviar.disabled = true;

        // Enviar QR uno por uno
        let enviados = 0;
        let errores = 0;

        for (let i = 0; i < estudiantesSeleccionados.length; i++) {
            const estudianteId = estudiantesSeleccionados[i];
            const estudiante = this.estudiantes.find(e => e.id === estudianteId);

            // Actualizar progreso
            const progreso = Math.round(((i + 1) / estudiantesSeleccionados.length) * 100);
            document.getElementById('progressBar').style.width = progreso + '%';
            document.getElementById('progressBar').setAttribute('aria-valuenow', progreso);
            document.getElementById('progressText').textContent = progreso + '%';
            document.getElementById('progressStatus').textContent = `Enviando a ${estudiante.nombre}... (${i + 1}/${estudiantesSeleccionados.length})`;

            try {
                // Llamar al endpoint para enviar QR individual
                const response = await fetch(`/estudiantes/generar-qr-masivo/${this.docenteId}?enviarCorreo=true`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify([estudianteId])
                });

                const resultado = await response.json();
                if (resultado.success) {
                    enviados++;
                } else {
                    errores++;
                }
            } catch (error) {
                console.error('Error al enviar QR a estudiante', estudianteId, error);
                errores++;
            }

            // Pequeña pausa para no saturar el servidor
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Mostrar resultado final
        document.getElementById('progressStatus').textContent =
            `Proceso completado: ${enviados} enviados, ${errores} errores`;
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = '<i class="fas fa-check"></i> Completado';

        // Mostrar alerta con resultado
        setTimeout(() => {
            alert(`Envío completado:\n\n✅ Enviados: ${enviados}\n❌ Errores: ${errores}`);

            // Cerrar modal
            const modalElement = document.getElementById('modalEnviarQRPersonal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        }, 1000);
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
