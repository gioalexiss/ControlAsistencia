$(document).ready(function () {

    // ==== MOSTRAR Y OCULTAR SECCIONES ====
    $('#linkMiHorario').click(function (e) {
        e.preventDefault();
        $('#dashboardPrincipal').hide();
        $('#contentMiHorario').fadeIn();
    });

    $('#btnRegresarDashboard').click(function () {
        $('#contentMiHorario').fadeOut(function () {
            $('#dashboardPrincipal').fadeIn();
        });
    });

    // ==== VARIABLES GLOBALES ====
    let horariosTemp = []; // horarios del grupo actual
    let gruposTemp = [];   // grupos de la unidad actual
    let unidades = [];     // todas las unidades registradas

    // ==== AGREGAR HORARIO ====
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

        // limpiar campos
        $('#dia').val('');
        $('#horaInicio').val('');
        $('#horaFin').val('');
        $('#tipoHorario').val('');
    });

    // ==== DETECTAR SEMESTRE AUTOMÁTICAMENTE ====
    $('#grupo').on('input', function () {
        const valor = $(this).val().trim();
        const match = valor.match(/^(\d)/);
        if (match) $('#semestre').val(match[1]);
    });

    // ==== ACTUALIZAR TABLA DE HORARIOS ====
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
                        <button class="btn btn-primary shadow btn-xs sharp me-1 btnEditarHorarioIndividual" data-index="${i}">
                          <i class="fa fa-pencil"></i>
                        </button>
                        <button class="btn btn-danger shadow btn-xs sharp btnEliminarHorario" data-index="${i}">
                          <i class="fa fa-trash"></i>
                        </button>
                      </div>
                    </td>


                </tr>
            `;
            tbody.append(fila);
        });
    }

    // ==== ELIMINAR HORARIO ====
    $(document).on('click', '.btnEliminarHorario', function () {
        const index = $(this).data('index');
        horariosTemp.splice(index, 1);
        actualizarTablaHoras();
    });

    // ==== EDITAR HORARIO ====
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

    // ==== GUARDAR GRUPO ====
    // ==== GUARDAR GRUPO ====
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

        // Tomamos el tipo del primer horario como tipo del grupo
        const tipo = horariosTemp[0].tipo || 'N/A';

        gruposTemp.push({ grupo, tipo, semestre, horarios: [...horariosTemp] });

        // Limpiar horarios temporales y actualizar tabla
        horariosTemp = [];
        actualizarTablaHoras();
        actualizarTablaGrupos();

        // Limpiar campos del formulario
        $('#grupo').val('');
        $('#semestre').val('');
        $('#tipoHorario').val('');
    });


    // ==== ACTUALIZAR TABLA DE GRUPOS ====
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
            </tr>
        `;
            tbody.append(fila);
        });
    }




    // ==== ELIMINAR / EDITAR GRUPO ====
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

    // ==== GUARDAR UNIDAD ====
    $('#btnGuardarUnidad').click(function () {
        const unidad = $('#unidad').val().trim();
        if (!unidad) { alert('Escribe el nombre de la unidad.'); return; }
        if (gruposTemp.length === 0) { alert('Agrega al menos un grupo.'); return; }

        unidades.push({ unidad, grupos: [...gruposTemp] });
        gruposTemp = [];
        actualizarTablaGrupos();
        actualizarTablaUnidades();
        $('#formUnidad')[0].reset();
        alert('Unidad guardada ✅');
    });

    // ==== TABLA DE UNIDADES ====
    function actualizarTablaUnidades() {
        const tbody = $('#tablaUnidades tbody');
        tbody.empty();
        unidades.forEach((u, i) => {
            const nombresGrupos = u.grupos.map(g => g.grupo).join(', ');
            tbody.append(`
                <tr>
                    <td>${u.unidad}</td>
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
    $(document).on('click', '.btnEditarUnidad', function () {
        const u = unidades[$(this).data('index')];
        $('#unidad').val(u.unidad);
        gruposTemp = [...u.grupos];
        actualizarTablaGrupos();
        unidades.splice($(this).data('index'), 1);
        actualizarTablaUnidades();
        $('#formUnidad').fadeIn();
        $('#vistaHorario').hide();
    });
    $(document).on('click', '.btnEliminarUnidad', function () {
        unidades.splice($(this).data('index'), 1);
        actualizarTablaUnidades();
    });

    // ==== GENERAR TABLA HORARIO ====
    function generarTablaHorario() {
        const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        const horasSet = new Set();
        unidades.forEach(u =>
            u.grupos.forEach(g =>
                g.horarios.forEach(h => horasSet.add(`${h.inicio}-${h.fin}`))
            )
        );
        const horas = Array.from(horasSet).sort((a, b) => a.split('-')[0].localeCompare(b.split('-')[0]));

        // 1. Reemplazar header con nuevo título
        $('.tool__header').html('<h1 class="text-white mb-3">Horario Semanal</h1>');

        // 2. Ocultar el formulario de captura
        $('#formUnidad').hide();

        // 3. Generar tabla
        let tabla = `
    <table class="table text-center align-middle horario-minimalista">
        <thead>
            <tr class="encabezado-horario">
                <th>Hora/Dia</th>${dias.map(d => `<th>${d}</th>`).join('')}
            </tr>
        </thead>
        <tbody>`;

        horas.forEach(hora => {
            tabla += `<tr><td class="hora">${hora}</td>`;
            dias.forEach(dia => {
                let materia = '';
                unidades.forEach(u =>
                    u.grupos.forEach(g =>
                        g.horarios.forEach(h => {
                            if(h.dia === dia && `${h.inicio}-${h.fin}` === hora){
                                materia = `<div class="materia-nombre">${u.unidad}</div>
                                       <small class="materia-grupo">${g.grupo}</small><br>
                                       <span class="badge ${h.tipo==='Teórica'?'bg-primary':'bg-success'} tipo-materia">${h.tipo}</span>`;
                            }
                        })
                    )
                );
                tabla += `<td>${materia || '-'}</td>`;
            });
            tabla += '</tr>';
        });

        tabla += `</tbody></table>`;

        // 4. Mostrar tabla
        $('#tablaHorarioGenerado').html(tabla);
        $('#vistaHorario').show();
    }




    $('#btnGenerarHorario').click(function () {
        if(unidades.length===0){ alert('No hay unidades capturadas.'); return; }
        $('#formUnidad').hide();
        $('#vistaHorario').fadeIn();
        generarTablaHorario();
    });

    $('#btnEditarHorario').click(function () {
        $('#vistaHorario').hide();
        $('#formUnidad').fadeIn();
    });

});
