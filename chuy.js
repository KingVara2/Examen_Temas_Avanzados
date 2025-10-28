document.addEventListener("DOMContentLoaded", () => {
    const dogGif = document.createElement("img");
    let isMoving = false;
    let timeout;
    let lastX = 0; //Guarda la ultima posicion X del cursor

    
    dogGif.src = "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExZmZkaWI5NnZ0Z2hmempidHBrNWt4cnVqdWUzcGNxZ3lnOWx0bmZmYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/VwnbMsj6y6oOYW2ucT/giphy.gif"; // GIF corriendo
    dogGif.style.position = "absolute";
    dogGif.style.width = "80px";
    dogGif.style.pointerEvents = "none"; // Para que no interfiera con clics
    dogGif.style.transform = "scaleX(1)"; // direccion inicial del perrito
    document.body.appendChild(dogGif);

    // Función para cambiar la imagen cuando el cursor está quieto
    const stopDog = () => {
        dogGif.src = "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWZ0c2poa2JuaGRvcHd5bWlveTlsamVhZHNqbG16enV3NHFuNnB0bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/huIpepwmDZa1jnw7OK/giphy.gif"; // GIF sentado
    };

    // Seguir el cursor
    document.addEventListener("mousemove", (e) => {
        dogGif.style.left = `${e.pageX - 170}px`;
        dogGif.style.top = `${e.pageY - 50}px`;
        
        if (!isMoving) {
            dogGif.src = "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExZmZkaWI5NnZ0Z2hmempidHBrNWt4cnVqdWUzcGNxZ3lnOWx0bmZmYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/VwnbMsj6y6oOYW2ucT/giphy.gif"; // GIF corriendo
            isMoving = true;
        }

        //Aqui voltea al perrito conforme el cursor se vaya moviendo a la derecha o izquierda
        if (e.pageX > lastX) {
            dogGif.style.transform = "scaleX(-1)";//Mira hacia la derecha
        } else if (e.pageX < lastX) {
            dogGif.style.transform = "scaleX(1)";//Mira hacia la izquierda
        }
        lastX = e.pageX;
        
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            isMoving = false;
            stopDog();
        }, 300);
    });
});