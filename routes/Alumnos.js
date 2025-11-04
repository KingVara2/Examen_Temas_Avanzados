import express from 'express';
import sql from 'mssql';
import { dbConfig } from '../server.js';

const router = express.Router();

// Permitir letras con acentos, espacios, guion y apóstrofe
const soloLetrasES = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ' -]+$/;

router.post('/register', async (req, res) => {
  let transaction;
  try {
    let {
      numeroControl,
      nombre,
      apellidos,
      carrera,
      semestre,
      materia1,
      materia2,
      materia3,
      materia4,
      factores,
      idGrupo
    } = req.body;

    // -----------------------
    // VALIDACIONES
    // -----------------------
    if (
      !numeroControl ||
      !nombre ||
      !apellidos ||
      !carrera ||
      typeof semestre === 'undefined' ||
      semestre === null ||
      typeof idGrupo === 'undefined' ||
      idGrupo === null
    ) {
      return res.status(400).json({ success: false, message: ' Completa todos los campos obligatorios.' });
    }

    // Número de control solo números y máximo 15 dígitos
    if (!/^\d{1,15}$/.test(String(numeroControl))) {
      return res.status(400).json({ success: false, message: ' El número de control solo puede contener hasta 15 dígitos numéricos.' });
    }

    // Nombre y apellidos (permitir acentos, espacios, guion y apóstrofe)
    if (!soloLetrasES.test(nombre) || !soloLetrasES.test(apellidos)) {
      return res.status(400).json({ success: false, message: ' El nombre y los apellidos solo pueden contener letras (incluye acentos), espacios, guion y apóstrofe.' });
    }

    // A minúsculas (también lo refuerza el trigger AFTER)
    nombre = nombre.toLowerCase();
    apellidos = apellidos.toLowerCase();

    // Semestre entre 1 y 12
    if (isNaN(semestre) || semestre < 1 || semestre > 12) {
      return res.status(400).json({ success: false, message: ' El semestre debe estar entre 1 y 12.' });
    }

    // idGrupo entero positivo
    if (isNaN(idGrupo) || parseInt(idGrupo, 10) <= 0) {
      return res.status(400).json({ success: false, message: ' Debes seleccionar un grupo válido.' });
    }
    idGrupo = parseInt(idGrupo, 10);

    // Calificaciones entre 0 y 100
    const u1 = Number(materia1 ?? 0);
    const u2 = Number(materia2 ?? 0);
    const u3 = Number(materia3 ?? 0);
    const asis = Number(materia4 ?? 100);
    for (const cal of [u1, u2, u3, asis]) {
      if (isNaN(cal) || cal < 0 || cal > 100) {
        return res.status(400).json({ success: false, message: ' Las calificaciones deben estar entre 0 y 100.' });
      }
    }

    // Máximo 2 factores
    if (Array.isArray(factores) && factores.length > 2) {
      return res.status(400).json({ success: false, message: ' Solo se permiten máximo 2 factores de riesgo.' });
    }

    const pool = await sql.connect(dbConfig);
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // 1) Validar que el grupo exista y obtener su materia
    const grpReq = new sql.Request(transaction);
    grpReq.input('id_grupo', sql.Int, idGrupo);
    const grpRes = await grpReq.query(`
      SELECT id_grupo, id_materia
      FROM Grupos
      WHERE id_grupo = @id_grupo
    `);
    if (grpRes.recordset.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: ' El grupo seleccionado no existe.' });
    }
    const idMateria = grpRes.recordset[0].id_materia || null;

    // 2) Insertar alumno
    const insReq = new sql.Request(transaction);
    insReq
      .input('numeroControl', sql.VarChar, String(numeroControl))
      .input('nombre', sql.VarChar, nombre)
      .input('apellidos', sql.VarChar, apellidos)
      .input('carrera', sql.VarChar, carrera)
      .input('semestre', sql.Int, semestre);

    await insReq.query(`
      INSERT INTO Estudiantes (numero_control, nombre, apellidos, carrera, semestre)
      VALUES (@numeroControl, @nombre, @apellidos, @carrera, @semestre);
    `);

    // 3) Recuperar id_estudiante de forma robusta (evita problemas con triggers)
    const idReq = new sql.Request(transaction);
    idReq.input('numeroControl', sql.VarChar, String(numeroControl));
    const idRes = await idReq.query(`
      SELECT id_estudiante
      FROM Estudiantes WITH (UPDLOCK, HOLDLOCK)
      WHERE numero_control = @numeroControl
    `);
    if (idRes.recordset.length === 0) {
      await transaction.rollback();
      return res.status(500).json({ success: false, message: ' No se pudo recuperar el ID del estudiante.' });
    }
    const idEstudiante = idRes.recordset[0].id_estudiante;

    // 4) Relacionar alumno con grupo
    const egReq = new sql.Request(transaction);
    egReq
      .input('id_estudiante', sql.Int, idEstudiante)
      .input('id_grupo', sql.Int, idGrupo);
    await egReq.query(`
      INSERT INTO Estudiante_Grupo (id_estudiante, id_grupo)
      VALUES (@id_estudiante, @id_grupo)
    `);

    // 5) Insertar calificaciones si existe materia
    if (idMateria) {
      const calReq = new sql.Request(transaction);
      calReq
        .input('id_estudiante', sql.Int, idEstudiante)
        .input('id_materia', sql.Int, idMateria)
        .input('unidad1', sql.Decimal(5, 2), u1)
        .input('unidad2', sql.Decimal(5, 2), u2)
        .input('unidad3', sql.Decimal(5, 2), u3)
        .input('asistencia', sql.Decimal(5, 2), asis);

      await calReq.query(`
        INSERT INTO Calificaciones (id_estudiante, id_materia, unidad1, unidad2, unidad3, asistencia)
        VALUES (@id_estudiante, @id_materia, @unidad1, @unidad2, @unidad3, @asistencia)
      `);
    }

    // 6) Insertar factores de riesgo (máx. 2 ya validado)
    if (Array.isArray(factores) && factores.length > 0) {
      for (const codigo of factores) {
        const facReq = new sql.Request(transaction);
        facReq
          .input('id_estudiante', sql.Int, idEstudiante)
          .input('codigo_factor', sql.Char, codigo);
        await facReq.query(`
          INSERT INTO Factores_Riesgo (id_estudiante, codigo_factor)
          VALUES (@id_estudiante, @codigo_factor)
        `);
      }
    }

    await transaction.commit();
    res.json({ success: true, message: ' Alumno registrado correctamente con grupo, calificaciones y factores.' });

  } catch (err) {
    if (transaction) {
      try { await transaction.rollback(); } catch {}
    }
    console.error('Error registro alumno:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor: ' + err.message });
  }
});

