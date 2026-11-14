import os
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()

def configurar_db(app):
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:D1017270892p.@127.0.0.1:3307/aurapos_db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    CORS(app)