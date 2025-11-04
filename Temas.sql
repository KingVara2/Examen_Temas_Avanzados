
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
    ('F02', 'Falta de estudio o dedicaciÛn', 'No repasa, entrega tarde, bajo esfuerzo'),
    ('F03', 'Trabajo o carga laboral', 'Tiene empleo o responsabilidades que reducen tiempo'),
    ('F04', 'Problemas personales o familiares', 'Situaciones personales que afectan el rendimiento'),
    ('F05', 'Dificultad con el docente o la materia', 'No entiende el mÈtodo o el contenido'),
    ('F06', 'Problemas econÛmicos', 'No puede pagar transporte, materiales, etc.'),
    ('F07', 'Falta de interÈs o cambio de carrera', 'DesmotivaciÛn o cambio de vocaciÛn'),
    ('F08', 'Problemas de salud', 'Enfermedades o limitaciones fÌsicas/mentales');





    -- Tabla de maestros
    CREATE TABLE Maestros (
        id_maestro INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL,
        apellidos VARCHAR(50) NOT NULL,
        correo_institucional VARCHAR(100) UNIQUE NOT NULL,
        fecha_registro DATETIME DEFAULT GETDATE()
    );

    -- Tabla de cuentas de maestros
    CREATE TABLE Cuentas_Maestros (
        id_cuenta INT IDENTITY(1,1) PRIMARY KEY,
        id_maestro INT NOT NULL FOREIGN KEY REFERENCES Maestros(id_maestro) ON DELETE CASCADE,
        usuario VARCHAR(50) UNIQUE NOT NULL,
        contrasena_hash NVARCHAR(200) NOT NULL,
        activo BIT DEFAULT 1
    );

    -- Tabla de administraciÛn (opcional)
    CREATE TABLE Administradores (
        id_admin INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL,
        usuario VARCHAR(50) UNIQUE NOT NULL,
        contrasena_hash NVARCHAR(200) NOT NULL,
        activo BIT DEFAULT 1
    );

    -- Tabla de grupos (cada maestro puede tener varios)
    CREATE TABLE Grupos (
        id_grupo INT IDENTITY(1,1) PRIMARY KEY,
        nombre_grupo VARCHAR(50) NOT NULL,
        id_maestro INT NOT NULL,
        id_materia INT NOT NULL,
        FOREIGN KEY (id_maestro) REFERENCES Maestros(id_maestro),
        FOREIGN KEY (id_materia) REFERENCES Materias(id_materia)
    );

    -- RelaciÛn entre estudiante y grupo
    CREATE TABLE Estudiante_Grupo (
        id_relacion INT IDENTITY(1,1) PRIMARY KEY,
        id_estudiante INT NOT NULL,
        id_grupo INT NOT NULL,
        FOREIGN KEY (id_estudiante) REFERENCES Estudiantes(id_estudiante),
        FOREIGN KEY (id_grupo) REFERENCES Grupos(id_grupo)
    );


    ALTER ROLE db_owner ADD MEMBER [Usuario_Temas];

        Use REPOSITORIO
        SELECT * FROM Maestros;
        SELECT * FROM Cuentas_Maestros;
        SELECT * FROM Materias;
        SELECT * FROM Grupos;
        SELECT * FROM Estudiante_Grupo;
        SELECT * FROM Estudiantes;
    -- 2?? Crear las materias con su semestre correspondiente
    INSERT INTO Materias (nombre_materia, semestre)
    VALUES
    ('Matem·ticas Discretas', 1),
    ('Fundamentos de ProgramaciÛn', 1),
    ('C·lculo Diferencial', 1);

    INSERT INTO Grupos (nombre_grupo, id_maestro, id_materia)
    VALUES
    ('Grupo A', 3, 4),  -- Ulises ? Matem·ticas Discretas
    ('Grupo B', 7, 5),  -- AndrÈs ? Fundamentos de ProgramaciÛn
    ('Grupo C', 8, 6);  -- Mel ? C·lculo Diferencial




    SELECT * FROM Materias;
    SELECT * FROM Grupos;
    SELECT * FROM Cuentas_Maestros;

    SELECT g.id_grupo, g.nombre_grupo, m.nombre_materia, ma.nombre AS maestro
    FROM Grupos g
    JOIN Materias m ON g.id_materia = m.id_materia
    JOIN Maestros ma ON g.id_maestro = ma.id_maestro;



    USE REPOSITORIO;

    -- Ver todos los estudiantes con sus grupos y profesores (aunque no tengan grupo)
    SELECT 
        e.id_estudiante,
        e.numero_control,
        e.nombre AS nombre_estudiante,
        e.apellidos AS apellidos_estudiante,
        e.carrera,
        e.semestre AS semestre_estudiante,
        g.nombre_grupo,
        m.nombre_materia,
        m.semestre AS semestre_materia,
        ma.nombre AS nombre_maestro,
        ma.apellidos AS apellidos_maestro
    FROM Estudiantes e
    LEFT JOIN Estudiante_Grupo eg ON e.id_estudiante = eg.id_estudiante
    LEFT JOIN Grupos g ON eg.id_grupo = g.id_grupo
    LEFT JOIN Materias m ON g.id_materia = m.id_materia
    LEFT JOIN Maestros ma ON g.id_maestro = ma.id_maestro
    ORDER BY e.id_estudiante;


    USE REPOSITORIO;

    -- Borrar estudiantes que tienen NULL en grupo
    DELETE FROM Estudiante_Grupo
    WHERE id_grupo IS NULL;



    ALTER TABLE Estudiante_Grupo
    ALTER COLUMN id_grupo INT NOT NULL;


    ALTER TABLE Estudiantes
    ADD CONSTRAINT chk_nombre_apellido
    CHECK (nombre NOT LIKE '%[^a-zA-Z ]%' AND apellidos NOT LIKE '%[^a-zA-Z ]%');


    CREATE TRIGGER trg_estudiantes_lowercase
    ON Estudiantes
    INSTEAD OF INSERT, UPDATE
    AS
    BEGIN
        INSERT INTO Estudiantes (numero_control, nombre, apellidos, carrera, semestre)
        SELECT numero_control,
               LOWER(nombre),
               LOWER(apellidos),
               carrera,
               semestre
        FROM inserted;
    END;

    CREATE TRIGGER trg_limite_factores
    ON Factores_Riesgo
    INSTEAD OF INSERT
    AS
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM Factores_Riesgo fr
            JOIN inserted i ON fr.id_estudiante = i.id_estudiante
            GROUP BY fr.id_estudiante
            HAVING COUNT(*) >= 2
        )
        BEGIN
            RAISERROR('No se puede asignar m·s de 2 factores de riesgo por estudiante', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        INSERT INTO Factores_Riesgo (id_estudiante, codigo_factor)
        SELECT id_estudiante, codigo_factor
        FROM inserted;
    END;


    -- Quitar trigger anterior (ajusta el nombre si difiere)
    IF OBJECT_ID('dbo.trg_estudiantes_lowercase', 'TR') IS NOT NULL
        DROP TRIGGER dbo.trg_estudiantes_lowercase;
    GO

    -- Crear trigger correcto: AFTER INSERT (no INSTEAD OF)
    CREATE TRIGGER dbo.trg_estudiantes_lowercase
    ON dbo.Estudiantes
    AFTER INSERT
    AS
    BEGIN
        SET NOCOUNT ON;

        UPDATE e
        SET nombre = LOWER(e.nombre),
            apellidos = LOWER(e.apellidos)
        FROM dbo.Estudiantes e
        INNER JOIN inserted i
            ON e.id_estudiante = i.id_estudiante;
    END;
    GO


    -- Quitar constraint anterior si existe
    DECLARE @c1 sysname = (SELECT name FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('dbo.Estudiantes') AND name LIKE 'chk_nombre_apellido%');
    IF @c1 IS NOT NULL
        EXEC('ALTER TABLE dbo.Estudiantes DROP CONSTRAINT ' + @c1);
    GO

    -- Permite letras con acentos, espacios, guion y apÛstrofe
    ALTER TABLE dbo.Estudiantes
    ADD CONSTRAINT chk_nombre_apellido
    CHECK (
        nombre NOT LIKE '%[^A-Za-z¡…Õ”⁄‹·ÈÌÛ˙¸—Ò'' -]%' AND
        apellidos NOT LIKE '%[^A-Za-z¡…Õ”⁄‹·ÈÌÛ˙¸—Ò'' -]%'
    );
    GO




    USE REPOSITORIO;

    SELECT e.id_estudiante, e.numero_control, e.nombre, e.apellidos
    FROM dbo.Estudiantes e
    LEFT JOIN dbo.Estudiante_Grupo eg ON eg.id_estudiante = e.id_estudiante
    WHERE eg.id_estudiante IS NULL
    ORDER BY e.id_estudiante;

    USE REPOSITORIO;
    BEGIN TRAN;

    -- Capturar los alumnos huÈrfanos
    DECLARE @Huerfanos TABLE (id_estudiante INT PRIMARY KEY);
    INSERT INTO @Huerfanos (id_estudiante)
    SELECT e.id_estudiante
    FROM dbo.Estudiantes e
    LEFT JOIN dbo.Estudiante_Grupo eg ON eg.id_estudiante = e.id_estudiante
    WHERE eg.id_estudiante IS NULL;

    -- Borrar dependencias (orden recomendado)
    DELETE FROM dbo.Calificaciones
    WHERE id_estudiante IN (SELECT id_estudiante FROM @Huerfanos);

    DELETE FROM dbo.Factores_Riesgo
    WHERE id_estudiante IN (SELECT id_estudiante FROM @Huerfanos);

    DELETE FROM dbo.Estudio_Calificacion
    WHERE id_estudiante IN (SELECT id_estudiante FROM @Huerfanos);

    -- Por seguridad, tambiÈn intentamos limpiar Estudiante_Grupo (aunque no deberÌan tener filas)
    DELETE FROM dbo.Estudiante_Grupo
    WHERE id_estudiante IN (SELECT id_estudiante FROM @Huerfanos);

    -- Finalmente, borrar los estudiantes
    DELETE FROM dbo.Estudiantes
    WHERE id_estudiante IN (SELECT id_estudiante FROM @Huerfanos);

    COMMIT;










    USE REPOSITORIO;
    GO

    DECLARE @ID_CUENTA_ULISES INT = 8; -- <- CAMBIA A TU id_cuenta REAL
    DECLARE @id_maestro INT;

    SELECT @id_maestro = cm.id_maestro
    FROM Cuentas_Maestros cm
    WHERE cm.id_cuenta = @ID_CUENTA_ULISES;

    IF @id_maestro IS NULL
    BEGIN
      RAISERROR('No se encontrÛ id_maestro para esa cuenta.', 16, 1);
      RETURN;
    END

    -- Asegurar materias (crear si no existen)
    IF NOT EXISTS (SELECT 1 FROM Materias WHERE nombre_materia = 'Matem·ticas Discretas')
      INSERT INTO Materias (nombre_materia, semestre) VALUES ('Matem·ticas Discretas', 1);
    IF NOT EXISTS (SELECT 1 FROM Materias WHERE nombre_materia = 'Fundamentos de ProgramaciÛn')
      INSERT INTO Materias (nombre_materia, semestre) VALUES ('Fundamentos de ProgramaciÛn', 1);
    IF NOT EXISTS (SELECT 1 FROM Materias WHERE nombre_materia = 'C·lculo Diferencial')
      INSERT INTO Materias (nombre_materia, semestre) VALUES ('C·lculo Diferencial', 1);

    DECLARE @idMatA INT = (SELECT id_materia FROM Materias WHERE nombre_materia = 'Matem·ticas Discretas');
    DECLARE @idMatB INT = (SELECT id_materia FROM Materias WHERE nombre_materia = 'Fundamentos de ProgramaciÛn');
    DECLARE @idMatC INT = (SELECT id_materia FROM Materias WHERE nombre_materia = 'C·lculo Diferencial');

    -- Crea grupos para Ulises si no existen
    IF NOT EXISTS (SELECT 1 FROM Grupos WHERE id_maestro=@id_maestro AND nombre_grupo='Grupo A')
      INSERT INTO Grupos (nombre_grupo, id_maestro, id_materia) VALUES ('Grupo A', @id_maestro, @idMatA);

    IF NOT EXISTS (SELECT 1 FROM Grupos WHERE id_maestro=@id_maestro AND nombre_grupo='Grupo B')
      INSERT INTO Grupos (nombre_grupo, id_maestro, id_materia) VALUES ('Grupo B', @id_maestro, @idMatB);

    IF NOT EXISTS (SELECT 1 FROM Grupos WHERE id_maestro=@id_maestro AND nombre_grupo='Grupo C')
      INSERT INTO Grupos (nombre_grupo, id_maestro, id_materia) VALUES ('Grupo C', @id_maestro, @idMatC);

    -- Recomendado: evita duplicados por maestro+nombre_grupo
    IF NOT EXISTS (
      SELECT 1 FROM sys.indexes WHERE name = 'UX_Grupos_Maestro_Nombre' AND object_id = OBJECT_ID('dbo.Grupos')
    )
    BEGIN
      CREATE UNIQUE INDEX UX_Grupos_Maestro_Nombre
      ON dbo.Grupos (id_maestro, nombre_grupo);
    END

    -- Visualiza los grupos de Ulises
    SELECT * FROM Grupos WHERE id_maestro = @id_maestro ORDER BY nombre_grupo;
    GO







    USE REPOSITORIO;
    GO

    -- Opcional: Ìndice ˙nico para evitar duplicados por maestro+nombre de grupo
    IF NOT EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE name = 'UX_Grupos_Maestro_Nombre'
        AND object_id = OBJECT_ID('dbo.Grupos')
    )
    BEGIN
      CREATE UNIQUE INDEX UX_Grupos_Maestro_Nombre
      ON dbo.Grupos (id_maestro, nombre_grupo);
    END
    GO

    -- Obtener id_maestro de los usuarios 'Andres' y 'Mel'
    DECLARE @id_maestro_andres INT, @id_maestro_mel INT;

    SELECT @id_maestro_andres = cm.id_maestro
    FROM Cuentas_Maestros cm
    WHERE cm.usuario = 'Andres';

    SELECT @id_maestro_mel = cm.id_maestro
    FROM Cuentas_Maestros cm
    WHERE cm.usuario = 'Mel';

    IF @id_maestro_andres IS NULL
    BEGIN
      RAISERROR('No se encontrÛ id_maestro para el usuario "Andres".', 16, 1);
    END
    IF @id_maestro_mel IS NULL
    BEGIN
      RAISERROR('No se encontrÛ id_maestro para el usuario "Mel".', 16, 1);
    END

    -- IDs de materias (aseg˙rate que existen con esos nombres)
    DECLARE @idMatA INT = (SELECT id_materia FROM Materias WHERE nombre_materia = 'Matem·ticas Discretas');
    DECLARE @idMatB INT = (SELECT id_materia FROM Materias WHERE nombre_materia = 'Fundamentos de ProgramaciÛn');
    DECLARE @idMatC INT = (SELECT id_materia FROM Materias WHERE nombre_materia = 'C·lculo Diferencial');

    IF @idMatA IS NULL OR @idMatB IS NULL OR @idMatC IS NULL
    BEGIN
      RAISERROR('Faltan materias base (A/B/C). Verifica la tabla Materias.', 16, 1);
    END

    -- ========== ANDRES ==========
    IF @id_maestro_andres IS NOT NULL
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM Grupos WHERE id_maestro = @id_maestro_andres AND nombre_grupo = 'Grupo A')
        INSERT INTO Grupos (nombre_grupo, id_maestro, id_materia)
        VALUES ('Grupo A', @id_maestro_andres, @idMatA);

      IF NOT EXISTS (SELECT 1 FROM Grupos WHERE id_maestro = @id_maestro_andres AND nombre_grupo = 'Grupo B')
        INSERT INTO Grupos (nombre_grupo, id_maestro, id_materia)
        VALUES ('Grupo B', @id_maestro_andres, @idMatB);

      IF NOT EXISTS (SELECT 1 FROM Grupos WHERE id_maestro = @id_maestro_andres AND nombre_grupo = 'Grupo C')
        INSERT INTO Grupos (nombre_grupo, id_maestro, id_materia)
        VALUES ('Grupo C', @id_maestro_andres, @idMatC);
    END

    -- ========== MEL ==========
    IF @id_maestro_mel IS NOT NULL
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM Grupos WHERE id_maestro = @id_maestro_mel AND nombre_grupo = 'Grupo A')
        INSERT INTO Grupos (nombre_grupo, id_maestro, id_materia)
        VALUES ('Grupo A', @id_maestro_mel, @idMatA);

      IF NOT EXISTS (SELECT 1 FROM Grupos WHERE id_maestro = @id_maestro_mel AND nombre_grupo = 'Grupo B')
        INSERT INTO Grupos (nombre_grupo, id_maestro, id_materia)
        VALUES ('Grupo B', @id_maestro_mel, @idMatB);

      IF NOT EXISTS (SELECT 1 FROM Grupos WHERE id_maestro = @id_maestro_mel AND nombre_grupo = 'Grupo C')
        INSERT INTO Grupos (nombre_grupo, id_maestro, id_materia)
        VALUES ('Grupo C', @id_maestro_mel, @idMatC);
    END
    GO

    -- Verifica
    SELECT g.id_grupo, g.nombre_grupo, g.id_maestro, m.nombre_materia
    FROM Grupos g
    JOIN Materias m ON m.id_materia = g.id_materia
    WHERE g.id_maestro IN (
      (SELECT id_maestro FROM Cuentas_Maestros WHERE usuario = 'Andres'),
      (SELECT id_maestro FROM Cuentas_Maestros WHERE usuario = 'Mel')
    )
    ORDER BY g.id_maestro, g.nombre_grupo;






    USE REPOSITORIO;

