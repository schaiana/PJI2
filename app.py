# -*- coding: latin-1 -*-

from flask import Flask, url_for, jsonify, make_response, abort, request, redirect, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
from flask_httpauth import HTTPBasicAuth
import time
import pika

auth = HTTPBasicAuth()

endereco_rabbitmq = 'localhost'

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pji2.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

#####Inicio definição do banco de dados
def dump_datetime(value):
    """Deserialize datetime object into string form for JSON processing."""
    if value is None:
        return None
    return time.mktime(value.timetuple())


class User(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	username = db.Column(db.String(80), unique=True)
	email = db.Column(db.String(80))
	password = db.Column(db.String(80))
	admin	 = db.Column(db.Boolean, default="False")

	def __init__(self, username, password, email):
		self.username = username
		self.password = password
		self.email = email

class Rota(db.Model):
	id 				= db.Column(db.Integer, primary_key=True) 
	nome			= db.Column(db.String(100))
	caminho			= db.Column(db.String(500))
	fl_habilitada	= db.Column(db.Boolean, default="False")
	horario_hora	= db.Column(db.Integer, nullable=False, default="1")
	horario_minuto	= db.Column(db.Integer, nullable=False, default="1")

	def __init__(self, nome, caminho, fl_habilitada, horario_hora, horario_minuto):
		self.nome 		= nome
		self.caminho 	= caminho
		self.fl_habilitada = fl_habilitada
		self.horario_hora = horario_hora
		self.horario_minuto = horario_minuto
	
	@property
	def serialize(self):
		"""Return object data in easily serializeable format"""
		return {
          	'id'         	: self.id,
			'nome'			: self.nome,
			'caminho'		: self.caminho,
			'fl_habilitada'	: self.fl_habilitada,
			'horario_hora'	: self.horario_hora,
			'horario_minuto': self.horario_minuto
		}
####Fim definição do banco de dados





# Definição da autenticação simples
@auth.get_password
def get_password(username):
	resultado = User.query.filter_by(username=username).first()
	if resultado is not None:
	   return resultado.password
	return None

# Erro quando o usuário não conseguir autenticar
@auth.error_handler
def unauthorized():
	return make_response(jsonify({'erro':'Acesso Negado'}), 403)


# Para apresentar erro 404 HTTP se tentar acessar um recurso que nao existe
@app.errorhandler(404)
def not_found(error):
	return make_response(jsonify({'erro':'Recurso Nao encontrado'}), 404)







####Inicio das definições da API

# Listagem das rotas
#
# curl -u aluno:senha123 -i http://localhost:5000/rotas
#
@app.route('/rotas', methods=['GET'])
@auth.login_required
def obtem_rotas():
	rotas = Rota.query.all()
	return jsonify({'rotas': [i.serialize for i in rotas]})


# Criar rota
#
# curl -u aluno:senha123 -i -H "Content-Type: application/json" -X POST -d'{"nome":"A rota","caminho":"0F,1D","fl_habilitada":"True","horario_hora":"13","horario_minuto":"25"}' http://localhost:5000/rotas
#
@app.route('/rotas', methods=['POST'])
@auth.login_required
def criar_rota():
	if not request.json or not'nome'in request.json:
		abort(400)

	_nome = request.json['nome']
	_caminho = request.json.get('caminho', "")
	_fl_habilitada = request.json.get('fl_habilitada', True)
	_horario_hora = request.json.get('horario_hora', 1)
	_horario_minuto = request.json.get('horario_minuto', 1)

	nova_rota = Rota(nome=_nome, caminho=_caminho, fl_habilitada=_fl_habilitada, horario_hora=_horario_hora, horario_minuto=_horario_minuto)
	db.session.add(nova_rota)
	db.session.commit()

	return jsonify({'rota': nova_rota.serialize}), 201

# Informações de uma rota em específico
#
# curl -u aluno:senha123 -i http://localhost:5000/rotas/1
#
@app.route('/rotas/<int:idRota>', methods=['GET'])
@auth.login_required
def detalhe_rota(idRota):
	resultado = Rota.query.filter_by(id=idRota).first()
	if resultado is None:
		abort(404)
	return jsonify({'rota': resultado.serialize})

# Como invocar na linha de comando
#
# curl -u aluno:senha123 -i -X DELETE http://localhost:5000/rotas/2
#
@app.route('/rotas/<int:idRota>', methods=['DELETE'])
@auth.login_required
def excluir_rota(idRota):
	resultado = Rota.query.filter_by(id=idRota).first()
	if resultado is None:
		abort(404)
	db.session.delete(resultado)
	db.session.commit()
	return jsonify({'resultado': True})

# Atualiza informação da rota
#
# curl -u aluno:senha123 -i -H "Content-Type: application/json" -X PUT -d'{"nome":"Novo Nome","caminho":"1E,2D","horario_hora":"23","horario_minuto":"25","fl_habilitada":"true"}' http://localhost:5000/rotas/4
#
@app.route('/rotas/<int:idRota>', methods=['PUT'])
@auth.login_required
def atualizar_rota(idRota):
	resultado = Rota.query.filter_by(id=idRota).first()
	if resultado is None:
		abort(404)
	if not request.json:
		abort(400)
	if 'nome'in request.json and type(request.json['nome']) != unicode:
		abort(400)
	if 'caminho'in request.json and type(request.json['caminho']) is not unicode:
		abort(400)

	resultado.nome = request.json.get('nome', resultado.nome)
	resultado.caminho = request.json.get('caminho', resultado.caminho)
	resultado.fl_habilitada = request.json.get('fl_habilitada', resultado.fl_habilitada)
	resultado.horario_hora = request.json.get('horario_hora', resultado.horario_hora)
	resultado.horario_minuto = request.json.get('horario_minuto', resultado.horario_minuto)

	db.session.commit()	

	return jsonify({'rota': resultado.serialize})



# Cadastra usuario
#
# curl -i -H "Content-Type: application/json" -X POST -d'{"nome":"nome_usuario","senha":"senha123","email":"ifsc@ifsc.edu.br"}' http://localhost:5000/novo_usuario
# 
#
@app.route('/novo_usuario', methods=['POST'])
def cadastrar_usuario():
	if not request.json:
		return jsonify({'msg_return': 'Requisição incorreta', 'cod_return':'0'}), 200

	# se o nome de usuário não for informado
	if not'nome' in request.json or request.json['nome']=='':
		return jsonify({'msg_return': 'Nome de usuário não informado', 'cod_return':'0'}), 200
	
	# se o nome de usuário contem espaço em branco
	if ' ' in request.json['nome']:
		return jsonify({'msg_return': 'Nome de usuário não pode conter espaços', 'cod_return':'0'}), 200

	# se o senha de usuário não for informado
	if not'senha'in request.json or request.json['senha']=='':
		return jsonify({'msg_return': 'Senha não informada', 'cod_return':'0'}), 200

	# se o email de usuário não for informado
	if not'email'in request.json or request.json['email']=='':
		return jsonify({'msg_return': 'Email não informado', 'cod_return':'0'}), 200

	_nome = request.json['nome']
	_senha = request.json['senha']
	_email = request.json['email']

	usuario_existe = User.query.filter_by(username=_nome).first()

	# se o usuário já existir retorna erro
	if usuario_existe is not None:
		return jsonify({'msg_return': 'Este nome de usuário já existe', 'cod_return':'0'}), 200

	novo_usuario = User(username=_nome, password=_senha, email=_email)
	db.session.add(novo_usuario)
	db.session.commit()

	return jsonify({'msg_return': 'Usuário cadastrado', 'cod_return':'1'}), 201



# Verifica usuario e senha
#
# curl -u aluno:senha123 -i http://localhost:5000/verifica_usuario_senha
# 
#
@app.route('/verifica_usuario_senha', methods=['GET'])
@auth.login_required
def verifica_usuario_senha():
	return jsonify({'msg_return': 'OK'}), 200



######## INICIO COMANDOS ROBÔ / RABBITMQ ###############3
credentials = pika.PlainCredentials('admin', 'pji2senha')
connection = pika.BlockingConnection(pika.ConnectionParameters(host=endereco_rabbitmq,credentials=credentials))
channel = connection.channel()
channel.queue_declare(queue='comandos_robo')

def envia_comando_robo(comando):
	
	global connection
	global channel	

	#verifica se está conectado ao rabbit, caso contrário conecta	
	if connection.is_closed:
        #reconnect
		connection = pika.BlockingConnection(pika.ConnectionParameters(host=endereco_rabbitmq,credentials=credentials))
		channel = connection.channel()
	
	channel.basic_publish(exchange='',
          routing_key='comandos_robo',
          body=comando,
		  properties=pika.BasicProperties(
			expiration='5000',
	))
	print(" [x] Comando direita enviado'")


# Envia comando robô
#
# curl -u aluno:senha123 -i http://localhost:5000/comando_robo/direita
# 
#
@app.route('/comando_robo/<string:comando>', methods=['GET'])
@auth.login_required
def comando_robo(comando):
	#if comando not in ['direita','esquerda','frente','tras']: 
	if comando not in ['0,1','0,2','0,3','0,4']: #frente=[0,1], tras=[0,2], direita=[0,3], esquerda=[0,4]
		return jsonify({'msg_return': 'Comando desconhecido'}), 200
	
	envia_comando_robo(comando);
	return jsonify({'msg_return': 'Comando enviado'}), 200

if __name__ == '__main__':
	app.debug = True
	db.create_all()
	app.secret_key = "asd654zxc84648DD@$%"
	app.run(host='0.0.0.0')
	
