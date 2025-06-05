const API_URL = 'https://miargpanel.vercel.app/api';

async function mostrarCantidadGenerada() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const stats = await response.json();
        document.getElementById('valorGenerado').textContent = stats.total || 0;
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        document.getElementById('mensaje').textContent = 'Error al cargar estadísticas';
        document.getElementById('mensaje').className = 'error';
    }
}

async function activarUsuario() {
    const mail = document.getElementById('mail').value;
    const selectedVersion = document.getElementById('version').value;
    const mensajeElement = document.getElementById('mensaje');
    
    try {
        const response = await fetch(`${API_URL}/activate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: mail,
                type: selectedVersion
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            mensajeElement.textContent = data.message;
            mensajeElement.className = '';
            await mostrarCantidadGenerada();
        } else {
            mensajeElement.textContent = data.error;
            mensajeElement.className = 'error';
        }
    } catch (error) {
        console.error('Error al activar usuario:', error);
        mensajeElement.textContent = 'Error al activar usuario';
        mensajeElement.className = 'error';
    }
}

// Inicializar al cargar la página
window.onload = mostrarCantidadGenerada;