SELECT 
  e.id_estudiante,
  e.numero_control,
  e.nombre,
  e.apellidos,
  m.nombre_materia,
  c.unidad1, c.unidad2, c.unidad3, c.asistencia, c.calificacion_final
FROM Estudiantes e
JOIN Estudiante_Grupo eg ON eg.id_estudiante = e.id_estudiante
JOIN Grupos g           ON g.id_grupo = eg.id_grupo
JOIN Materias m         ON m.id_materia = g.id_materia
LEFT JOIN Calificaciones c ON c.id_estudiante = e.id_estudiante AND c.id_materia = m.id_materia
ORDER BY e.id_estudiante;



SELECT 
  e.numero_control, e.nombre, e.apellidos, m.nombre_materia,
  c.unidad1, c.unidad2, c.unidad3, c.asistencia, c.calificacion_final
FROM Estudiantes e
JOIN Estudiante_Grupo eg ON eg.id_estudiante = e.id_estudiante
JOIN Grupos g           ON g.id_grupo = eg.id_grupo
JOIN Materias m         ON m.id_materia = g.id_materia
JOIN Calificaciones c   ON c.id_estudiante = e.id_estudiante AND c.id_materia = m.id_materia
ORDER BY e.id_estudiante;













USE REPOSITORIO;
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRAN;

