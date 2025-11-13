$(document).ready(function () {

    // ==== 1️⃣ OBTENER ID DEL DOCENTE ====
    let idDocente = localStorage.getItem('docenteId');
    if (!idDocente) {
        const idManual = prompt('ID del docente no encontrado. Ingresa manualmente:', '18');
        idDocente = idManual || '18';
        localStorage.setItem('docenteId', idDocente);
    }
    console.log('👨‍🏫 Docente ID cargado:', idDocente);

    // ==== 2️⃣ VARIABLES GLOBALES ====
    let horariosTemp = []; // horarios del grupo actual
    let gruposTemp = [];   // grupos de la unidad actual
    let unidades = [];     // todas las unidades cargadas desde backend

    // ==== 3️⃣ MOSTRAR Y OCULTAR SECCIONES ====
    $('#linkMiHorario').click(function (e) {
        e.preventDefault();
        $('#dashboardPrincipal').hide();
        $('#contentMiHorario').fadeIn();
        cargarHorariosDesdeBackend();
    });

    $('#btnRegresarDashboard').click(function () {
        $('#contentMiHorario').fadeOut(function () {
            $('#dashboardPrincipal').fadeIn();
        });
    });

    // ==== 4️⃣ VALIDAR TRASLAPES DE HORARIOS ====
    function validarTraslape(dia, inicio, fin) {
        const inicioMinutos = convertirAMinutos(inicio);
        const finMinutos = convertirAMinutos(fin);

        // Validar que hora de fin sea mayor a hora de inicio
        if (finMinutos <= inicioMinutos) {
            alert('⚠️ La hora de fin debe ser mayor a la hora de inicio.');
            return false;
        }

        // Función auxiliar para verificar si dos rangos de tiempo se traslapan
        function seTraslapa(inicio1, fin1, inicio2, fin2) {
            const i1 = convertirAMinutos(inicio1);
            const f1 = convertirAMinutos(fin1);
            const i2 = convertirAMinutos(inicio2);
            const f2 = convertirAMinutos(fin2);

            // Se traslapan si: inicio1 < fin2 AND inicio2 < fin1
            return i1 < f2 && i2 < f1;
        }

        // 1. Verificar traslape con horarios temporales del grupo actual
        for (let h of horariosTemp) {
            if (h.dia === dia && seTraslapa(inicio, fin, h.inicio, h.fin)) {
                alert(`⚠️ Conflicto de horario detectado!\n\nYa existe una clase el ${dia} de ${h.inicio} a ${h.fin}.\n\nNo puedes agregar otra clase que se traslape en el mismo día.`);
                return false;
            }
        }

        // 2. Verificar traslape con grupos temporales
        for (let g of gruposTemp) {
            for (let h of g.horarios) {
                if (h.dia === dia && seTraslapa(inicio, fin, h.inicio, h.fin)) {
                    alert(`⚠️ Conflicto de horario detectado!\n\nEl grupo "${g.grupo}" ya tiene clase el ${dia} de ${h.inicio} a ${h.fin}.\n\nNo puedes agregar otra clase que se traslape en el mismo día.`);
                    return false;
                }
            }
        }

        // 3. Verificar traslape con unidades ya guardadas en BD
        for (let u of unidades) {
            if (!u.grupos) continue;
            for (let g of u.grupos) {
                if (!g.horarios) continue;
                for (let h of g.horarios) {
                    const hDia = h.dia || h.diaSemana;
                    const hInicio = h.inicio || h.horaInicio;
                    const hFin = h.fin || h.horaFin;
                    const gNombre = g.grupo || g.nombreGrupo;

                    if (hDia === dia && seTraslapa(inicio, fin, hInicio, hFin)) {
                        alert(`⚠️ Conflicto de horario detectado!\n\nLa materia "${u.nombreUnidad}" (${gNombre}) ya tiene clase el ${dia} de ${hInicio} a ${hFin}.\n\nNo puedes agregar otra clase que se traslape en el mismo día.`);
                        return false;
                    }
                }
            }
        }

        return true; // No hay traslapes
    }

    // Función auxiliar para convertir tiempo HH:mm a minutos
    function convertirAMinutos(tiempo) {
        const [horas, minutos] = tiempo.split(':').map(Number);
        return horas * 60 + minutos;
    }

    // ==== 5️⃣ AGREGAR HORARIO ====
    $('#btnAgregarHora').click(function () {
        const dia = $('#dia').val();
        const inicio = $('#horaInicio').val();
        const fin = $('#horaFin').val();
        const tipoHorario = $('#tipoHorario').val();

        if (!dia || !inicio || !fin || !tipoHorario) {
            alert('Por favor completa todos los campos del horario.');
            return;
        }

        // Validar traslapes antes de agregar
        if (!validarTraslape(dia, inicio, fin)) {
            return; // Si hay traslape, no agregar
        }

        horariosTemp.push({ dia, inicio, fin, tipo: tipoHorario });
        actualizarTablaHoras();

        $('#dia').val('');
        $('#horaInicio').val('');
        $('#horaFin').val('');
        $('#tipoHorario').val('');
    });

    // ==== 5️⃣ DETECTAR SEMESTRE AUTOMÁTICAMENTE ====
    $('#grupo').on('input', function () {
        const valor = $(this).val().trim();
        const match = valor.match(/^(\d)/);
        if (match) $('#semestre').val(match[1]);
    });

    // ==== 6️⃣ TABLA DE HORARIOS ====
    function actualizarTablaHoras() {
        const tbody = $('#tablaHoras tbody');
        tbody.empty();
        horariosTemp.forEach((h, i) => {
            const fila = `
                <tr>
                    <td>${h.dia}</td>
                    <td>${h.inicio}</td>
                    <td>${h.fin}</td>
                    <td>${h.tipo}</td>
                    <td>
                        <div class="d-flex justify-content-center">
                            <button class="btn btn-primary btn-xs me-1 btnEditarHorarioIndividual" data-index="${i}">
                                <i class="fa fa-pencil"></i>
                            </button>
                            <button class="btn btn-danger btn-xs btnEliminarHorario" data-index="${i}">
                                <i class="fa fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            tbody.append(fila);
        });
    }

    $(document).on('click', '.btnEliminarHorario', function () {
        const index = $(this).data('index');
        horariosTemp.splice(index, 1);
        actualizarTablaHoras();
    });

    $(document).on('click', '.btnEditarHorarioIndividual', function () {
        const index = $(this).data('index');
        const h = horariosTemp[index];
        $('#dia').val(h.dia);
        $('#horaInicio').val(h.inicio);
        $('#horaFin').val(h.fin);
        $('#tipoHorario').val(h.tipo);
        horariosTemp.splice(index, 1);
        actualizarTablaHoras();
    });

    // ==== 7️⃣ GUARDAR GRUPO ====
    $('#btnGuardarGrupo').click(function () {
        const grupo = $('#grupo').val().trim();
        const semestre = $('#semestre').val().trim();

        if (!grupo || !semestre) {
            alert('Completa todos los datos del grupo.');
            return;
        }
        if (horariosTemp.length === 0) {
            alert('Agrega al menos un horario para este grupo.');
            return;
        }

        const tipo = horariosTemp[0].tipo || 'N/A';
        gruposTemp.push({ grupo, tipo, semestre, horarios: [...horariosTemp] });

        horariosTemp = [];
        actualizarTablaHoras();
        actualizarTablaGrupos();

        $('#grupo').val('');
        $('#semestre').val('');
        $('#tipoHorario').val('');
    });

    function actualizarTablaGrupos() {
        const tbody = $('#tablaGrupos tbody');
        tbody.empty();
        gruposTemp.forEach((g, i) => {
            const horariosTexto = g.horarios.map(h => `${h.dia} ${h.inicio}-${h.fin} (${h.tipo})`).join('<br>');
            const fila = `
                <tr>
                    <td>${g.grupo}</td>
                    <td>${g.tipo}</td>
                    <td>${g.semestre}</td>
                    <td>${horariosTexto}</td>
                    <td>
                        <div class="d-flex justify-content-center">
                            <button class="btn btn-primary btn-sm btnEditarGrupo me-1" data-index="${i}">
                                <i class="fa fa-pencil"></i>
                            </button>
                            <button class="btn btn-danger btn-sm btnEliminarGrupo" data-index="${i}">
                                <i class="fa fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            tbody.append(fila);
        });
    }

    $(document).on('click', '.btnEliminarGrupo', function () {
        gruposTemp.splice($(this).data('index'), 1);
        actualizarTablaGrupos();
    });

    $(document).on('click', '.btnEditarGrupo', function () {
        const g = gruposTemp[$(this).data('index')];
        $('#grupo').val(g.grupo);
        $('#semestre').val(g.semestre);
        horariosTemp = [...g.horarios];
        actualizarTablaHoras();
        gruposTemp.splice($(this).data('index'), 1);
        actualizarTablaGrupos();
    });

    // ==== 8️⃣ GUARDAR UNIDAD EN BD ====
    $('#btnGuardarUnidad').click(async function () {
        const unidad = $('#unidad').val().trim();
        if (!unidad) { alert('Escribe el nombre de la unidad.'); return; }
        if (gruposTemp.length === 0) { alert('Agrega al menos un grupo.'); return; }

        const data = {
            docenteId: idDocente,
            unidad,
            grupos: gruposTemp.map(g => ({
                grupo: g.grupo,
                semestre: g.semestre,
                tipo: g.tipo,
                horarios: g.horarios
            }))
        };

        try {
            const res = await fetch('/horario/guardar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const resultado = await res.text();

            if (resultado.startsWith('OK:')) {
                alert('✅ Horario guardado correctamente');
                gruposTemp = [];
                horariosTemp = [];
                actualizarTablaGrupos();
                actualizarTablaHoras();
                $('#formUnidad')[0].reset();
                cargarHorariosDesdeBackend();
            } else {
                alert('❌ Error: ' + resultado);
            }
        } catch (err) {
            console.error(err);
            alert('❌ Error de conexión al guardar unidad');
        }
    });

    // ==== 9️⃣ CARGAR UNIDADES DESDE BD ====
    function cargarHorariosDesdeBackend() {
        fetch(`/horario/obtener/${idDocente}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Error al cargar horarios');
                }
                return res.json();
            })
            .then(data => {
                console.log('📚 Unidades cargadas:', data);
                unidades = data || [];
                actualizarTablaUnidades();

                // Si hay unidades, mostrar automáticamente el horario visual
                if (unidades.length > 0) {
                    console.log('✅ Se encontraron unidades, generando horario automáticamente...');
                    generarTablaHorario();
                } else {
                    // Mostrar mensaje si no hay unidades
                    $('#tablaUnidades tbody').html(`
                        <tr>
                            <td colspan="3" class="text-center text-muted">
                                No tienes unidades registradas aún. ¡Crea tu primer horario!
                            </td>
                        </tr>
                    `);
                    // Asegurar que el formulario esté visible
                    $('#formUnidad').show();
                    $('#vistaHorario').hide();
                }
            })
            .catch(err => {
                console.error('Error al cargar unidades:', err);
                alert('❌ Error al cargar los horarios guardados');
            });
    }

    function actualizarTablaUnidades() {
        const tbody = $('#tablaUnidades tbody');
        tbody.empty();

        if (unidades.length === 0) {
            tbody.html(`
                <tr>
                    <td colspan="3" class="text-center text-muted">
                        No tienes unidades registradas aún. ¡Crea tu primer horario!
                    </td>
                </tr>
            `);
            return;
        }

        unidades.forEach((u, i) => {
            // Compatibilidad con ambos formatos de nombre de grupo
            const nombresGrupos = u.grupos && u.grupos.length > 0
                ? u.grupos.map(g => g.grupo || g.nombreGrupo || 'N/A').join(', ')
                : 'Sin grupos';

            tbody.append(`
                <tr>
                    <td><strong>${u.nombreUnidad}</strong></td>
                    <td>${nombresGrupos}</td>
                    <td>
                        <div class="d-flex justify-content-center">
                            <button class="btn btn-info btn-sm btnVerDetalleUnidad me-1" data-index="${i}" title="Ver detalle">
                                <i class="fa fa-eye"></i>
                            </button>
                            <button class="btn btn-primary btn-sm btnEditarUnidad me-1" data-index="${i}" title="Editar">
                                <i class="fa fa-pencil"></i>
                            </button>
                            <button class="btn btn-danger btn-sm btnEliminarUnidad" data-index="${i}" title="Eliminar">
                                <i class="fa fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `);
        });
    }

    // Ver detalle de unidad
    $(document).on('click', '.btnVerDetalleUnidad', function () {
        const index = $(this).data('index');
        const u = unidades[index];

        let detalleHTML = `
            <div class="modal fade" id="modalDetalleUnidad" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">📚 ${u.nombreUnidad}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">`;

        if (u.grupos && u.grupos.length > 0) {
            u.grupos.forEach(g => {
                const gNombre = g.grupo || g.nombreGrupo || 'N/A';
                detalleHTML += `
                    <div class="card mb-3">
                        <div class="card-header bg-light">
                            <strong>Grupo: ${gNombre}</strong> 
                            Semestre: ${g.semestre || 'N/A'} 
                         
                        </div>
                        <div class="card-body">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Día</th>
                                        <th>Hora Inicio</th>
                                        <th>Hora Fin</th>
                                        <th>Tipo</th>
                                    </tr>
                                </thead>
                                <tbody>`;

                if (g.horarios && g.horarios.length > 0) {
                    g.horarios.forEach(h => {
                        const hDia = h.dia || h.diaSemana || 'N/A';
                        const hInicio = h.inicio || h.horaInicio || 'N/A';
                        const hFin = h.fin || h.horaFin || 'N/A';
                        const hTipo = h.tipo || h.tipoHorario || 'N/A';

                        detalleHTML += `
                            <tr>
                                <td>${hDia}</td>
                                <td>${hInicio}</td>
                                <td>${hFin}</td>
                                <td><span class="badge ${hTipo==='Teórica'?'bg-primary':'bg-success'}">${hTipo}</span></td>
                            </tr>`;
                    });
                } else {
                    detalleHTML += `<tr><td colspan="4" class="text-center text-muted">Sin horarios</td></tr>`;
                }

                detalleHTML += `
                                </tbody>
                            </table>
                        </div>
                    </div>`;
            });
        } else {
            detalleHTML += `<p class="text-center text-muted">Esta unidad no tiene grupos registrados</p>`;
        }

        detalleHTML += `
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>`;

        // Eliminar modal anterior si existe
        $('#modalDetalleUnidad').remove();
        $('body').append(detalleHTML);
        const modal = new bootstrap.Modal(document.getElementById('modalDetalleUnidad'));
        modal.show();
    });

    $(document).on('click', '.btnEliminarUnidad', function () {
        const index = $(this).data('index');
        const unidad = unidades[index];

        if (!confirm(`¿Seguro que deseas eliminar la unidad "${unidad.nombreUnidad}"?\n\nEsto eliminará todos sus grupos y horarios.`)) return;

        fetch(`/horario/unidad/${unidad.id}`, { method: 'DELETE' })
            .then(res => res.text())
            .then(resultado => {
                if (resultado.startsWith('OK:')) {
                    unidades.splice(index, 1);
                    actualizarTablaUnidades();
                    alert('✅ Unidad eliminada correctamente');
                } else {
                    alert('❌ Error al eliminar: ' + resultado);
                }
            })
            .catch(err => {
                console.error(err);
                alert('❌ Error de conexión al eliminar unidad');
            });
    });

    $(document).on('click', '.btnEditarUnidad', function () {
        const index = $(this).data('index');
        const u = unidades[index];
        $('#unidad').val(u.nombreUnidad);
        if (u.grupos && u.grupos.length > 0) {
            gruposTemp = [...u.grupos];
            actualizarTablaGrupos();
        }
        unidades.splice(index, 1);
        actualizarTablaUnidades();
        $('#formUnidad').fadeIn();
        $('#vistaHorario').hide();
    });

    // ==== 10️⃣ GENERAR TABLA DE HORARIO ====
    function generarTablaHorario() {
        if (unidades.length === 0) {
            alert('⚠️ No hay unidades capturadas para generar el horario');
            return;
        }

        const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        const horasSet = new Set();

        // Recolectar todas las horas (compatible con ambos formatos)
        unidades.forEach(u => {
            if (!u.grupos) return;
            u.grupos.forEach(g => {
                if (!g.horarios) return;
                g.horarios.forEach(h => {
                    const inicio = h.inicio || h.horaInicio;
                    const fin = h.fin || h.horaFin;
                    if (inicio && fin) {
                        horasSet.add(`${inicio}-${fin}`);
                    }
                });
            });
        });

        const horas = Array.from(horasSet).sort((a, b) => a.split('-')[0].localeCompare(b.split('-')[0]));

        $('.tool__header').html('<h1 class="text-white mb-3">Horario Semanal</h1>');
        $('#formUnidad').hide();

        let tabla = `<table class="table table-bordered text-center align-middle horario-minimalista" style="background-color: white;">
            <thead class="table-dark">
                <tr>
                    <th style="width: 120px;">Horario</th>
                    ${dias.map(d => `<th>${d}</th>`).join('')}
                </tr>
            </thead>
            <tbody>`;

        horas.forEach(hora => {
            tabla += `<tr><td class="hora fw-bold">${hora}</td>`;
            dias.forEach(dia => {
                let materia = '';
                unidades.forEach(u => {
                    if (!u.grupos) return;
                    u.grupos.forEach(g => {
                        if (!g.horarios) return;
                        g.horarios.forEach(h => {
                            const hDia = h.dia || h.diaSemana;
                            const hInicio = h.inicio || h.horaInicio;
                            const hFin = h.fin || h.horaFin;
                            const hTipo = h.tipo || h.tipoHorario;
                            const gNombre = g.grupo || g.nombreGrupo;

                            if (hDia === dia && `${hInicio}-${hFin}` === hora) {
                                materia = `
                                    <div class="p-2" style="border-radius: 5px;">
  <div class="materia-nombre fw-bold" style="font-size: 0.9em;">${u.nombreUnidad}</div>
  <small class="materia-grupo text-muted">${gNombre}</small><br>
  <span class="badge ${hTipo==='Teórica'?'bg-primary':'bg-success'} mt-1">${hTipo}</span>
</div>

`;
                            }
                        });
                    });
                });
                tabla += `<td>${materia || '<span class="text-muted">-</span>'}</td>`;
            });
            tabla += '</tr>';
        });

        tabla += `</tbody></table>`;
        $('#tablaHorarioGenerado').html(tabla);
        $('#vistaHorario').show();
    }

    $('#btnGenerarHorario').click(function () {
        if (unidades.length === 0) { alert('No hay unidades capturadas'); return; }
        generarTablaHorario();
    });

    $('#btnEditarHorario').click(function () {
        $('#vistaHorario').hide();
        $('#formUnidad').fadeIn();
    });

});
