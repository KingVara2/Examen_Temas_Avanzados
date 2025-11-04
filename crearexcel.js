// Generador de plantilla Excel para Importar Alumnos
// Uso: window.descargarPlantillaAlumnos({ groups, factores, filas, incluirEjemplos, nombreArchivo })
(function () {
  const EXCELJS_URL = 'https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js';
  const FILESAVER_URL = 'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js';

  // Catálogo completo (para CAT_FACTORES)
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
  const FACTOR_MAP = FACTOR_CATALOG.reduce((acc, f) => { acc[f.codigo] = f; return acc; }, {});

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      const existing = Array.from(document.scripts).find(s => (s.src || '').includes(src));
      if (existing) return existing.onload ? existing.onload() || resolve() : resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('No se pudo cargar ' + src));
      document.head.appendChild(s);
    });
  }

  async function ensureDeps() {
    if (typeof window.ExcelJS === 'undefined') {
      await loadScriptOnce(EXCELJS_URL);
    }
    if (typeof window.saveAs === 'undefined') {
      await loadScriptOnce(FILESAVER_URL);
    }
  }

  function timestampName(base) {
    const ts = new Date();
    const y = ts.getFullYear();
    const m = String(ts.getMonth()+1).padStart(2,'0');
    const d = String(ts.getDate()).padStart(2,'0');
    const hh = String(ts.getHours()).padStart(2,'0');
    const mm = String(ts.getMinutes()).padStart(2,'0');
    return `${base}_${y}${m}${d}_${hh}${mm}.xlsx`;
  }

  async function descargarPlantillaAlumnos({
    groups = ['Grupo A', 'Grupo B', 'Grupo C'],
    factores = ['F01','F02','F03','F04','F05','F06','F07','F08'],
    filas = 50,
    incluirEjemplos = true,
    nombreArchivo
  } = {}) {
    await ensureDeps();
    const ExcelJS = window.ExcelJS;

    filas = Math.max(1, Math.min(1000, parseInt(filas, 10) || 50));

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Proyecto ITT';
    wb.created = new Date();

    // Hoja principal: Alumnos
    const ws = wb.addWorksheet('Alumnos', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    const headers = ['Numero de control','Nombre','Apellidos','Carrera','Semestre','Grupo','Unidad1','Unidad2','Unidad3','Asistencia','Factores'];
    ws.addRow(headers);
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).alignment = { vertical:'middle', horizontal:'left' };
    ws.getRow(1).height = 22;

    const widths = [18,18,20,26,12,14,12,12,12,12,16];
    widths.forEach((w, i) => ws.getColumn(i+1).width = w);

    ws.getCell('K1').note = 'Factores: usa códigos F01..F08. Máximo 2, separados por punto y coma (ej: F01;F03).';

    // Precrear filas en blanco
    for (let i = 0; i < filas; i++) ws.addRow([]);

    // Solo UNA fila de ejemplo, claramente marcada para borrar
    if (incluirEjemplos) {
      const ejemplo = [
        '99999999',                // Numero de control (válido: solo dígitos)
        'EJEMPLO ELIMINAR',       // Nombre (válido con tu regex)
        'BORRAR',                 // Apellidos
        'Ingeniería en Sistemas', // Carrera
        1,                        // Semestre
        (groups[0] || 'Grupo A'), // Grupo
        0, 0, 0,                  // Unidad1..3
        0,                        // Asistencia
        'F01'                     // Factores
      ];
      ws.getRow(2).values = ejemplo;

      // Resaltar visualmente la fila de ejemplo y añadir nota
      const r = ws.getRow(2);
      r.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE68A' } }; // amarillo claro
        cell.font = { italic: true };
      });
      ws.getCell('A2').note = 'FILA DE EJEMPLO — ELIMÍNALA ANTES DE IMPORTAR' + '\n\n' +
        '• numero_control: solo dígitos, máximo 15.\n';

      ws.getCell('B2').note = 'FILA DE EJEMPLO — ELIMÍNALA ANTES DE IMPORTAR' + '\n\n' +
        '• nombre/apellidos: solo letras y espacios (se permiten acentos).\n';

      ws.getCell('C2').note = 'FILA DE EJEMPLO — ELIMÍNALA ANTES DE IMPORTAR' + '\n\n' +
        '• Apellido: solo letras y espacios (se permiten acentos).\n';

      ws.getCell('D2').note = 'FILA DE EJEMPLO — ELIMÍNALA ANTES DE IMPORTAR' + '\n\n' +
        '• Carrera: solo letras y espacios (se permiten acentos).\n';

      ws.getCell('F2').note = 'FILA DE EJEMPLO — ELIMÍNALA ANTES DE IMPORTAR' + '\n\n' +
        '• Semestre: Solo números, máximo 2 dígitos.\n';

      ws.getCell('E2').note = 'FILA DE EJEMPLO — ELIMÍNALA ANTES DE IMPORTAR' + '\n\n' +
        '• Grupo: Elegir un grupo de la lista.\n';

      ws.getCell('G2').note = 'FILA DE EJEMPLO — ELIMÍNALA ANTES DE IMPORTAR' + '\n\n' +
        '• Unidad 1 : solo números, máximo 2 dígitos.\n';
      ws.getCell('H2').note = 'FILA DE EJEMPLO — ELIMÍNALA ANTES DE IMPORTAR' + '\n\n' +
        '• Unidad 2: solo números, máximo 2 dígitos.\n';
      ws.getCell('I2').note = 'FILA DE EJEMPLO — ELIMÍNALA ANTES DE IMPORTAR' + '\n\n' +
        '• Unidad 3 : solo números, máximo 3 dígitos.\n';
        
      ws.getCell('J2').note = 'FILA DE EJEMPLO — ELIMÍNALA ANTES DE IMPORTAR' + '\n\n' +
        '• Asistencia (%) : solo números, máximo 3 dígitos.\n';  

      ws.getCell('K2').note = 'FILA DE EJEMPLO — ELIMÍNALA ANTES DE IMPORTAR' + '\n\n' +
        '• factores: usa códigos F01..F08. Máximo 2, separados por punto y coma (ej: F01;F03).\n';

    }

    // Hoja de listas (para data validations)
    const wsList = wb.addWorksheet('Listas');
    wsList.getCell('A1').value = 'Grupos';
    groups.forEach((g, i) => wsList.getCell(2+i, 1).value = g);
    wsList.getCell('B1').value = 'Factores';
    factores.forEach((f, i) => wsList.getCell(2+i, 2).value = f);
    wsList.state = 'veryHidden';

    // Validación de lista para "Grupo" (columna F)
    const lastG = 1 + groups.length;
    const formulaGrupos = `=Listas!$A$2:$A$${lastG}`;
    const startRow = 2;
    const endRow = 1 + filas;
    ws.dataValidations.add(`F${startRow}:F${endRow}`, {
      type: 'list',
      allowBlank: true,
      formulae: [formulaGrupos],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Valor no válido',
      error: 'Selecciona un grupo de la lista.'
    });

    // Sugerencia de lista para “Factores” (no multi‑select nativo)
    const lastF = 1 + factores.length;
    const formulaFact = `=Listas!$B$2:$B$${lastF}`;
    ws.dataValidations.add(`K${startRow}:K${endRow}`, {
      type: 'list',
      allowBlank: true,
      formulae: [formulaFact],
      showErrorMessage: false
    });

    // Hoja: CAT_FACTORES (catálogo visible)
    const wsCat = wb.addWorksheet('CAT_FACTORES', { views: [{ state: 'frozen', ySplit: 1 }] });
    wsCat.addRow(['codigo_factor','nombre_factor','descripcion']);
    wsCat.getRow(1).font = { bold: true };
    wsCat.getColumn(1).width = 14;
    wsCat.getColumn(2).width = 34;
    wsCat.getColumn(3).width = 70;

    const selected = (Array.isArray(factores) && factores.length)
      ? factores
      : FACTOR_CATALOG.map(f => f.codigo);

    selected.forEach(code => {
      const f = FACTOR_MAP[code] || { codigo: code, nombre: '—', descripcion: '—' };
      wsCat.addRow([f.codigo, f.nombre, f.descripcion]);
    });

    // Hoja: AYUDA (instrucciones)
    const wsHelp = wb.addWorksheet('AYUDA');
    wsHelp.getColumn(1).width = 110;

    const helpRows = [
      ['Instrucciones para completar la plantilla'],
      ['• No modifiques el nombre de las columnas de la hoja "Alumnos".'],
      ['• numero_control: solo dígitos, máximo 15. Ejemplos: 20250001, 21585965'],
      ['• nombre/apellidos: solo letras y espacios (se permiten acentos).'],
      ['• semestre: del 1 al 12.'],
      ['• unidad1, unidad2, unidad3 y asistencia: valores numéricos entre 0 y 100.'],
      ['• Grupo: selecciona desde la lista desplegable (Grupo A, Grupo B, Grupo C, etc.).'],
      ['• Factores: escribe hasta 2 códigos separados por punto y coma, por ejemplo F01;F03 (consulta la hoja CAT_FACTORES).'],
      ['• Importante: la fila resaltada en amarillo es SOLO UN EJEMPLO. ELIMÍNALA antes de importar.'],
      [''],
      ['Información adicional'],
      ['• La hoja "Listas" contiene valores para validaciones y está oculta.'],
      ['• Esta plantilla es compatible con Microsoft Excel y Google Sheets (algunas validaciones podrían variar).'],
    ];
    helpRows.forEach((r, i) => {
      const row = wsHelp.addRow(r);
      if (i === 0) { row.font = { bold: true, size: 12 }; }
    });

    const buffer = await wb.xlsx.writeBuffer();
    const fileName = nombreArchivo || timestampName('Plantilla_Alumnos');
    window.saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
  }

  // Expone la función para que la llames desde Importar.js
  window.descargarPlantillaAlumnos = descargarPlantillaAlumnos;
})();