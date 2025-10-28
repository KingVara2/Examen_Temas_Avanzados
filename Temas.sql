
CREATE DATABASE REPOSITORIO
USE REPOSITORIO

CREATE TABLE Estudiantes (
    id_estudiante INT IDENTITY(1,1) PRIMARY KEY,
    numero_control VARCHAR(15) UNIQUE NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    apellidos VARCHAR(50) NOT NULL,
    carrera VARCHAR(100) NOT NULL,
    semestre INT CHECK (semestre BETWEEN 1 AND 12),
);

CREATE TABLE Materias (
    id_materia INT IDENTITY(1,1) PRIMARY KEY,
    nombre_materia VARCHAR(100) NOT NULL,
    semestre INT NOT NULL,
);

CREATE TABLE Calificaciones (
    id_calificacion INT IDENTITY(1,1) PRIMARY KEY,
    id_estudiante INT NOT NULL,
    id_materia INT NOT NULL,
    unidad1 DECIMAL(5,2) CHECK (unidad1 BETWEEN 0 AND 100),
    unidad2 DECIMAL(5,2) CHECK (unidad2 BETWEEN 0 AND 100),
    unidad3 DECIMAL(5,2) CHECK (unidad3 BETWEEN 0 AND 100),
    asistencia DECIMAL(5,2) CHECK (asistencia BETWEEN 0 AND 100),
    calificacion_final AS ((unidad1 + unidad2 + unidad3)/3) PERSISTED,
    FOREIGN KEY (id_estudiante) REFERENCES Estudiantes(id_estudiante),
    FOREIGN KEY (id_materia) REFERENCES Materias(id_materia)
);

CREATE TABLE Estudio_Calificacion (
    id_registro INT IDENTITY(1,1) PRIMARY KEY,
    id_estudiante INT NOT NULL,
    horas_estudio_semana DECIMAL(5,2) CHECK (horas_estudio_semana >= 0),
    calificacion_final DECIMAL(5,2) CHECK (calificacion_final BETWEEN 0 AND 100),
    FOREIGN KEY (id_estudiante) REFERENCES Estudiantes(id_estudiante)
);

CREATE TABLE Catalogo_Factores (
    codigo_factor CHAR(3) PRIMARY KEY,
    nombre_factor VARCHAR(100) NOT NULL,
    descripcion NVARCHAR(200) NOT NULL
);

CREATE TABLE Factores_Riesgo (
    id_factor INT IDENTITY(1,1) PRIMARY KEY,
    id_estudiante INT NOT NULL,
    codigo_factor CHAR(3) NOT NULL,
    FOREIGN KEY (id_estudiante) REFERENCES Estudiantes(id_estudiante),
    FOREIGN KEY (codigo_factor) REFERENCES Catalogo_Factores(codigo_factor)
);


-- Insertamos los valores iniciales
INSERT INTO Catalogo_Factores (codigo_factor, nombre_factor, descripcion) VALUES
('F01', 'Falta de asistencia', 'Ausencias constantes, inasistencias prolongadas'),
('F02', 'Falta de estudio o dedicación', 'No repasa, entrega tarde, bajo esfuerzo'),
('F03', 'Trabajo o carga laboral', 'Tiene empleo o responsabilidades que reducen tiempo'),
('F04', 'Problemas personales o familiares', 'Situaciones personales que afectan el rendimiento'),
('F05', 'Dificultad con el docente o la materia', 'No entiende el método o el contenido'),
('F06', 'Problemas económicos', 'No puede pagar transporte, materiales, etc.'),
('F07', 'Falta de interés o cambio de carrera', 'Desmotivación o cambio de vocación'),
('F08', 'Problemas de salud', 'Enfermedades o limitaciones físicas/mentales');


