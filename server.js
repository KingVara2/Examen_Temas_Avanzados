// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import sql from 'mssql';
import authRoutes from './routes/auth.js'; // aquí estarán tus rutas

dotenv.config();

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de conexión a SQL Server
export const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10), // <- al nivel raíz
  options: {
    encrypt: false,
    trustServerCertificate: process.env.DB_TRUSTCERT === 'true',
  },
};

// Probar conexión
sql.connect(dbConfig)
  .then(() => console.log(' Conexión exitosa a SQL Server'))
  .catch(err => console.error('Error al conectar a SQL Server:', err));

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor y base de datos funcionando correctamente ');
});

// Usar rutas del archivo auth.js
app.use('/auth', authRoutes);

// Usar rutas del archivo Alumnos.js
import alumnosRoutes from './routes/Alumnos.js';
app.use('/alumnos', alumnosRoutes);

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});