document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formRegistro');
  const selGrupo = document.getElementById('grupo');

  async function cargarGrupos() {
    try {
      const idCuenta = localStorage.getItem('id_maestro');
      if (!idCuenta) return;

      const res = await fetch(`http://localhost:3000/alumnos/grupos-by-teacher/${encodeURIComponent(idCuenta)}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'No se pudieron obtener los grupos');

      // Limpiar y poblar
      selGrupo.innerHTML = `<option value="" selected disabled>Selecciona un grupo</option>`;
      data.grupos.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id_grupo; // este es el que se manda al backend
        opt.textContent = `${g.nombre_grupo} · ${g.nombre_materia}`;
        selGrupo.appendChild(opt);
      });
    } catch (e) {
      console.error('Error cargando grupos:', e);
      if (window.Swal) Swal.fire('Error', 'No se pudieron cargar los grupos del maestro.', 'error');
    }
  }

  // Cargar grupos al abrir la vista de registro
  cargarGrupos();

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      let numero_control = document.querySelector("#numeroControl").value.trim();
      let nombre = document.querySelector("#nombre").value.trim();
      let apellidos = document.querySelector("#apellidos").value.trim();
      const carrera = document.querySelector("#carrera").value;
      const semestre = parseInt(document.querySelector("#semestre").value, 10);

      const unidad1 = parseFloat(document.querySelector("#materia1").value || 0);
      const unidad2 = parseFloat(document.querySelector("#materia2").value || 0);
      const unidad3 = parseFloat(document.querySelector("#materia3").value || 0);
      const asistencia = parseFloat(document.querySelector("#materia4").value || 100);

      const factores = Array.from(document.querySelectorAll("input[name='factores[]']:checked")).map(f => f.value);
      const idGrupo = parseInt(document.querySelector("#grupo").value, 10);
      const idCuenta = parseInt(localStorage.getItem('id_maestro'), 10);

      // Validaciones rápidas omitidas por brevedad...

      try {
        const res = await fetch("http://localhost:3000/alumnos/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            numeroControl: numero_control,
            nombre,
            apellidos,
            carrera,
            semestre,
            materia1: unidad1,
            materia2: unidad2,
            materia3: unidad3,
            materia4: asistencia,
            factores,
            idGrupo,
            idCuenta // <--- enviar id_cuenta
          })
        });

        const data = await res.json();

        await Swal.fire({
          icon: data.success ? 'success' : 'error',
          title: data.success ? 'Éxito' : 'Error',
          text: data.message
        });

        if (data.success) {
          form.reset();
          // Restablece defaults si quieres
          document.querySelector("#materia1").value = "";
          document.querySelector("#materia2").value = "";
          document.querySelector("#materia3").value = "";
          document.querySelector("#materia4").value = "";
          document.querySelector("#grupo").selectedIndex = 0;
        }
      } catch (error) {
        console.error("Error al enviar:", error);
        Swal.fire({ icon: 'error', title: 'Error', text: "Error de conexión con el servidor" });
      }
    });
  }
});