router.get('/grupos-by-teacher/:id_cuenta', async (req, res) => {
  try {
    const idCuenta = parseInt(req.params.id_cuenta, 10);
    if (Number.isNaN(idCuenta)) {
      return res.status(400).json({ success: false, message: 'id_cuenta inválido' });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id_cuenta', sql.Int, idCuenta)
      .query(`
        SELECT g.id_grupo, g.nombre_grupo, m.id_materia, m.nombre_materia, m.semestre
        FROM Cuentas_Maestros cm
        JOIN Maestros ma   ON ma.id_maestro = cm.id_maestro
        JOIN Grupos g      ON g.id_maestro  = ma.id_maestro
        JOIN Materias m    ON m.id_materia  = g.id_materia
        WHERE cm.id_cuenta = @id_cuenta
        ORDER BY g.nombre_grupo
      `);

    res.json({
      success: true,
      grupos: result.recordset || []
    });
  } catch (err) {
    console.error('Error en grupos-by-teacher:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor: ' + err.message });
  }
});

/**
 * Registrar alumno (VALIDA que el grupo pertenezca al maestro de la cuenta actual)
 * POST /alumnos/register
 */
// Listar grupos y alumnos por maestro (id_cuenta)
router.get('/by-teacher/:id_cuenta', async (req, res) => {
  try {
    const idCuenta = parseInt(req.params.id_cuenta, 10);
    if (Number.isNaN(idCuenta)) {
      return res.status(400).json({ success: false, message: 'id_cuenta inválido' });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id_cuenta', sql.Int, idCuenta)
      .query(`
        SELECT 
          ma.id_maestro,
          ma.nombre       AS nombre_maestro,
          ma.apellidos    AS apellidos_maestro,
          g.id_grupo,
          g.nombre_grupo,
          m.nombre_materia,
          m.semestre      AS semestre_materia,
          e.id_estudiante,
          e.numero_control,
          e.nombre        AS nombre_estudiante,
          e.apellidos     AS apellidos_estudiante,
          e.carrera,
          e.semestre      AS semestre_estudiante
        FROM Cuentas_Maestros cm
        JOIN Maestros ma            ON ma.id_maestro = cm.id_maestro
        LEFT JOIN Grupos g          ON g.id_maestro = ma.id_maestro
        LEFT JOIN Materias m        ON m.id_materia = g.id_materia
        LEFT JOIN Estudiante_Grupo eg ON eg.id_grupo = g.id_grupo
        LEFT JOIN Estudiantes e     ON e.id_estudiante = eg.id_estudiante
        WHERE cm.id_cuenta = @id_cuenta
        ORDER BY g.nombre_grupo, e.apellidos, e.nombre;
      `);

    const rows = result.recordset || [];
    const maestroInfo = rows.find(r => r.id_maestro) || null;

    const gruposMap = new Map();
    for (const r of rows) {
      if (!r?.id_grupo) continue;
      if (!gruposMap.has(r.id_grupo)) {
        gruposMap.set(r.id_grupo, {
          id_grupo: r.id_grupo,
          nombre_grupo: r.nombre_grupo,
          nombre_materia: r.nombre_materia,
          semestre_materia: r.semestre_materia,
          alumnos: []
        });
      }
      if (r.id_estudiante) {
        gruposMap.get(r.id_grupo).alumnos.push({
          id_estudiante: r.id_estudiante,
          numero_control: r.numero_control,
          nombre: r.nombre_estudiante,
          apellidos: r.apellidos_estudiante,
          carrera: r.carrera,
          semestre: r.semestre_estudiante
        });
      }
    }

    return res.json({
      maestro: maestroInfo
        ? { id_maestro: maestroInfo.id_maestro, nombre: maestroInfo.nombre_maestro, apellidos: maestroInfo.apellidos_maestro }
        : null,
      grupos: Array.from(gruposMap.values())
    });
  } catch (err) {
    console.error('Error al listar alumnos por maestro:', err);
    return res.status(500).json({ success: false, message: 'Error en el servidor: ' + err.message });
  }
});

// Conteo de factores por grupo (para Pareto)
router.get('/factores-by-group/:id_grupo', async (req, res) => {
  try {
    const idGrupo = parseInt(req.params.id_grupo, 10);
    if (Number.isNaN(idGrupo)) {
      return res.status(400).json({ success: false, message: 'id_grupo inválido' });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id_grupo', sql.Int, idGrupo)
      .query(`
        SELECT fr.codigo_factor, COUNT(*) AS total
        FROM Estudiante_Grupo eg
        JOIN Factores_Riesgo fr ON fr.id_estudiante = eg.id_estudiante
        WHERE eg.id_grupo = @id_grupo
        GROUP BY fr.codigo_factor
        ORDER BY total DESC, fr.codigo_factor
      `);

    return res.json({ success: true, counts: result.recordset || [] });
  } catch (err) {
    console.error('Error factores-by-group:', err);
    return res.status(500).json({ success: false, message: 'Error en el servidor: ' + err.message });
  }
});

// Datos de dispersión por grupo: unidades, asistencia y calificación final
router.get('/dispersion-by-group/:id_grupo', async (req, res) => {
  try {
    const idGrupo = parseInt(req.params.id_grupo, 10);
    if (Number.isNaN(idGrupo)) {
      return res.status(400).json({ success: false, message: 'id_grupo inválido' });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id_grupo', sql.Int, idGrupo)
      .query(`
        SELECT 
          e.id_estudiante,
          e.numero_control,
          e.nombre,
          e.apellidos,
          c.unidad1,
          c.unidad2,
          c.unidad3,
          c.asistencia,
          -- calificación final persistida o calculada si fuera NULL
          COALESCE(c.calificacion_final, (COALESCE(c.unidad1,0)+COALESCE(c.unidad2,0)+COALESCE(c.unidad3,0))/3.0) AS calificacion_final
        FROM Estudiante_Grupo eg
        JOIN Estudiantes e ON e.id_estudiante = eg.id_estudiante
        JOIN Grupos g      ON g.id_grupo = eg.id_grupo
        LEFT JOIN Calificaciones c 
               ON c.id_estudiante = e.id_estudiante
              AND c.id_materia    = g.id_materia
        WHERE eg.id_grupo = @id_grupo
        ORDER BY e.apellidos, e.nombre;
      `);

    return res.json({ success: true, data: result.recordset || [] });
  } catch (err) {
    console.error('Error dispersion-by-group:', err);
    return res.status(500).json({ success: false, message: 'Error en el servidor: ' + err.message });
  }
});

export default router;