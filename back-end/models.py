from datetime import datetime
from config import db

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    nombre_completo = db.Column(db.String(100), nullable=False)
    correo = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    rol = db.Column(db.Enum('Administrador', 'Auxiliar'), nullable=False, default='Auxiliar')
    creado_en = db.Column(db.TIMESTAMP, default=datetime.utcnow)

class Ciudad(db.Model):
    __tablename__ = 'ciudades'
    id = db.Column(db.Integer, primary_key=True)
    ciudad = db.Column(db.String(100), nullable=False)
    departamento = db.Column(db.String(100), nullable=False)
    pais = db.Column(db.String(100), nullable=False, default='Colombia')
    creado_en = db.Column(db.TIMESTAMP, default=datetime.utcnow)

class Cliente(db.Model):
    __tablename__ = 'clientes'
    id = db.Column(db.Integer, primary_key=True)
    documento = db.Column(db.String(50), unique=True, nullable=False)
    nombre = db.Column(db.String(100), nullable=False)
    telefono = db.Column(db.String(30))
    ciudad_id = db.Column(db.Integer, db.ForeignKey('ciudades.id'), nullable=True)
    direccion = db.Column(db.String(255))
    creado_en = db.Column(db.TIMESTAMP, default=datetime.utcnow)

class Producto(db.Model):
    __tablename__ = 'productos'
    id = db.Column(db.Integer, primary_key=True)
    codigo_barras = db.Column(db.String(50), unique=True, nullable=False)
    nombre = db.Column(db.String(150), nullable=False)
    precio_venta = db.Column(db.Numeric(12, 2), nullable=False, default=0.00)
    stock_actual = db.Column(db.Integer, nullable=False, default=0)
    creado_en = db.Column(db.TIMESTAMP, default=datetime.utcnow)

class MetodoPago(db.Model):
    __tablename__ = 'metodos_pago'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), unique=True, nullable=False)

class CuentaCobro(db.Model):
    __tablename__ = 'cuentas_cobro'
    id = db.Column(db.Integer, primary_key=True)
    consecutivo = db.Column(db.String(50), unique=True, nullable=False)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
    concepto_id = db.Column(db.Integer, db.ForeignKey('productos.id'), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    monto_total = db.Column(db.Numeric(12, 2), nullable=False)
    saldo_pendiente = db.Column(db.Numeric(12, 2), nullable=False)
    fecha_emision = db.Column(db.Date, nullable=False)
    fecha_vencimiento = db.Column(db.Date, nullable=False)
    estado = db.Column(db.Enum('PENDIENTE', 'PAGADO'), nullable=False, default='PENDIENTE')
    creado_por = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    creado_en = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    actualizado_en = db.Column(db.TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

class PagoAbono(db.Model):
    __tablename__ = 'pagos_abonos'
    id = db.Column(db.Integer, primary_key=True)
    cuenta_id = db.Column(db.Integer, db.ForeignKey('cuentas_cobro.id'), nullable=False)
    metodo_pago_id = db.Column(db.Integer, db.ForeignKey('metodos_pago.id'), nullable=False)
    monto_abonado = db.Column(db.Numeric(12, 2), nullable=False)
    fecha_pago = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    registrado_por = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)

class Auditoria(db.Model):
    __tablename__ = 'auditoria'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    accion = db.Column(db.String(100), nullable=False)
    tabla_afectada = db.Column(db.String(50), nullable=False)
    registro_id = db.Column(db.Integer, nullable=True)
    ip_origen = db.Column(db.String(45), nullable=True)
    creado_en = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    actualizado_en = db.Column(db.TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)