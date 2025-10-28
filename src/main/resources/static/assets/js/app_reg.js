document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');
    const qrContainer = document.getElementById('qrContainer');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.innerHTML = '<div class="spinner"></div><p>Procesando registro...</p>';
    form.appendChild(loadingDiv);

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Obtener datos del formulario
        const alumno = {
            nombre: document.getElementById('nombre').value,
            materia: document.getElementById('materia').value,
            correo: document.getElementById('correo').value,
            grupo: document.getElementById('grupo').value,
            boleta: document.getElementById('boleta').value
        };

        // Mostrar loading
        loadingDiv.style.display = 'block';
        messageDiv.style.display = 'none';
        qrContainer.style.display = 'none';

        try {
            const response = await fetch('/api/registrar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(alumno)
            });

            const result = await response.json();

            if (response.ok) {
                showMessage(result.mensaje, 'success');
                qrContainer.style.display = 'block';
                form.reset();
            } else {
                showMessage(result.error, 'error');
            }
        } catch (error) {
            showMessage('Error de conexión: ' + error.message, 'error');
        } finally {
            loadingDiv.style.display = 'none';
        }
    });

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
    }
});