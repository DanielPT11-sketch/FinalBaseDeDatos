let listaProductosGlobal = [];
const API_URL = 'http://127.0.0.1:5000/api/v1';

window.onload = function() {
    const usuarioGuardado = localStorage.getItem('usuarioAuraPOS');
    if (!usuarioGuardado) {
        window.location.href = 'login.html';
        return;
    }

    const userObj = JSON.parse(usuarioGuardado);
    document.getElementById('user-info').textContent = userObj.rol;
    document.getElementById('welcome-title').textContent = `¡Bienvenido, ${userObj.nombre_completo}!`;

    if (userObj.rol === 'Administrador') {
        const menuAuditoria = document.getElementById('menu-auditoria');
        if (menuAuditoria) menuAuditoria.style.display = 'block';
    }

    inicializarFormularioCuenta();
    cargarProductos();
    cargarClientesSelector();
    cargarCiudadesSelector();
    cargarClientes();
    cargarCuentas();
    cargarAuditoria();
};

function cambiarVista(vistaId, event) {
    event.preventDefault();
    document.querySelectorAll('.section-view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-menu a').forEach(el => el.classList.remove('active'));

    const target = document.getElementById(`vista-${vistaId}`);
    if (target) target.classList.add('active');

    if (event.currentTarget && event.currentTarget.classList) {
        event.currentTarget.classList.add('active');
    }
}

async function inicializarFormularioCuenta() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('cc-fecha-emision').value = hoy;
    document.getElementById('cc-fecha-vencimiento').value = hoy;

    try {
        const res = await fetch(`${API_URL}/cuentas`);
        const data = await res.json();
        const siguienteNum = data.length + 1;
        const consecutivoStr = `CC-${String(siguienteNum).padStart(3, '0')}`;
        document.getElementById('cc-consecutivo').value = consecutivoStr;
    } catch (e) {
        document.getElementById('cc-consecutivo').value = 'CC-001';
    }
}

async function cargarClientesSelector() {
    try {
        const res = await fetch(`${API_URL}/clientes`);
        const clientes = await res.json();
        const select = document.getElementById('cc-cliente');
        
        select.innerHTML = '<option value="">Seleccione un cliente...</option><option value="nuevo" style="font-weight: bold; color: #2980B9;">+ Crear nuevo cliente...</option>';
        
        clientes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.nombre} (Doc: ${c.documento})`;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error('Error cargando clientes en selector:', e);
    }
}

async function cargarCiudadesSelector() {
    try {
        const res = await fetch(`${API_URL}/ciudades`);
        const ciudades = await res.json();
        const select = document.getElementById('nuevo-cliente-ciudad-select');
        
        select.innerHTML = '<option value="">Seleccione una ciudad...</option><option value="nueva" style="font-weight: bold; color: #2980B9;">+ Registrar nueva ciudad...</option>';
        
        ciudades.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.ciudad} (${c.departamento} - ${c.pais})`;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error('Error cargando ciudades:', e);
    }
}

function verificarCrearCliente(select) {
    const bloque = document.getElementById('bloque-nuevo-cliente');
    if (select.value === 'nuevo') {
        bloque.style.display = 'block';
    } else {
        bloque.style.display = 'none';
    }
}

function verificarCrearCiudad(select) {
    const bloque = document.getElementById('bloque-nueva-ciudad');
    if (select.value === 'nueva') {
        bloque.style.display = 'block';
    } else {
        bloque.style.display = 'none';
    }
}

