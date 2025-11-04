
// Expone una función global para inicializar la vista una vez montado el HTML
window.initVerAlumnos = function initVerAlumnos() {
  const mount = document.getElementById('verAlumnosMount');
  if (!mount) return;

  const idCuenta = localStorage.getItem('id_maestro'); // id_cuenta guardado al login
  const infoMaestro = mount.querySelector('#vaInfoMaestro');
  const grid = mount.querySelector('#vaTablasGrupos');
  const tpl = mount.querySelector('#vaCardTemplate');
  const btnRefresh = mount.querySelector('#vaRefresh');

  async function cargar() {
    try {
      if (!idCuenta) throw new Error('No hay sesión: id_maestro ausente en localStorage');

      const url = `http://localhost:3000/alumnos/by-teacher/${encodeURIComponent(idCuenta)}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} ${res.statusText} - ${text.slice(0,200)}`);
      }

      const data = await res.json();

      if (infoMaestro) {
        if (data.maestro) {
          infoMaestro.textContent = `Maestro: ${cap(data.maestro.nombre)} ${cap(data.maestro.apellidos)}`;
        } else {
          infoMaestro.textContent = 'Maestro sin información o sin grupos asignados.';
        }
      }

      // Asegurar que se muestren A, B y C aunque no tengan alumnos
      const esperados = ['Grupo A', 'Grupo B', 'Grupo C'];
      const grupos = Array.isArray(data.grupos) ? [...data.grupos] : [];
      const existentes = new Set(grupos.map(g => (g.nombre_grupo || '').toLowerCase()));

      esperados.forEach(nombre => {
        if (!existentes.has(nombre.toLowerCase())) {
          grupos.push({
            id_grupo: null,
            nombre_grupo: nombre,
            nombre_materia: null,
            semestre_materia: null,
            alumnos: []
          });
        }
      });

      // Ordenar por A, B, C
      grupos.sort((a, b) => (a.nombre_grupo || '').localeCompare(b.nombre_grupo || ''));

      // Render
      if (grid) grid.innerHTML = '';
      grupos.forEach(g => {
        const node = tpl.content.cloneNode(true);

        node.querySelector('.va-grupo').textContent = g.nombre_grupo || 'Grupo';
        node.querySelector('.va-materia').textContent = g.nombre_materia ? `Materia: ${g.nombre_materia}` : 'Materia: —';
        node.querySelector('.va-semestre').textContent = g.semestre_materia ?? '—';

        const tbody = node.querySelector('.va-tbody');
        const empty = node.querySelector('.va-empty');
        const alumnos = Array.isArray(g.alumnos) ? g.alumnos : [];
        node.querySelector('.va-count').textContent = alumnos.length;

        if (alumnos.length === 0) {
          empty.hidden = false;
        } else {
          empty.hidden = true;
          alumnos.forEach(a => {
            const tr = document.createElement('tr');

            const tdControl = document.createElement('td');
            tdControl.textContent = a.numero_control || '—';

            const tdNombre = document.createElement('td');
            tdNombre.textContent = `${cap(a.nombre)} ${cap(a.apellidos)}`;

            const tdCarrera = document.createElement('td');
            tdCarrera.textContent = a.carrera || '—';

            const tdSem = document.createElement('td');
            tdSem.textContent = a.semestre ?? '—';

            tr.appendChild(tdControl);
            tr.appendChild(tdNombre);
            tr.appendChild(tdCarrera);
            tr.appendChild(tdSem);
            tbody.appendChild(tr);
          });
        }

        grid.appendChild(node);
      });
    } catch (err) {
      console.error('Error cargando alumnos:', err);
      if (window.Swal) {
        Swal.fire('Error', err?.message || 'No se pudieron cargar los alumnos.', 'error');
      } else {
        alert(err?.message || 'No se pudieron cargar los alumnos.');
      }
    }
  }

  function cap(s = '') {
    return s.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  if (btnRefresh) btnRefresh.addEventListener('click', (e) => { e.preventDefault(); cargar(); });

  // Cargar al entrar en la vista
  cargar();
};