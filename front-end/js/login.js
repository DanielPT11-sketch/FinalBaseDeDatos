async function realizarLogin(event) {
    event.preventDefault();
    
    const correoInput = document.getElementById('correo');
    const passwordInput = document.getElementById('password');
    const errorAlert = document.getElementById('error-alert');

    if (!correoInput || !passwordInput) return;

    const correo = correoInput.value.trim();
    const password = passwordInput.value;

    errorAlert.style.display = 'none';
    errorAlert.textContent = '';

    try {
        const response = await fetch('http://127.0.0.1:5000/api/v1/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('usuarioAuraPOS', JSON.stringify(data.usuario || data));
            window.location.href = 'index.html';
        } else {
            errorAlert.textContent = data.error || data.mensaje || 'Credenciales incorrectas';
            errorAlert.style.display = 'block';
        }
    } catch (error) {
        console.error('Error de red en el login:', error);
        errorAlert.textContent = 'Error de conexión con el servidor.';
        errorAlert.style.display = 'block';
    }
}