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

    // ==== 4️⃣ AGREGAR HORARIO ====
    $('#btnAgregarHora').click(function () {
        const dia = $('#dia').val();
        const inicio = $('#horaInicio').val();
        const fin = $('#horaFin').val();
        const tipoHorario = $('#tipoHorario').val();

        if (!dia || !inicio || !fin || !tipoHorario) {
            alert('Por favor completa todos los campos del horario.');
            return;
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
            .then(res => res.json())
            .then(data => {
                unidades = data;
                actualizarTablaUnidades();
            })
            .catch(err => console.error('Error al cargar unidades:', err));
    }

    function actualizarTablaUnidades() {
        const tbody = $('#tablaUnidades tbody');
        tbody.empty();
        unidades.forEach((u, i) => {
            const nombresGrupos = u.grupos && u.grupos.length > 0
                ? u.grupos.map(g => g.grupo).join(', ')
                : 'Sin grupos';

            tbody.append(`
                <tr>
                    <td>${u.nombreUnidad}</td>
                    <td>${nombresGrupos}</td>
                    <td>
                        <div class="d-flex justify-content-center">
                            <button class="btn btn-primary btn-sm btnEditarUnidad me-1" data-index="${i}">
                                <i class="fa fa-pencil"></i>
                            </button>
                            <button class="btn btn-danger btn-sm btnEliminarUnidad" data-index="${i}">
                                <i class="fa fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `);
        });
    }

    $(document).on('click', '.btnEliminarUnidad', function () {
        const index = $(this).data('index');
        const unidad = unidades[index];

        if (!confirm(`¿Seguro que deseas eliminar la unidad "${unidad.nombreUnidad}"?`)) return;

        fetch(`/horario/unidad/${unidad.id}`, { method: 'DELETE' })
            .then(res => res.text())
            .then(resultado => {
                if (resultado.startsWith('OK:')) {
                    unidades.splice(index, 1);
                    actualizarTablaUnidades();
                    alert('Unidad eliminada correctamente');
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
        const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        const horasSet = new Set();
        unidades.forEach(u => u.grupos.forEach(g => g.horarios.forEach(h => horasSet.add(`${h.inicio}-${h.fin}`))));
        const horas = Array.from(horasSet).sort((a, b) => a.split('-')[0].localeCompare(b.split('-')[0]));

        $('.tool__header').html('<h1 class="text-white mb-3">Horario Semanal</h1>');
        $('#formUnidad').hide();

        let tabla = `<table class="table text-center align-middle horario-minimalista">
            <thead><tr><th>Hora/Dia</th>${dias.map(d => `<th>${d}</th>`).join('')}</tr></thead><tbody>`;

        horas.forEach(hora => {
            tabla += `<tr><td class="hora">${hora}</td>`;
            dias.forEach(dia => {
                let materia = '';
                unidades.forEach(u => u.grupos.forEach(g => g.horarios.forEach(h => {
                    if (h.dia === dia && `${h.inicio}-${h.fin}` === hora) {
                        materia = `<div class="materia-nombre">${u.nombreUnidad}</div>
                                   <small class="materia-grupo">${g.grupo}</small><br>
                                   <span class="badge ${h.tipo==='Teórica'?'bg-primary':'bg-success'} tipo-materia">${h.tipo}</span>`;
                    }
                })));
                tabla += `<td>${materia || '-'}</td>`;
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
