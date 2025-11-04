// routes/auth.js
import express from 'express';
import sql from 'mssql';
import bcrypt from 'bcryptjs';
import { dbConfig } from '../server.js';

const router = express.Router();

// REGISTRO DE MAESTROS
router.post('/register', async (req, res) => {
  try {
    const { nombre, apellidos, correo_institucional, usuario, contrasena } = req.body;

    if (!nombre || !apellidos || !correo_institucional || !usuario || !contrasena) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos.' });
    }

    const pool = await sql.connect(dbConfig);

    // Insertar en Maestros
    const resultMaestro = await pool.request()
      .input('nombre', sql.VarChar, nombre)
      .input('apellidos', sql.VarChar, apellidos)
      .input('correo', sql.VarChar, correo_institucional)
      .query(`
        INSERT INTO Maestros (nombre, apellidos, correo_institucional)
        OUTPUT INSERTED.id_maestro
        VALUES (@nombre, @apellidos, @correo)
      `);

    const idMaestro = resultMaestro.recordset[0].id_maestro;
    const hashed = await bcrypt.hash(contrasena, 10);

    // Insertar en Cuentas_Maestros
    await pool.request()
      .input('id_maestro', sql.Int, idMaestro)
      .input('usuario', sql.VarChar, usuario)
      .input('hash', sql.NVarChar, hashed)
      .query(`
        INSERT INTO Cuentas_Maestros (id_maestro, usuario, contrasena_hash, activo)
        VALUES (@id_maestro, @usuario, @hash, 1)
      `);

    res.json({ success: true, message: ' Maestro registrado correctamente.' });

  } catch (err) {
    console.error('Error registro:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor: ' + err.message });
  }
});

// LOGIN DE MAESTROS
router.post('/login', async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
      return res.status(400).json({ success: false, message: 'Faltan datos.' });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input('usuario', sql.VarChar, usuario)
      .query(`SELECT * FROM Cuentas_Maestros WHERE usuario = @usuario AND activo = 1`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    const cuenta = result.recordset[0];
    const valid = await bcrypt.compare(contrasena, cuenta.contrasena_hash);

    if (!valid) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
    }

    // Login exitoso
    res.json({ success: true, message: 'Inicio de sesión exitoso.', id_cuenta: cuenta.id_cuenta });

  } catch (err) {
    console.error('Error login:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor: ' + err.message });
  }
});

export default router;
