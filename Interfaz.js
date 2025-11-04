document.addEventListener("DOMContentLoaded", function() {
    const body = document.querySelector("body"),
          sidebar = body.querySelector(".sidebar"),
          toggle = body.querySelector(".toggle"),
          modeSwitch = body.querySelector(".toggle-switch"),
          modeText = body.querySelector(".mode-text");

    // Mostrar la barra lateral cuando el cursor pase sobre ella
    sidebar.addEventListener("mouseenter", () => {
        sidebar.classList.remove("close"); // Abre el menú
    });

    // Ocultar la barra lateral cuando el cursor salga (Descomentarlo si se quiere activar)
    sidebar.addEventListener("mouseleave", () => {
        sidebar.classList.add("close"); // Cierra el menú
    });
    

    // El botón solo cerrará el menú
    toggle.addEventListener("click", () => {
        sidebar.classList.add("close");
    });

    
});
