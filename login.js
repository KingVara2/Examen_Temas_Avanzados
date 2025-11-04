// login.js

const auth = document.querySelector('.auth');
const goSignup = document.getElementById('goSignup');
const goLogin = document.getElementById('goLogin');

// Cambiar entre Login y Registro
if (goSignup) {
  goSignup.addEventListener('click', (e) => {
    e.preventDefault();
    auth.classList.add('signup');
    document.getElementById('signupForm')?.setAttribute('aria-hidden', 'false');
    document.getElementById('loginForm')?.setAttribute('aria-hidden', 'true');
  });
}

if (goLogin) {
  goLogin.addEventListener('click', (e) => {
    e.preventDefault();
    auth.classList.remove('signup');
    document.getElementById('signupForm')?.setAttribute('aria-hidden', 'true');
    document.getElementById('loginForm')?.setAttribute('aria-hidden', 'false');
  });
}

// ====== Login ======
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('email').value.trim();
    const contrasena = document.getElementById('password').value.trim();

    try {
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, contrasena })
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire({
          title: '¡Bienvenido!',
          text: data.message,
          icon: 'success',
          confirmButtonText: 'Entrar',
          draggable: true
        }).then(() => {
          localStorage.setItem('id_maestro', data.id_cuenta);
          window.location.href = 'Proyecto.html';
        });
      } else {
        Swal.fire({
          title: 'Oops!',
          text: data.message || 'Credenciales inválidas',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          draggable: true
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Error',
        text: 'Error en el servidor',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        draggable: true
      });
    }
  });
}

// ====== Registro ======
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      nombre: document.getElementById('nombre').value.trim(),
      apellidos: document.getElementById('apellidos').value.trim(),
      correo_institucional: document.getElementById('correo').value.trim(),
      usuario: document.getElementById('usuario').value.trim(),
      contrasena: document.getElementById('pass_reg').value.trim(),
    };

    if (!payload.nombre || !payload.apellidos || !payload.correo_institucional || !payload.usuario || !payload.contrasena) {
      Swal.fire({
        title: 'Error',
        text: 'Completa todos los campos.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        draggable: true
      });
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire({
          title: '¡Cuenta creada!',
          text: 'Ahora inicia sesión.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          draggable: true
        }).then(() => {
          auth.classList.remove('signup');
          setTimeout(() => document.getElementById('email')?.focus(), 200);
        });
      } else {
        Swal.fire({
          title: 'Oops!',
          text: data.message || 'No se pudo crear la cuenta',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          draggable: true
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Error',
        text: 'Error en el servidor',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        draggable: true
      });
    }
  });
}
