(() => {
  // Config
  const FACTOR_CATALOG = [
    { codigo: 'F01', nombre: 'Falta de asistencia', descripcion: 'Ausencias constantes, inasistencias prolongadas' },
    { codigo: 'F02', nombre: 'Falta de estudio o dedicación', descripcion: 'No repasa, entrega tarde, bajo esfuerzo' },
    { codigo: 'F03', nombre: 'Trabajo o carga laboral', descripcion: 'Tiene empleo o responsabilidades que reducen tiempo' },
    { codigo: 'F04', nombre: 'Problemas personales o familiares', descripcion: 'Situaciones personales que afectan el rendimiento' },
    { codigo: 'F05', nombre: 'Dificultad con el docente o la materia', descripcion: 'No entiende el método o el contenido' },
    { codigo: 'F06', nombre: 'Problemas económicos', descripcion: 'No puede pagar transporte, materiales, etc.' },
    { codigo: 'F07', nombre: 'Falta de interés o cambio de carrera', descripcion: 'Desmotivación o cambio de vocación' },
    { codigo: 'F08', nombre: 'Problemas de salud', descripcion: 'Enfermedades o limitaciones físicas/mentales' },
  ];
  const FACTOR_CODES = new Set(FACTOR_CATALOG.map(f => f.codigo));

  const EXPECTED_HEADERS = [
    'numero_control','nombre','apellidos','carrera','semestre','grupo',
    'unidad1','unidad2','unidad3','asistencia','factores'
  ];
  const HEADER_ALIASES = {
    'número de control': 'numero_control',
    'numero de control': 'numero_control',
    'no control': 'numero_control',
    'calificacion unidad 1': 'unidad1',
    'unidad 1': 'unidad1',
    'unidad 2': 'unidad2',
    'unidad 3': 'unidad3',
    'unidad1': 'unidad1',
    'unidad2': 'unidad2',
    'unidad3': 'unidad3',
    'asistencia (%)': 'asistencia',
    'factores de riesgo': 'factores',
  };

  // Estado
  let state = {
    rows: [],
    headers: [],
    file: null,
    fileName: '',
    sheetName: '',
    maxRows: 50,
    valid: false,
    issues: [],
  };

  // Utils
  function $(sel, root = document) { return root.querySelector(sel); }
  function toast(msg, icon = 'info', ms = 1600) {
    if (window.Swal) Swal.fire({ icon, title: msg, timer: ms, showConfirmButton: false });
    else alert(msg);
  }
  function setStats({ rows = 0, sheet = '—', file = '—' } = {}) {
    $('#rowCount') && ($('#rowCount').textContent = String(rows));
    $('#sheetName') && ($('#sheetName').textContent = sheet || '—');
    $('#fileName') && ($('#fileName').textContent = file || '—');
  }
  function renderTable(headers, rows) {
    const thead = $('#previewTable thead');
    const tbody = $('#previewTable tbody');
    if (!thead || !tbody) return;

    thead.innerHTML = '';
    const trh = document.createElement('tr');
    headers.forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      trh.appendChild(th);
    });
    thead.appendChild(trh);

    tbody.innerHTML = '';
    const cap = Math.min(rows.length, 500);
    for (let i = 0; i < cap; i++) {
      const tr = document.createElement('tr');
      headers.forEach(h => {
        const td = document.createElement('td');
        const val = rows[i][h];
        td.textContent = (val === undefined || val === null) ? '' : String(val);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
  }
  function enableSendButton(enabled) {
    const btn = $('#btnEnviar');
    if (btn) btn.disabled = !enabled;
  }

  // Normaliza headers: lower-case, quita tildes básicas, aplica alias
  function normalizeHeader(h) {
    const map = { á:'a', é:'e', í:'i', ó:'o', ú:'u', ü:'u', ñ:'n' };
    let k = String(h || '').trim().toLowerCase().replace(/[áéíóúüñ]/g, m => map[m] || m);
    if (HEADER_ALIASES[k]) return HEADER_ALIASES[k];
    return k;
  }

  function normalizeRowKeys(row) {
    const out = {};
    Object.keys(row).forEach(k => {
      const nk = normalizeHeader(k);
      out[nk] = row[k];
    });
    return out;
  }

  // Validaciones
  function parseFactores(cell) {
    if (cell == null) return [];
    const s = String(cell).trim();
    if (!s) return [];
    const parts = s.split(/[,;|\s]+/).map(x => x.trim()).filter(Boolean);
    const codes = parts.map(p => p.toUpperCase());
    const uniq = [...new Set(codes)];
    return uniq.slice(0, 2);
  }

  function validateRows(rows, maxRows) {
    const issues = [];
    const headers = Object.keys(rows[0] || {});
    const missing = EXPECTED_HEADERS.filter(h => !headers.includes(h));
    if (missing.length) {
      issues.push({ type: 'bad', msg: `Faltan columnas requeridas: ${missing.join(', ')}` });
      return { valid: false, issues };
    }

    if (rows.length > maxRows) {
      issues.push({ type: 'bad', msg: `El archivo contiene ${rows.length} filas y el límite actual es ${maxRows}.` });
    }

    const rowIssues = [];
    rows.forEach((r, idx) => {
      const errs = [];
      if (!/^\d{1,15}$/.test(String(r.numero_control || '').trim())) errs.push('numero_control inválido (solo dígitos, máx 15)');
      const soloLetras = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ' -]+$/;
      if (!soloLetras.test(String(r.nombre || '').trim())) errs.push('nombre inválido');
      if (!soloLetras.test(String(r.apellidos || '').trim())) errs.push('apellidos inválidos');
      const semestre = Number(r.semestre);
      if (!Number.isFinite(semestre) || semestre < 1 || semestre > 12) errs.push('semestre fuera de rango (1–12)');
      ['unidad1','unidad2','unidad3','asistencia'].forEach(k => {
        const v = Number(r[k]);
        if (!Number.isFinite(v) || v < 0 || v > 100) errs.push(`${k} fuera de rango (0–100)`);
      });
      const ff = parseFactores(r.factores);
      const invalid = ff.filter(c => !FACTOR_CODES.has(c));
      if (ff.length > 2) errs.push('más de 2 factores');
      if (invalid.length) errs.push(`códigos de factor inválidos: ${invalid.join(', ')}`);
      if (errs.length) rowIssues.push({ n: idx + 1, errs });
    });

    if (rowIssues.length) {
      rowIssues.slice(0, 10).forEach(ri => issues.push({ type: 'bad', msg: `Fila ${ri.n}: ${ri.errs.join(' | ')}` }));
      if (rowIssues.length > 10) issues.push({ type: 'bad', msg: `... y ${rowIssues.length - 10} filas con errores más.` });
    }

    const valid = issues.every(i => i.type !== 'bad') && rows.length > 0 && rows.length <= maxRows;
    return { valid, issues };
  }

  function renderIssues(issues) {
    const box = $('#validationBox');
    if (!box) return;
    if (!issues || issues.length === 0) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    box.classList.remove('hidden');
    const parts = issues.map(i => `<div class="${i.type === 'bad' ? 'bad' : i.type === 'warn' ? 'warn' : 'ok'}">• ${i.msg}</div>`);
    box.innerHTML = `<div class="badge">Validación del archivo</div><div class="list">${parts.join('')}</div>`;
  }

  // Parseo del archivo
  async function parseFile(file) {
    if (!file) { toast('Selecciona un archivo primero', 'warning'); return; }
    $('#fileInfo') && ($('#fileInfo').textContent = `Leyendo ${file.name} ...`);

    const ab = await file.arrayBuffer();
    const wb = XLSX.read(ab, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });
    const firstSheet = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheet];

    const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
    const rows = raw.map(r => normalizeRowKeys(r));
    const headers = rows.length ? Object.keys(rows[0]) : [];
    const displayHeaders = EXPECTED_HEADERS.filter(h => headers.includes(h));

    state = { ...state, rows, headers: displayHeaders, file, fileName: file.name, sheetName: firstSheet };

    const { valid, issues } = validateRows(rows, state.maxRows);
    state.valid = valid; state.issues = issues;

    renderTable(displayHeaders, rows);
    setStats({ rows: rows.length, sheet: firstSheet, file: file.name });
    renderIssues(issues);
    $('#fileInfo').textContent = `${file.name} (${rows.length} fila(s))`;
    enableSendButton(valid);
    toast(valid ? 'Archivo listo' : 'Archivo con errores', valid ? 'success' : 'error');
  }

  function clearAll() {
    state = { rows: [], headers: [], file: null, fileName: '', sheetName: '', maxRows: state.maxRows, valid: false, issues: [] };
    const thead = $('#previewTable thead');
    const tbody = $('#previewTable tbody');
    if (thead) thead.innerHTML = '';
    if (tbody) tbody.innerHTML = '';
    const fileInput = $('#excelFile'); if (fileInput) fileInput.value = '';
    const fileInfo = $('#fileInfo'); if (fileInfo) fileInfo.textContent = '';
    setStats({ rows: 0, sheet: '—', file: '—' });
    renderIssues([]); enableSendButton(false);
  }

  // Drag and drop
  function wireDragAndDrop(root) {
    const dz = $('#dropzone', root);
    const input = $('#excelFile', root);
    if (!dz || !input) return;

    ['dragenter','dragover'].forEach(ev => {
      dz.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dz.classList.add('dragover'); });
    });
    ['dragleave','drop'].forEach(ev => {
      dz.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dz.classList.remove('dragover'); });
    });
    dz.addEventListener('drop', (e) => {
      const files = e.dataTransfer?.files;
      if (files && files.length) {
        $('#fileInfo').textContent = files[0].name;
        $('#excelFile').files = files;
      }
    });
    input.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) $('#fileInfo').textContent = file.name;
    });
  }

  // Carga dinámica de crearexcel.js si no está presente
  async function ensureCrearexcel() {
    if (typeof window.descargarPlantillaAlumnos === 'function') return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'crearexcel.js';
      s.defer = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error('No se pudo cargar crearexcel.js'));
      document.head.appendChild(s);
    });
  }

  // Obtener grupos del maestro actual para la plantilla
  async function getGruposActuales() {
    try {
      const idCuenta = localStorage.getItem('id_maestro');
      if (!idCuenta) return ['Grupo A','Grupo B','Grupo C'];
      const res = await fetch(`http://localhost:3000/alumnos/grupos-by-teacher/${encodeURIComponent(idCuenta)}`);
      const data = await res.json();
      if (data?.success && Array.isArray(data.grupos) && data.grupos.length) {
        const set = new Set(data.grupos.map(g => g.nombre_grupo || '').filter(Boolean));
        const ordered = ['Grupo A','Grupo B','Grupo C'].filter(n => set.has(n));
        data.grupos.forEach(g => { if (!ordered.includes(g.nombre_grupo)) ordered.push(g.nombre_grupo); });
        return ordered.length ? ordered : ['Grupo A','Grupo B','Grupo C'];
      }
      return ['Grupo A','Grupo B','Grupo C'];
    } catch (e) {
      console.warn('No se pudieron obtener grupos del maestro, usando A/B/C', e);
      return ['Grupo A','Grupo B','Grupo C'];
    }
  }

  function init(root = document) {
    // Asegura que estamos dentro de la vista montada
    const scope = root.querySelector('#importarRoot') ? root : document;
    if (!scope.querySelector('#importarRoot')) return;

    wireDragAndDrop(scope);

    // Botones principales del importador
    $('#btnCargar', scope)?.addEventListener('click', async () => {
      await parseFile($('#excelFile', scope)?.files?.[0]);
    });
    $('#btnLimpiar', scope)?.addEventListener('click', clearAll);

    // Plantilla Excel: usar el botón correcto de tu HTML
    const btnPlantilla = $('#btnDescargarPlantilla', scope);
    if (btnPlantilla) {
      btnPlantilla.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await ensureCrearexcel(); // por si no cargaste crearexcel.js globalmente
          const grupos = await getGruposActuales();
          await window.descargarPlantillaAlumnos({
            groups: grupos,
            factores: ['F01','F02','F03','F04','F05','F06','F07','F08'],
            filas: 50,
            incluirEjemplos: true
          });
        } catch (err) {
          console.error('Descarga de plantilla falló:', err);
          toast('No se pudo generar la plantilla.', 'error');
        }
      });
    }

    // Enviar (placeholder)
    $('#btnEnviar', scope)?.addEventListener('click', () => {
      if (!state.valid) { toast('Corrige los errores antes de enviar.', 'warning'); return; }
      toast('Enviar registros: próximamente', 'info');
    });

    // Límite por carga
    $('#maxRowsSelect', scope)?.addEventListener('change', (e) => {
      const v = parseInt(e.target.value || '50', 10);
      state.maxRows = Number.isFinite(v) ? v : 50;
      if (state.rows.length) {
        const { valid, issues } = validateRows(state.rows, state.maxRows);
        state.valid = valid; state.issues = issues;
        renderIssues(issues);
        enableSendButton(valid);
      }
    });

    // Estado inicial
    setStats({ rows: 0, sheet: '—', file: '—' });
    renderIssues([]); enableSendButton(false);
  }

  // EXPONER para que el router la invoque tras montar Importar.html
  window.initImportar = init;
})();