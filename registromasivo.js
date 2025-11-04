// Registro masivo desde la vista Importar
// - Valida el archivo otra vez antes de enviar (si hay errores, no envía nada)
// - Mapea "grupo" (nombre o id) -> id_grupo del maestro actual
// - Envía secuencialmente a POST /alumnos/register
// - Muestra progreso con SweetAlert y limpia al finalizar

(function () {
  const API = 'http://localhost:3000';
  const EXPECTED_HEADERS = [
    'numero_control','nombre','apellidos','carrera','semestre','grupo',
    'unidad1','unidad2','unidad3','asistencia','factores'
  ];

  // Helpers DOM
  const $ = (sel, root = document) => root.querySelector(sel);

  // Normaliza encabezados
  const HEADER_ALIASES = {
    'número de control': 'numero_control',
    'numero de control': 'numero_control',
    'no control': 'numero_control',
    'calificacion unidad 1': 'unidad1',
    'unidad 1': 'unidad1',
    'unidad 2': 'unidad2',
    'unidad 3': 'unidad3',
    'asistencia (%)': 'asistencia',
    'factores de riesgo': 'factores',
  };
  function normalizeHeader(h) {
    const map = { á:'a', é:'e', í:'i', ó:'o', ú:'u', ü:'u', ñ:'n' };
    let k = String(h || '').trim().toLowerCase().replace(/[áéíóúüñ]/g, m => map[m] || m);
    if (HEADER_ALIASES[k]) return HEADER_ALIASES[k];
    return k;
  }
  function normalizeRowKeys(row) {
    const out = {};
    Object.keys(row).forEach(k => out[normalizeHeader(k)] = row[k]);
    return out;
  }

  // Validaciones
  const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ' -]+$/;
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
    if (!rows.length) {
      issues.push('El archivo no contiene filas.');
      return { valid: false, issues };
    }

    // Headers requeridos
    const headers = Object.keys(rows[0]);
    const missing = EXPECTED_HEADERS.filter(h => !headers.includes(h));
    if (missing.length) {
      issues.push(`Faltan columnas requeridas: ${missing.join(', ')}`);
    }

    if (rows.length > maxRows) {
      issues.push(`El archivo contiene ${rows.length} filas y el límite actual es ${maxRows}.`);
    }

    rows.forEach((r, i) => {
      const n = i + 2; // considerando encabezados en fila 1
      const errs = [];

      if (!/^\d{1,15}$/.test(String(r.numero_control || '').trim())) errs.push('numero_control inválido (solo dígitos, máx 15)');
      if (!SOLO_LETRAS.test(String(r.nombre || '').trim())) errs.push('nombre inválido');
      if (!SOLO_LETRAS.test(String(r.apellidos || '').trim())) errs.push('apellidos inválidos');

      const sem = Number(r.semestre);
      if (!Number.isFinite(sem) || sem < 1 || sem > 12) errs.push('semestre fuera de rango (1–12)');

      ['unidad1','unidad2','unidad3','asistencia'].forEach(k => {
        const v = Number(r[k]);
        if (!Number.isFinite(v) || v < 0 || v > 100) errs.push(`${k} fuera de rango (0–100)`);
      });

      const ff = parseFactores(r.factores);
      if (ff.length > 2) errs.push('más de 2 factores');

      if (errs.length) issues.push(`Fila ${n}: ${errs.join(' | ')}`);
    });

    return { valid: issues.length === 0, issues };
  }

  // Lee y normaliza el archivo actual del input
  async function readCurrentFile() {
    const fi = $('#excelFile');
    const file = fi?.files?.[0];
    if (!file) throw new Error('Selecciona un archivo primero.');

    if (typeof XLSX === 'undefined') {
      throw new Error('No se cargó XLSX en la página.');
    }

    const ab = await file.arrayBuffer();
    const wb = XLSX.read(ab, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });
    const firstSheet = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheet];

    const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
    const rows = raw.map(r => normalizeRowKeys(r));
    return { sheet: firstSheet, rows };
  }

  // Mapea "grupo" -> id_grupo del maestro actual
  async function buildGrupoMap() {
    const idCuenta = localStorage.getItem('id_maestro');
    if (!idCuenta) throw new Error('No hay sesión: id_maestro ausente en localStorage.');

    const res = await fetch(`${API}/alumnos/grupos-by-teacher/${encodeURIComponent(idCuenta)}`);
    if (!res.ok) throw new Error(`Grupos del maestro no disponibles (HTTP ${res.status}).`);
    const data = await res.json();
    const mapByName = new Map();
    const mapById = new Map();
    for (const g of (data.grupos || [])) {
      if (g?.nombre_grupo) mapByName.set(String(g.nombre_grupo).trim().toLowerCase(), g.id_grupo);
      if (g?.id_grupo) mapById.set(Number(g.id_grupo), g.id_grupo);
    }
    return { idCuenta: Number(idCuenta), mapByName, mapById };
  }

  // Convierte filas a payload del backend
  function toPayloads(rows, idCuenta, grupoMap) {
    return rows.map(r => {
      // Grupo puede venir como nombre (Grupo A) o id (6)
      let idGrupo = null;
      const gval = r.grupo;
      if (gval !== undefined && gval !== null && String(gval).trim() !== '') {
        if (/^\d+$/.test(String(gval).trim())) {
          const asNum = Number(gval);
          idGrupo = grupoMap.mapById.get(asNum) ?? null;
        } else {
          idGrupo = grupoMap.mapByName.get(String(gval).trim().toLowerCase()) ?? null;
        }
      }
      const factoresArr = parseFactores(r.factores);

      return {
        numeroControl: String(r.numero_control).trim(),
        nombre: String(r.nombre).trim(),
        apellidos: String(r.apellidos).trim(),
        carrera: String(r.carrera).trim(),
        semestre: Number(r.semestre),
        materia1: Number(r.unidad1 || 0),
        materia2: Number(r.unidad2 || 0),
        materia3: Number(r.unidad3 || 0),
        // tu backend acepta materia4 o asistencia
        materia4: Number(r.asistencia ?? 100),
        factores: factoresArr,
        idGrupo,
        idCuenta
      };
    });
  }

  // Progreso con Swal
  function showProgress(total) {
    return new Promise(resolve => {
      Swal.fire({
        title: 'Registrando alumnos...',
        html: `<div style="font-size:14px;color:#94a3b8">0/${total} completados</div>`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => { Swal.showLoading(); resolve(); }
      });
    });
  }
  function updateProgress(done, total) {
    const html = Swal.getHtmlContainer();
    if (html) html.innerHTML = `<div style="font-size:14px;color:#94a3b8">${done}/${total} completados</div>`;
  }

  async function enviarRegistros() {
    try {
      const btn = $('#btnEnviar');
      if (btn) btn.disabled = true;

      // 1) Lee y normaliza el archivo
      const { rows } = await readCurrentFile();

      // 2) Validación estricta (si hay algo mal, no se envía nada)
      const maxRowsSel = $('#maxRowsSelect');
      const maxRows = Number(maxRowsSel?.value || 50);
      const { valid, issues } = validateRows(rows, maxRows);
      if (!valid) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo inválido',
          html: `<div style="text-align:left; font-size:14px">${issues.slice(0,10).map(i => `• ${i}`).join('<br>')}${issues.length>10?'<br>...':''}</div>`
        });
        if (btn) btn.disabled = false;
        return;
      }

      // 3) Mapa de grupos por maestro
      const { idCuenta, mapByName, mapById } = await buildGrupoMap();
      const payloads = toPayloads(rows, idCuenta, { mapByName, mapById });

      // Verifica que todos tengan idGrupo
      const sinGrupo = payloads
        .map((p, idx) => ({ idx, p }))
        .filter(x => !x.p.idGrupo)
        .map(x => x.idx + 2); // fila excel aprox
      if (sinGrupo.length) {
        Swal.fire({
          icon: 'error',
          title: 'Grupo inválido',
          html: `Estas filas no tienen un grupo válido para este maestro: <b>${sinGrupo.join(', ')}</b><br>Usa "Grupo A", "Grupo B", "Grupo C" o el id válido.`
        });
        if (btn) btn.disabled = false;
        return;
      }

      // 4) Progreso
      await showProgress(payloads.length);

      // 5) Envío secuencial
      let ok = 0;
      const fails = [];

      for (let i = 0; i < payloads.length; i++) {
        const body = payloads[i];
        try {
          const res = await fetch(`${API}/alumnos/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data?.success === false) {
            const msg = data?.message || `HTTP ${res.status}`;
            fails.push({ fila: i + 2, numero_control: body.numeroControl, msg });
            break; // fail-fast: detener para “todo o nada” en lo posible
          } else {
            ok++;
            updateProgress(ok, payloads.length);
          }
        } catch (err) {
          fails.push({ fila: i + 2, numero_control: body.numeroControl, msg: err.message });
          break;
        }
      }

      Swal.close();

      if (fails.length > 0) {
        Swal.fire({
          icon: 'error',
          title: 'Error al registrar',
          html: `<div style="text-align:left; font-size:14px">
                  Se detuvo el proceso para evitar registros parciales.<br><br>
                  Primer error:<br>
                  • Fila ${fails[0].fila} (No. Control ${fails[0].numero_control}) — ${fails[0].msg}
                </div>`
        });
        if (btn) btn.disabled = false;
        return;
      }

      // 6) Éxito y limpiar
      await Swal.fire({
        icon: 'success',
        title: 'Registros completados',
        text: `${ok} de ${payloads.length} alumnos registrados correctamente.`
      });

      // Dispara el botón "Limpiar" del importador para resetear todo
      $('#btnLimpiar')?.click();
      if (btn) btn.disabled = false;

    } catch (err) {
      console.error('Registro masivo falló:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err?.message || 'No se pudo completar el registro.' });
      const btn = $('#btnEnviar'); if (btn) btn.disabled = false;
    }
  }

  // Enlazar al montar la vista Importar
  function wire() {
    const btn = $('#btnEnviar');
    if (btn && !btn._rm_bound) {
      btn._rm_bound = true;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        // Requisito: debe haber archivo seleccionado
        const fi = $('#excelFile');
        if (!fi?.files?.length) {
          Swal.fire({ icon: 'warning', title: 'Selecciona un archivo', text: 'Debes cargar un archivo antes de enviar.' });
          return;
        }
        enviarRegistros();
      });
    }
  }

  // Hookeamos initImportar para que, cuando tu router monte la vista, conectemos el botón
  const prevInit = window.initImportar;
  window.initImportar = function (...args) {
    try { if (typeof prevInit === 'function') prevInit.apply(this, args); } catch (_e) {}
    // Espera un frame para que exista el DOM inyectado
    setTimeout(wire, 0);
  };
})();