-- 1) Construye el conjunto de alumnos a eliminar
DECLARE @TARGETS TABLE (id_estudiante INT PRIMARY KEY);

-- OpciÛn A: usa los id_estudiante (los primeros n˙meros de tu lista)
INSERT INTO @TARGETS (id_estudiante)
SELECT v.id
FROM (VALUES
  (10),(13),(14),(15),(16),(18),(19),(20),(21),(22)
) AS v(id)
WHERE v.id IS NOT NULL;

-- OpciÛn B: (opcional) tambiÈn por numero_control
-- Si quieres basarte en los n˙meros de control, deja esto activo.
INSERT INTO @TARGETS (id_estudiante)
SELECT e.id_estudiante
FROM dbo.Estudiantes e
WHERE e.numero_control IN (
  '21212652','21211952','21212689','21212656','21585965',
  '21212645','31212689','98957558','75957595','70194367'
)
AND NOT EXISTS (SELECT 1 FROM @TARGETS t WHERE t.id_estudiante = e.id_estudiante);

-- VerificaciÛn: lista de alumnos objetivo
SELECT e.id_estudiante, e.numero_control, e.nombre, e.apellidos
FROM @TARGETS t
JOIN dbo.Estudiantes e ON e.id_estudiante = t.id_estudiante
ORDER BY e.id_estudiante;