async function cargarProductos() {
    try {
        const res = await fetch(`${API_URL}/productos`);
        listaProductosGlobal = await res.json();
        
        const select = document.getElementById('cc-producto');
        select.innerHTML = '<option value="">Seleccione un producto...</option>';
        
        listaProductosGlobal.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.dataset.precio = p.precio_venta;
            opt.textContent = `${p.nombre} - $${p.precio_venta} (Stock: ${p.stock_actual})`;
            select.appendChild(opt);
        });

        const tbody = document.getElementById('tabla-productos-dash');
        tbody.innerHTML = listaProductosGlobal.length ? listaProductosGlobal.map(p => `<tr><td>${p.codigo_barras}</td><td>${p.nombre}</td><td>$ ${p.precio_venta}</td><td>${p.stock_actual}</td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;">No hay productos registrados.</td></tr>';
    } catch (e) { console.error('Error cargando productos:', e); }
}

function actualizarPrecioProducto() {
    calcularTotal();
}

function calcularTotal() {
    const selectProd = document.getElementById('cc-producto');
    const cantidad = parseFloat(document.getElementById('cc-cantidad').value) || 0;
    
    if (selectProd.selectedIndex > 0) {
        const precioUnitario = parseFloat(selectProd.options[selectProd.selectedIndex].dataset.precio) || 0;
        const total = precioUnitario * cantidad;
        document.getElementById('cc-monto').value = total.toFixed(2);
    } else {
        document.getElementById('cc-monto').value = '0.00';
    }
}

function cambiarCondicionPago() {
    const condicion = document.getElementById('cc-condicion-pago').value;
    const bloqueContado = document.getElementById('bloque-contado');
    const bloqueCredito = document.getElementById('bloque-credito');
    const hoy = new Date();

    if (condicion === 'contado') {
        bloqueContado.style.display = 'block';
        bloqueCredito.style.display = 'none';
        document.getElementById('cc-fecha-vencimiento').value = hoy.toISOString().split('T')[0];
        document.getElementById('cc-estado').value = 'PAGADO';
    } else {
        bloqueContado.style.display = 'none';
        bloqueCredito.style.display = 'block';
        calcularVencimientoCredito();
        document.getElementById('cc-estado').value = 'PENDIENTE';
    }
}

function calcularVencimientoCredito() {
    const dias = parseInt(document.getElementById('cc-plazo-credito').value) || 15;
    const fechaEmisionStr = document.getElementById('cc-fecha-emision').value;
    const fecha = new Date(fechaEmisionStr);
    
    fecha.setDate(fecha.getDate() + dias);
    document.getElementById('cc-fecha-vencimiento').value = fecha.toISOString().split('T')[0];
}

async function registrarCuentaCobro(event) {
    event.preventDefault();

    const usuarioLogueado = JSON.parse(localStorage.getItem('usuarioAuraPOS'));
    let cliente_id = document.getElementById('cc-cliente').value;

    if (cliente_id === 'nuevo') {
        const nombre = document.getElementById('nuevo-cliente-nombre').value.trim();
        const documento = document.getElementById('nuevo-cliente-doc').value.trim();
        const telefono = document.getElementById('nuevo-cliente-tel').value.trim();
        const direccion = document.getElementById('nuevo-cliente-dir').value.trim();
        
        let ciudad_id = document.getElementById('nuevo-cliente-ciudad-select').value;

        if (!nombre || !documento) {
            alert('Por favor complete los datos obligatorios (Nombre y Documento) del nuevo cliente.');
            return;
        }

        if (ciudad_id === 'nueva') {
            const ciudad = document.getElementById('nc-nombre-ciudad').value.trim();
            const departamento = document.getElementById('nc-departamento').value.trim();
            const pais = document.getElementById('nc-pais').value.trim() || 'Colombia';

            if (!ciudad || !departamento) {
                alert('Por favor complete el nombre de la ciudad y el departamento.');
                return;
            }

            try {
                const resCiudad = await fetch(`${API_URL}/ciudades`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ciudad, departamento, pais })
                });
                const dataCiudad = await resCiudad.json();
                if (resCiudad.ok) {
                    ciudad_id = dataCiudad.id || dataCiudad.ciudad_id;
                } else {
                    alert('Error al registrar la ciudad: ' + (dataCiudad.error || 'Verifique los datos'));
                    return;
                }
            } catch (err) {
                alert('Error de conexión al intentar crear la ciudad.');
                return;
            }
        }

        try {
            const resCliente = await fetch(`${API_URL}/clientes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, documento, telefono, ciudad_id: ciudad_id ? parseInt(ciudad_id) : null, direccion })
            });
            const dataCliente = await resCliente.json();
            if (resCliente.ok) {
                cliente_id = dataCliente.id || dataCliente.cliente_id;
                cargarClientesSelector();
                cargarClientes();
            } else {
                alert('Error al crear el cliente: ' + (dataCliente.error || 'Verifique los datos'));
                return;
            }
        } catch (err) {
            alert('Error de conexión al intentar crear el cliente.');
            return;
        }
    }

    const consecutivo = document.getElementById('cc-consecutivo').value;
    const concepto_id = document.getElementById('cc-producto').value;
    const descripcion = document.getElementById('cc-descripcion').value.trim();
    const monto_total = parseFloat(document.getElementById('cc-monto').value) || 0;
    
    const condicion = document.getElementById('cc-condicion-pago').value;
    const saldo_pendiente = (condicion === 'contado') ? 0.00 : monto_total;
    
    const fecha_emision = document.getElementById('cc-fecha-emision').value;
    const fecha_vencimiento = document.getElementById('cc-fecha-vencimiento').value;
    const estado = document.getElementById('cc-estado').value;
    const creado_por = usuarioLogueado.id || 1;

    const datosCuenta = {
        consecutivo,
        cliente_id: parseInt(cliente_id),
        concepto_id: parseInt(concepto_id),
        descripcion,
        monto_total,
        saldo_pendiente,
        fecha_emision,
        fecha_vencimiento,
        estado,
        creado_por
    };

    try {
        const response = await fetch(`${API_URL}/cuentas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosCuenta)
        });

        const resultado = await response.json();

        if (response.ok) {
            alert('¡Cuenta de cobro registrada exitosamente!');
            document.getElementById('form-cuenta-cobro').reset();
            inicializarFormularioCuenta();
            cargarCuentas();
            cargarAuditoria();
        } else {
            alert('Error al registrar cuenta: ' + (resultado.error || 'Verifique los datos'));
        }
    } catch (error) {
        console.error('Error de red al registrar la cuenta de cobro:', error);
        alert('No se pudo conectar con el servidor.');
    }
}

async function cargarClientes() {
    try {
        const res = await fetch(`${API_URL}/clientes`);
        const data = await res.json();
        const tbody = document.getElementById('tabla-clientes-dash');
        tbody.innerHTML = data.length ? data.map(c => `<tr><td>${c.documento}</td><td>${c.nombre}</td><td>${c.telefono || 'N/A'}</td><td>${c.ciudad_nombre ? `${c.ciudad_nombre} (${c.departamento})` : 'N/A'}</td><td>${c.direccion || 'N/A'}</td></tr>`).join('') : '<tr><td colspan="5" style="text-align:center;">No hay clientes registrados.</td></tr>';
    } catch (e) { console.error('Error cargando clientes:', e); }
}

async function cargarCuentas() {
    try {
        const res = await fetch(`${API_URL}/cuentas`);
        const data = await res.json();
        const tbody = document.getElementById('tabla-cuentas-dash');
        tbody.innerHTML = data.length ? data.map(cc => `<tr><td>${cc.consecutivo}</td><td>${cc.cliente_id}</td><td>$ ${cc.monto_total}</td><td>$ ${cc.saldo_pendiente}</td><td>${cc.estado}</td></tr>`).join('') : '<tr><td colspan="5" style="text-align:center;">No hay cuentas de cobro registradas.</td></tr>';
    } catch (e) { console.error('Error cargando cuentas:', e); }
}

async function cargarAuditoria() {
    try {
        const res = await fetch(`${API_URL}/auditoria`);
        const data = await res.json();
        const tbody = document.getElementById('tabla-auditoria');
        tbody.innerHTML = data.length ? data.map(l => `
            <tr>
                <td>${l.id}</td>
                <td>${l.usuario_id}</td>
                <td><span style="font-weight:bold; color: #2980B9;">${l.accion}</span></td>
                <td>${l.tabla_afectada}</td>
                <td>${l.registro_id}</td>
                <td>${l.ip_origen || 'N/A'}</td>
                <td>${l.creado_en || 'N/A'}</td>
                <td>${l.actualizado_en || 'N/A'}</td>
            </tr>
        `).join('') : '<tr><td colspan="8" style="text-align:center;">No hay registros de auditoría aún.</td></tr>';
    } catch (e) { console.error('Error cargando auditoría:', e); }
}

function cerrarSesion() {
    localStorage.removeItem('usuarioAuraPOS');
    sessionStorage.clear();
    window.location.href = 'login.html';
}