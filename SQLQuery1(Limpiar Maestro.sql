-- 🧹 LIMPIAR MAESTROS Y SUS DATOS RELACIONADOS
USE REPOSITORIO;
SET NOCOUNT ON;
SET XACT_ABORT ON;

-- 🔧 Si existe la tabla temporal, elimínala antes de crearla
IF OBJECT_ID('tempdb..#Maestros') IS NOT NULL
    DROP TABLE #Maestros;

-- 🔹 IDs de los maestros a eliminar
CREATE TABLE #Maestros (id_maestro INT PRIMARY KEY);
INSERT INTO #Maestros VALUES (5);
-- Ejemplo: (1), (2), (3)

BEGIN TRAN;

-- 🧩 1️⃣ Eliminar relaciones de estudiantes con grupos del maestro
DELETE eg
FROM Estudiante_Grupo eg
JOIN Grupos g ON eg.id_grupo = g.id_grupo
JOIN #Maestros m ON g.id_maestro = m.id_maestro;

-- 🧩 2️⃣ Eliminar los grupos del maestro
DELETE g
FROM Grupos g
JOIN #Maestros m ON g.id_maestro = m.id_maestro;

-- 🧩 3️⃣ Eliminar calificaciones de los alumnos que estaban en sus grupos
DELETE c
FROM Calificaciones c
WHERE c.id_estudiante IN (
    SELECT eg.id_estudiante
    FROM Estudiante_Grupo eg
    JOIN Grupos g ON eg.id_grupo = g.id_grupo
    JOIN #Maestros m ON g.id_maestro = m.id_maestro
);

-- 🧩 4️⃣ Eliminar cuenta(s) del maestro
DELETE cm
FROM Cuentas_Maestros cm
JOIN #Maestros m ON cm.id_maestro = m.id_maestro;

-- 🧩 5️⃣ Finalmente, eliminar el registro del maestro
DELETE ma
FROM Maestros ma
JOIN #Maestros m ON ma.id_maestro = m.id_maestro;

COMMIT;

DROP TABLE #Maestros;

PRINT '✅ Maestros y registros relacionados eliminados correctamente.';