-- 2) PREVIEW: cu·ntas filas se van a borrar por tabla (no borra a˙n)
SELECT 
  (SELECT COUNT(*) FROM dbo.Calificaciones       c  JOIN @TARGETS t ON t.id_estudiante = c.id_estudiante) AS Calificaciones,
  (SELECT COUNT(*) FROM dbo.Factores_Riesgo     fr JOIN @TARGETS t ON t.id_estudiante = fr.id_estudiante) AS Factores_Riesgo,
  (SELECT COUNT(*) FROM dbo.Estudio_Calificacion es JOIN @TARGETS t ON t.id_estudiante = es.id_estudiante) AS Estudio_Calificacion,
  (SELECT COUNT(*) FROM dbo.Estudiante_Grupo    eg JOIN @TARGETS t ON t.id_estudiante = eg.id_estudiante) AS Estudiante_Grupo,
  (SELECT COUNT(*) FROM dbo.Estudiantes         e  JOIN @TARGETS t ON t.id_estudiante = e.id_estudiante) AS Estudiantes
AS PreviewCounts;

-- 3) BORRADO en orden correcto (dependencias -> maestro)
-- Calificaciones
DELETE c
FROM dbo.Calificaciones c
JOIN @TARGETS t ON t.id_estudiante = c.id_estudiante;

-- Factores de riesgo (tu trigger es INSTEAD OF INSERT, no afecta DELETE)
DELETE fr
FROM dbo.Factores_Riesgo fr
JOIN @TARGETS t ON t.id_estudiante = fr.id_estudiante;

-- Estudio_Calificacion (si la usas)
DELETE es
FROM dbo.Estudio_Calificacion es
JOIN @TARGETS t ON t.id_estudiante = es.id_estudiante;

-- RelaciÛn Estudiante_Grupo
DELETE eg
FROM dbo.Estudiante_Grupo eg
JOIN @TARGETS t ON t.id_estudiante = eg.id_estudiante;

-- Finalmente, Estudiantes
DELETE e
FROM dbo.Estudiantes e
JOIN @TARGETS t ON t.id_estudiante = e.id_estudiante;

COMMIT;

-- 4) ComprobaciÛn final: no debe haber alumnos con esos n˙meros de control
SELECT e.*
FROM dbo.Estudiantes e
WHERE e.numero_control IN (
  '21212652','21211952','21212689','21212656','21585965',
  '21212645','31212689','98957558','75957595','70194367'
);




