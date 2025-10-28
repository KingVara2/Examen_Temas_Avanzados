document.querySelector("form").addEventListener("submit", function(event) {
    event.preventDefault(); // Evita que el formulario se envíe de la manera tradicional

    // Obtener los valores de los campos del formulario
    const nombre = document.querySelector("input[placeholder='Ingresa tu nombre(s)']").value;
    const apellidos = document.querySelector("input[placeholder='Ingresa tus apellidos']").value;
    const numeroControl = document.querySelector("input[name='numeroControl']").value;
    const correoElectronico = document.querySelector("input[placeholder='Ingresa tu correo']").value;
    const telefono = document.querySelector("input[placeholder='Ingresa tu telefono']").value;
    const numeroBoleto = document.querySelector("input[name='numeroBoleto']").value;
    const tallaCamisa = document.querySelector('input[name="camisa"]:checked')?.value;

    // Verificar que todos los campos sean válidos
    if (!nombre || !apellidos || !numeroControl || !correoElectronico || !telefono || !numeroBoleto || !tallaCamisa) {
        alert('Por favor, completa todos los campos.');
        return;
    }

    // Enviar los datos al servidor usando Fetch API
    fetch('http://localhost:3000/registro', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            nombre,
            apellidos,
            numeroControl,
            correoElectronico,
            telefono,
            numeroBoleto,
            tallaCamisa,
            pagado: 0
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);  // Mostrar el mensaje del servidor
        } else {
            alert('Hubo un error en el registro');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error en la comunicación con el servidor');
    });
});