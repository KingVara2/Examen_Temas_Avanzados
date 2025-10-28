 // Validación del formulario
    document.querySelector("form").addEventListener("submit", function(event) {
        event.preventDefault(); // Evita la recarga de la página

        // Obtener los valores de los campos
        var nombre = document.querySelector("input[placeholder='Ingresa tu nombre(s)']").value;
        var apellidos = document.querySelector("input[placeholder='Ingresa tus apellidos']").value;
        var numeroControl = document.querySelector("input[name='numeroControl']").value;
        var correoElectronico = document.querySelector("input[placeholder='Ingresa tu correo']").value;
        var telefono = document.querySelector("input[placeholder='Ingresa tu telefono']").value;
        var numeroBoleto = document.querySelector("input[name='numeroBoleto']").value;
        var tallaCamisa = document.querySelector('input[name="camisa"]:checked');

        // Validar el nombre y los apellidos (solo letras y espacios)
        if (!/^[a-zA-Z\s]+$/.test(nombre) || !/^[a-zA-Z\s]+$/.test(apellidos)) {
            alert("El nombre y los apellidos solo deben contener letras.");
            return;
        }

        // Validar el número de control (debe estar entre 10000000 y 99999999)
        if (numeroControl < 10000000 || numeroControl > 99999999) {
            alert("El número de control debe estar entre 10000000 y 99999999.");
            return;
        }

        // Validar el correo electrónico con una expresión regular básica
        var correoRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        if (!correoRegex.test(correoElectronico)) {
            alert("El correo electrónico no es válido.");
            return;
        }

        // Validar el teléfono (debe tener exactamente 10 dígitos numéricos)
        var telefonoRegex = /^[0-9]{10}$/;
        if (!telefonoRegex.test(telefono)) {
            alert("El teléfono debe contener exactamente 10 dígitos.");
            return;
        }

        // Validar el número de boleto (solo números y no vacío)
        if (isNaN(numeroBoleto) || numeroBoleto === "") {
            alert("El número de boleto debe ser un número válido.");
            return;
        }

        // Validar que se haya seleccionado una talla de camisa
        if (!tallaCamisa) {
            alert("Por favor, selecciona una talla de camisa.");
            return;
        }

        // Si todos los campos son válidos, el formulario se envía
        alert("Formulario enviado correctamente.");
        // Aquí puedes descomentar la siguiente línea para enviar el formulario si todo es válido
         this.submit();
    });