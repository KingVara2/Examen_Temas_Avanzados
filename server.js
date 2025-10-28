const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const sql = require('mssql');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Configuración de conexión usando .env
const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: process.env.DB_TRUSTCERT === 'true',
    port: parseInt(process.env.DB_PORT, 10)
  }
};


// Conectar a SQL Server
sql.connect(dbConfig)
  .then(() => console.log('✅ Conexión a SQL Server exitosa'))
  .catch(err => console.error('❌ Error de conexión:', err));

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor ejecutándose en http://0.0.0.0:${port}`);
});




// Ruta para registrar usuarios desde el formulario
app.post('/registro', async (req, res) => {
    try {
        const { nombre, apellidos, numeroControl, correoElectronico, telefono, numeroBoleto, tallaCamisa } = req.body;

        if (!nombre || !apellidos || !numeroControl || !correoElectronico || !telefono || !numeroBoleto || !tallaCamisa) {
            return res.status(400).send('Todos los campos son obligatorios');
        }

        // Insertar datos en la base de datos
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('NumeroBoleto', sql.Int, numeroBoleto)
            .input('Nombre', sql.VarChar, nombre)
            .input('Apellidos', sql.VarChar, apellidos)
            .input('NumeroControl', sql.Int, numeroControl)
            .input('CorreoElectronico', sql.VarChar, correoElectronico)
            .input('Telefono', sql.Char, telefono)
            .input('TallaCamisa', sql.VarChar, tallaCamisa)
            .input('Pagado', sql.Bit, 0)
            .query(`
                INSERT INTO Usuarios (NumeroBoleto, Nombre, Apellidos, NumeroControl, CorreoElectronico, Telefono, TallaCamisa, Pagado)
                VALUES (@NumeroBoleto, @Nombre, @Apellidos, @NumeroControl, @CorreoElectronico, @Telefono, @TallaCamisa, @Pagado)
            `);

        res.json({ success: true, message: '✅ Usuario registrado correctamente' });
    } catch (err) {
        console.error(' Error al registrar usuario:', err); // Muestra detalles completos del error
        res.status(500).json({ error: 'Error en el servidor', details: err.message });
    }
});


