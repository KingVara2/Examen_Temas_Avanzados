document.addEventListener('DOMContentLoaded', () => {
  const LOGIN_PAGE = 'login.html'; // Cambia a tu página de login real (p. ej. 'login.html')

  // 1) Proteger la página: si no hay sesión, mandar al login
  const isLoggedIn = !!localStorage.getItem('id_maestro');
  if (!isLoggedIn) {
    sessionStorage.clear();
    window.location.replace(LOGIN_PAGE); // replace evita volver con "atrás"
    return;
  }

  // 2) Cerrar sesión al hacer click en el botón
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      // Confirmación opcional con SweetAlert2 si lo usas
      if (window.Swal) {
        const r = await Swal.fire({
          title: '¿Cerrar sesión?',
          text: 'Se cerrará tu sesión actual.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, cerrar',
          cancelButtonText: 'Cancelar'
        });
        if (!r.isConfirmed) return;
      }

      // Limpiar datos de autenticación
      localStorage.removeItem('id_maestro');
      localStorage.removeItem('token'); // por si después agregas JWT
      sessionStorage.clear();

      // Redirigir al login
      window.location.replace(LOGIN_PAGE);
    });
  }
});