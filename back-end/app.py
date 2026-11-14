from datetime import datetime
from flask import Flask, request, jsonify
from config import configurar_db, db
from models import (
    Usuario,
    Ciudad,
    Cliente,
    Producto,
    MetodoPago,
    CuentaCobro,
    PagoAbono,
    Auditoria,
)

app = Flask(__name__)
configurar_db(app)

# --- ENDPOINTS / RUTAS DE LA API ---

@app.route('/api/v1/login', methods=['POST'])
def login():
    data = request.get_json()
    correo = data.get('correo')
    password = data.get('password')

    usuario = Usuario.query.filter_by(correo=correo, password=password).first()
    if usuario:
        return jsonify({
            "mensaje": "Login exitoso",
            "usuario": {
                "id": usuario.id,
                "nombre_completo": usuario.nombre_completo,
                "correo": usuario.correo,
                "rol": usuario.rol
            }
        }), 200
    else:
        return jsonify({"error": "Credenciales incorrectas"}), 401

@app.route('/api/v1/usuarios', methods=['GET', 'POST'])
def gestionar_usuarios():
    if request.method == 'GET':
        usuarios = Usuario.query.all()
        return jsonify([{
            "id": u.id,
            "nombre_completo": u.nombre_completo,
            "correo": u.correo,
            "rol": u.rol
        } for u in usuarios]), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        try:
            nuevo_usuario = Usuario(
                nombre_completo=data.get('nombre_completo'),
                correo=data.get('correo'),
                password=data.get('password'),
                rol=data.get('rol', 'Auxiliar')
            )
            db.session.add(nuevo_usuario)
            db.session.commit()
            return jsonify({"mensaje": "Usuario creado exitosamente", "id": nuevo_usuario.id}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400

@app.route('/api/v1/ciudades', methods=['GET', 'POST'])
def gestionar_ciudades():
    if request.method == 'GET':
        ciudades = Ciudad.query.all()
        return jsonify([{
            "id": c.id,
            "ciudad": c.ciudad,
            "departamento": c.departamento,
            "pais": c.pais
        } for c in ciudades]), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        nueva_ciudad = Ciudad(
            ciudad=data.get('ciudad'),
            departamento=data.get('departamento'),
            pais=data.get('pais', 'Colombia')
        )
        db.session.add(nueva_ciudad)
        db.session.commit()
        return jsonify({"mensaje": "Ciudad creada exitosamente", "id": nueva_ciudad.id}), 201

@app.route('/api/v1/clientes', methods=['GET', 'POST'])
def gestionar_clientes():
    if request.method == 'GET':
        clientes = Cliente.query.all()
        resultado = []
        for c in clientes:
            ciudad_obj = Ciudad.query.get(c.ciudad_id) if c.ciudad_id else None
            resultado.append({
                "id": c.id,
                "documento": c.documento,
                "nombre": c.nombre,
                "telefono": c.telefono,
                "direccion": c.direccion,
                "ciudad_nombre": ciudad_obj.ciudad if ciudad_obj else None,
                "departamento": ciudad_obj.departamento if ciudad_obj else None
            })
        return jsonify(resultado), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        nuevo_cliente = Cliente(
            documento=data.get('documento'),
            nombre=data.get('nombre'),
            telefono=data.get('telefono'),
            ciudad_id=data.get('ciudad_id'),
            direccion=data.get('direccion')
        )
        db.session.add(nuevo_cliente)
        db.session.commit()
        return jsonify({"mensaje": "Cliente creado exitosamente", "id": nuevo_cliente.id}), 201

@app.route('/api/v1/productos', methods=['GET', 'POST'])
def obtener_productos():
    if request.method == 'GET':
        productos = Producto.query.all()
        return jsonify([{
            "id": p.id,
            "codigo_barras": p.codigo_barras,
            "nombre": p.nombre,
            "precio_venta": float(p.precio_venta),
            "stock_actual": p.stock_actual
        } for p in productos]), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        try:
            nuevo_producto = Producto(
                codigo_barras=data.get('codigo_barras'),
                nombre=data.get('nombre'),
                precio_venta=data.get('precio_venta'),
                stock_actual=data.get('stock_actual', 0)
            )
            db.session.add(nuevo_producto)
            db.session.commit()
            return jsonify({"mensaje": "Producto creado exitosamente", "id": nuevo_producto.id}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400

@app.route('/api/v1/cuentas', methods=['GET', 'POST'])
def gestionar_cuentas():
    if request.method == 'GET':
        cuentas = CuentaCobro.query.all()
        return jsonify([{
            "id": cc.id,
            "consecutivo": cc.consecutivo,
            "cliente_id": cc.cliente_id,
            "concepto_id": cc.concepto_id,
            "descripcion": cc.descripcion,
            "monto_total": float(cc.monto_total),
            "saldo_pendiente": float(cc.saldo_pendiente),
            "fecha_emision": cc.fecha_emision.strftime('%Y-%m-%d'),
            "fecha_vencimiento": cc.fecha_vencimiento.strftime('%Y-%m-%d'),
            "estado": cc.estado
        } for cc in cuentas]), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        try:
            nueva_cuenta = CuentaCobro(
                consecutivo=data.get('consecutivo'),
                cliente_id=data.get('cliente_id'),
                concepto_id=data.get('concepto_id'),
                descripcion=data.get('descripcion'),
                monto_total=data.get('monto_total'),
                saldo_pendiente=data.get('saldo_pendiente'),
                fecha_emision=datetime.strptime(data.get('fecha_emision'), '%Y-%m-%d').date(),
                fecha_vencimiento=datetime.strptime(data.get('fecha_vencimiento'), '%Y-%m-%d').date(),
                estado=data.get('estado', 'PENDIENTE'),
                creado_por=data.get('creado_por')
            )
            db.session.add(nueva_cuenta)
            db.session.commit()

            ip_cliente = request.remote_addr
            nueva_auditoria = Auditoria(
                usuario_id=data.get('creado_por'),
                accion='CREAR_CUENTA_COBRO',
                tabla_afectada='cuentas_cobro',
                registro_id=nueva_cuenta.id,
                ip_origen=ip_cliente
            )
            db.session.add(nueva_auditoria)
            db.session.commit()

            return jsonify({"mensaje": "Cuenta de cobro registrada exitosamente", "id": nueva_cuenta.id}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400

@app.route('/api/v1/auditoria', methods=['GET'])
def obtener_auditoria():
    registros = Auditoria.query.all()
    return jsonify([{
        "id": r.id,
        "usuario_id": r.usuario_id,
        "accion": r.accion,
        "tabla_afectada": r.tabla_afectada,
        "registro_id": r.registro_id,
        "ip_origen": r.ip_origen,
        "creado_en": r.creado_en.strftime('%Y-%m-%d %H:%M:%S') if r.creado_en else None,
        "actualizado_en": r.actualizado_en.strftime('%Y-%m-%d %H:%M:%S') if r.actualizado_en else None
    } for r in registros]), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)