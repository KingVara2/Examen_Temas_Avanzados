// Pareto dentro del SPA: carga los grupos del maestro actual y pinta el diagrama por grupo
(function(){
  const API = 'http://localhost:3000';

  // Catálogo para tooltips bonitos
  const FACTOR_CATALOG = {
    F01: 'Falta de asistencia',
    F02: 'Falta de estudio o dedicación',
    F03: 'Trabajo o carga laboral',
    F04: 'Problemas personales o familiares',
    F05: 'Dificultad con docente/materia',
    F06: 'Problemas económicos',
    F07: 'Falta de interés o cambio de carrera',
    F08: 'Problemas de salud'
  };

  // Asegura Chart.js
  async function ensureChartJs() {
    if (window.Chart) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      s.defer = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error('No se pudo cargar Chart.js'));
      document.head.appendChild(s);
    });
  }

  // Trae los grupos del maestro logueado
  async function fetchGruposMaestro() {
    const idCuenta = localStorage.getItem('id_maestro');
    if (!idCuenta) throw new Error('No hay sesión: id_maestro ausente en localStorage.');
    const res = await fetch(`${API}/alumnos/grupos-by-teacher/${encodeURIComponent(idCuenta)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} al cargar grupos`);
    const data = await res.json();
    return data.grupos || [];
  }

  // Endpoint esperado: GET /alumnos/factores-by-group/:id_grupo
  // Respuesta: { success:true, counts:[ { codigo_factor:'F01', total:12 }, ... ] }
  async function fetchConteosPorFactor(idGrupo) {
    const res = await fetch(`${API}/alumnos/factores-by-group/${encodeURIComponent(idGrupo)}`);
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`No se pudieron obtener factores (${res.status}) ${t.slice(0,120)}`);
    }
    const data = await res.json();
    return Array.isArray(data.counts) ? data.counts : [];
  }

  // Cálculo % acumulado
  function acumuladoPct(valores) {
    const total = valores.reduce((a,b)=>a+b,0) || 1;
    let acc = 0;
    return valores.map(v => {
      acc += v;
      return +(acc * 100 / total).toFixed(1);
    });
  }

  // Estado del gráfico (para destruir y recrear)
  let chart;

  async function renderPareto(idGrupo, nombreGrupo) {
    await ensureChartJs();

    const counts = await fetchConteosPorFactor(idGrupo);
    // Ordenar desc
    const orden = counts
      .slice()
      .sort((a,b) => (b.total||0) - (a.total||0));

    const labels = orden.map(x => x.codigo_factor);
    const barras = orden.map(x => x.total||0);
    const linea = acumuladoPct(barras);

    const ctx = document.getElementById('paretoChart')?.getContext('2d');
    if (!ctx) return;

    if (chart) { chart.destroy(); chart = null; }

    chart = new Chart(ctx, {
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Frecuencia',
            data: barras,
            yAxisID: 'y',
            backgroundColor: 'rgba(76, 92, 255, 0.65)',
            borderColor: '#4c5cff',
            borderWidth: 1,
          },
          {
            type: 'line',
            label: '% Acumulado',
            data: linea,
            yAxisID: 'y1',
            borderColor: '#f59e0b',
            backgroundColor: '#f59e0b',
            tension: 0.3,
            pointStyle: 'circle',
            pointRadius: 4,
            fill: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Pareto por factores — ${nombreGrupo}`,
            font: { size: 18, weight: 'bold' },
            color: '#e8e8f0'
          },
          legend: {
            position: 'bottom',
            labels: { color: '#cfd8ff', font: { size: 13 } }
          },
          tooltip: {
            callbacks: {
              title: (items) => {
                const code = items?.[0]?.label;
                const name = FACTOR_CATALOG[code] || '';
                return name ? `${code} — ${name}` : code;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Frecuencia', color: '#cbd3e6' },
            ticks: { color: '#cbd3e6' },
            grid: { color: 'rgba(255,255,255,0.08)' }
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            title: { display: true, text: '% Acumulado', color: '#cbd3e6' },
            min: 0,
            max: 100,
            ticks: { color: '#cbd3e6' },
            grid: { drawOnChartArea: false }
          },
          x: {
            ticks: { color: '#cbd3e6' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        }
      }
    });
  }

  // Inicializador que usará tu router tras montar pareto.html
  window.initPareto = async function initPareto() {
    const root = document.getElementById('paretoRoot');
    if (!root) return;

    const sel = document.getElementById('paSelectGrupo');
    const btn = document.getElementById('paRefresh');

    try {
      // Poblar grupos del maestro
      const grupos = await fetchGruposMaestro();
      sel.innerHTML = '';
      if (!grupos.length) {
        sel.innerHTML = `<option value="" disabled selected>Sin grupos</option>`;
        if (window.Swal) Swal.fire('Sin datos','No hay grupos para el maestro actual.','info');
        return;
      }

      // Orden A, B, C primero
      const order = (n) => ({ 'Grupo A': 1, 'Grupo B': 2, 'Grupo C': 3 }[n] || 9);
      grupos.sort((a,b) => order(a.nombre_grupo) - order(b.nombre_grupo) || a.nombre_grupo.localeCompare(b.nombre_grupo));

      for (const g of grupos) {
        const opt = document.createElement('option');
        opt.value = g.id_grupo;
        opt.textContent = `${g.nombre_grupo} · ${g.nombre_materia || ''}`.trim();
        sel.appendChild(opt);
      }

      async function run() {
        const id = Number(sel.value);
        const name = sel.options[sel.selectedIndex]?.text?.split('·')[0]?.trim() || 'Grupo';
        if (!id) return;
        if (window.Swal) {
          Swal.fire({ title:'Cargando...', didOpen:()=>Swal.showLoading(), allowOutsideClick:false, allowEscapeKey:false });
        }
        try {
          await renderPareto(id, name);
        } finally {
          if (window.Swal) Swal.close();
        }
      }

      sel.addEventListener('change', run);
      btn?.addEventListener('click', run);

      // Primera carga
      await run();
    } catch (err) {
      console.error('initPareto error:', err);
      if (window.Swal) Swal.fire('Error', err?.message || 'No se pudo inicializar Pareto.', 'error');
    }
  };
})();