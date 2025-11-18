/**
 * Gestor del Dashboard Principal
 * Maneja las estadísticas y gráficas del panel principal
 */

class DashboardManager {
    constructor() {
        this.docenteId = localStorage.getItem('docenteId');
        this.charts = {};
        this.estadisticas = null;
    }

    /**
     * Inicializa el dashboard
     */
    async init() {
        if (!this.docenteId) {
            console.error('No se encontró ID de docente');
            return;
        }

        await this.cargarEstadisticas();
        await this.cargarAsistenciasSemestre();
        this.actualizarWidgets();
        await this.inicializarGraficas();
    }

    /**
     * Carga las estadísticas del docente
     */
    async cargarEstadisticas() {
        try {
            const response = await fetch(`/grupos/docente/${this.docenteId}/estadisticas`);
            const data = await response.json();

            if (data.success) {
                this.estadisticas = data;
            }
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    }

    /**
     * Carga las asistencias del semestre actual
     */
    async cargarAsistenciasSemestre() {
        try {
            const response = await fetch(`/asistencia/todas/${this.docenteId}`);
            const asistencias = await response.json();

            // Filtrar asistencias del semestre actual (últimos 6 meses)
            const hoy = new Date();
            const inicioSemestre = new Date();
            inicioSemestre.setMonth(hoy.getMonth() - 6);

            const asistenciasSemestre = asistencias.filter(asistencia => {
                const fechaAsistencia = new Date(asistencia.fechaHora);
                return fechaAsistencia >= inicioSemestre && fechaAsistencia <= hoy;
            });

            // Guardar para uso en widgets
            if (!this.estadisticas) {
                this.estadisticas = {};
            }
            this.estadisticas.totalAsistenciasSemestre = asistenciasSemestre.length;

        } catch (error) {
            console.error('Error al cargar asistencias del semestre:', error);
            if (!this.estadisticas) {
                this.estadisticas = {};
            }
            this.estadisticas.totalAsistenciasSemestre = 0;
        }
    }

    /**
     * Actualiza los widgets de estadísticas en el dashboard
     */
    actualizarWidgets() {
        if (!this.estadisticas) return;

        // Widget: Total de Grupos
        const widgetGrupos = document.getElementById('widgetDashGrupos');
        if (widgetGrupos) {
            widgetGrupos.textContent = this.estadisticas.totalGrupos || 0;
        }

        // Widget: Total de Estudiantes
        const widgetEstudiantes = document.getElementById('widgetDashEstudiantes');
        if (widgetEstudiantes) {
            widgetEstudiantes.textContent = this.estadisticas.totalEstudiantes || 0;
        }

        // Widget: Total de Unidades
        const widgetUnidades = document.getElementById('widgetDashUnidades');
        if (widgetUnidades) {
            widgetUnidades.textContent = this.estadisticas.totalUnidades || 0;
        }

        // Widget: Asistencias del semestre
        const widgetAsistencias = document.getElementById('widgetDashAsistencias');
        if (widgetAsistencias) {
            widgetAsistencias.textContent = this.estadisticas.totalAsistenciasSemestre || 0;
        }
    }

    /**
     * Inicializa todas las gráficas
     */
    async inicializarGraficas() {
        this.crearGraficaEstudiantesPorGrupo();
        this.crearGraficaAsistenciaSemanal();
        this.crearGraficaPromedioAsistencia();
    }

    /**
     * Crea gráfica de estudiantes por grupo (Dona)
     */
    async crearGraficaEstudiantesPorGrupo() {
        const canvas = document.getElementById('chartEstudiantesPorGrupo');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        try {
            // Obtener datos de grupos
            const response = await fetch(`/grupos/docente/${this.docenteId}`);
            const data = await response.json();

            if (!data.success || !data.unidades) {
                return;
            }

            // Procesar datos para la gráfica
            const labels = [];
            const valores = [];
            const colores = [
                '#667eea', '#764ba2', '#f093fb', '#4facfe',
                '#43e97b', '#fa709a', '#fee140', '#30cfd0'
            ];

            for (const unidad of data.unidades) {
                if (unidad.grupos) {
                    for (const grupo of unidad.grupos) {
                        // Obtener cantidad de estudiantes
                        const respEstudiantes = await fetch(`/estudiantes/grupo/${grupo.id}`);
                        const estudiantes = await respEstudiantes.json();

                        labels.push(`${grupo.nombreGrupo} - ${unidad.nombreUnidad}`);
                        valores.push(estudiantes.length);
                    }
                }
            }

            // Crear gráfica
            if (this.charts.estudiantesPorGrupo) {
                this.charts.estudiantesPorGrupo.destroy();
            }

            this.charts.estudiantesPorGrupo = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Estudiantes',
                        data: valores,
                        backgroundColor: colores,
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
                                color: '#fff',
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: 'Distribución de Estudiantes por Grupo',
                            color: '#fff',
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error al crear gráfica de estudiantes por grupo:', error);
        }
    }

    /**
     * Crea gráfica de asistencia semanal (Barras)
     */
    crearGraficaAsistenciaSemanal() {
        const canvas = document.getElementById('chartAsistenciaSemanal');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Datos simulados por ahora
        const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const asistencias = [85, 92, 88, 95, 90, 78];

        if (this.charts.asistenciaSemanal) {
            this.charts.asistenciaSemanal.destroy();
        }

        this.charts.asistenciaSemanal = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: diasSemana,
                datasets: [{
                    label: 'Porcentaje de Asistencia',
                    data: asistencias,
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: '#fff',
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#fff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Asistencia Semanal',
                        color: '#fff',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                }
            }
        });
    }

    /**
     * Crea gráfica de promedio de asistencia (Línea)
     */
    crearGraficaPromedioAsistencia() {
        const canvas = document.getElementById('chartPromedioAsistencia');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Datos simulados por ahora (últimas 8 semanas)
        const semanas = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];
        const promedios = [82, 85, 87, 89, 91, 88, 92, 94];

        if (this.charts.promedioAsistencia) {
            this.charts.promedioAsistencia.destroy();
        }

        this.charts.promedioAsistencia = new Chart(ctx, {
            type: 'line',
            data: {
                labels: semanas,
                datasets: [{
                    label: 'Promedio de Asistencia',
                    data: promedios,
                    borderColor: '#43e97b',
                    backgroundColor: 'rgba(67, 233, 123, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#43e97b',
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
                        max: 100,
                        ticks: {
                            color: '#fff',
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#fff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Tendencia de Asistencia (Últimas 8 semanas)',
                        color: '#fff',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                }
            }
        });
    }

    /**
     * Destruye todas las gráficas
     */
    destruirGraficas() {
        Object.keys(this.charts).forEach(key => {
            if (this.charts[key]) {
                this.charts[key].destroy();
            }
        });
        this.charts = {};
    }

    /**
     * Refresca todas las gráficas
     */
    async refrescar() {
        this.destruirGraficas();
        await this.cargarEstadisticas();
        this.actualizarWidgets();
        await this.inicializarGraficas();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});
