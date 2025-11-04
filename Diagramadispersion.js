// Diagrama de Dispersión (SPA): X/Y seleccionables, correlación y línea de tendencia
(function(){
  const API = 'http://localhost:3000';

  // Asegurar Chart.js
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

  // Grupos del maestro
  async function fetchGruposMaestro() {
    const idCuenta = localStorage.getItem('id_maestro');
    if (!idCuenta) throw new Error('No hay sesión: id_maestro ausente en localStorage.');
    const res = await fetch(`${API}/alumnos/grupos-by-teacher/${encodeURIComponent(idCuenta)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} al cargar grupos`);
    const data = await res.json();
    return data.grupos || [];
  }

  // Datos X/Y por grupo
  async function fetchDispersionData(idGrupo) {
    const res = await fetch(`${API}/alumnos/dispersion-by-group/${encodeURIComponent(idGrupo)}`);
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`No se pudieron obtener datos (${res.status}) ${t.slice(0,120)}`);
    }
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : [];
  }

  // Correlación de Pearson y regresión lineal
  function statsAndFit(points) {
    // points: [{x, y}]
    const n = points.length;
    if (!n) return { r: 0, r2: 0, m: 0, b: 0 };
    let sumX=0, sumY=0, sumXY=0, sumXX=0, sumYY=0;
    points.forEach(p => {
      const x = Number(p.x) || 0; const y = Number(p.y) || 0;
      sumX += x; sumY += y; sumXY += x*y; sumXX += x*x; sumYY += y*y;
    });
    const num = n*sumXY - sumX*sumY;
    const den = Math.sqrt((n*sumXX - sumX*sumX) * (n*sumYY - sumY*sumY)) || 1;
    const r = num / den;
    const r2 = r*r;

    const xbar = sumX / n;
    const ybar = sumY / n;
    const m = (sumXY - n*xbar*ybar) / (sumXX - n*xbar*xbar || 1);
    const b = ybar - m*xbar;

    return { r, r2, m, b };
  }

  function computeFitLine(points, m, b) {
    if (!points.length) return [];
    const xs = points.map(p => p.x).filter(v => Number.isFinite(v));
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    return [
      { x: minX, y: m*minX + b },
      { x: maxX, y: m*maxX + b }
    ];
  }

  const LABELS = {
    unidad1: 'Unidad 1',
    unidad2: 'Unidad 2',
    unidad3: 'Unidad 3',
    asistencia: 'Asistencia (%)',
    calificacion_final: 'Calificación Final'
  };

  let chart;

  async function render(idGrupo, nombreGrupo, xKey, yKey) {
    await ensureChartJs();
    const raw = await fetchDispersionData(idGrupo);

    // Normaliza puntos válidos (0..100)
    const pts = raw.map(r => ({
      x: Number(r[xKey]),
      y: Number(r[yKey]),
      nombre: `${r.nombre} ${r.apellidos}`.trim(),
      numero_control: r.numero_control
    })).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));

    const { r, r2, m, b } = statsAndFit(pts);
    const fit = computeFitLine(pts, m, b);

    const ctx = document.getElementById('dispersionChart')?.getContext('2d');
    if (!ctx) return;

    if (chart) { chart.destroy(); chart = null; }

    chart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Alumnos',
            data: pts,
            pointBackgroundColor: 'rgba(76,92,255,0.85)',
            pointBorderColor: '#4c5cff',
            pointRadius: 4,
          },
          {
            label: 'Tendencia',
            type: 'line',
            data: fit,
            borderColor: '#f59e0b',
            backgroundColor: '#f59e0b',
            pointRadius: 0,
            borderWidth: 2,
            fill: false,
            tension: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        plugins: {
          title: {
            display: true,
            text: `Dispersión — ${nombreGrupo} | X: ${LABELS[xKey]} | Y: ${LABELS[yKey]}`,
            font: { size: 18, weight: 'bold' },
            color: '#e8e8f0'
          },
          legend: {
            position: 'bottom',
            labels: { color: '#cfd8ff', font: { size: 13 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const p = ctx.raw;
                return `${p.nombre} (${p.numero_control}) • X=${p.x.toFixed(1)}, Y=${p.y.toFixed(1)}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: LABELS[xKey], color: '#cbd3e6' },
            min: 0, max: 100,
            grid: { color: 'rgba(255,255,255,0.08)' },
            ticks: { color: '#cbd3e6' }
          },
          y: {
            title: { display: true, text: LABELS[yKey], color: '#cbd3e6' },
            min: 0, max: 100,
            grid: { color: 'rgba(255,255,255,0.08)' },
            ticks: { color: '#cbd3e6' }
          }
        }
      }
    });

    const resumen = document.getElementById('dsResumen');
    if (resumen) {
      const sign = r >= 0 ? '+' : '';
      resumen.textContent = `n=${pts.length} • r=${sign}${r.toFixed(3)} • r²=${(r2*100).toFixed(1)}%`;
    }
  }

  // Inicializador que llamará el router tras montar Diagramadispersion.html
  window.initDispersion = async function initDispersion() {
    const root = document.getElementById('dispersionRoot');
    if (!root) return;

    const selGrupo = document.getElementById('dsSelectGrupo');
    const selX = document.getElementById('dsSelectX');
    const selY = document.getElementById('dsSelectY');
    const btn = document.getElementById('dsRefresh');

    try {
      // Poblar grupos del maestro
      const grupos = await fetchGruposMaestro();
      selGrupo.innerHTML = '';
      if (!grupos.length) {
        selGrupo.innerHTML = `<option value="" disabled selected>Sin grupos</option>`;
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
        selGrupo.appendChild(opt);
      }

      async function run() {
        const id = Number(selGrupo.value);
        const name = selGrupo.options[selGrupo.selectedIndex]?.text?.split('·')[0]?.trim() || 'Grupo';
        const xKey = selX.value;
        const yKey = selY.value;
        if (!id) return;
        if (window.Swal) {
          Swal.fire({ title:'Cargando...', didOpen:()=>Swal.showLoading(), allowOutsideClick:false, allowEscapeKey:false });
        }
        try {
          await render(id, name, xKey, yKey);
        } finally {
          if (window.Swal) Swal.close();
        }
      }

      selGrupo.addEventListener('change', run);
      selX.addEventListener('change', run);
      selY.addEventListener('change', run);
      btn?.addEventListener('click', run);

      // Primera carga
      await run();
    } catch (err) {
      console.error('initDispersion error:', err);
      if (window.Swal) Swal.fire('Error', err?.message || 'No se pudo inicializar Dispersión.', 'error');
    }
  };
})();