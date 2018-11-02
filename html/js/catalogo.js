//var endereco_base = 'http://pji2eng.sj.ifsc.edu.br:5000';
var endereco_base = 'http://localhost:5000';

//Salvar uma rota via REST
function salvar(rota) {
    $.ajax({
        // Local onde está o recurso desejado
        url: endereco_base+'/rotas',
        // Method utilizado
        type: 'POST',
		// dados para autenticação
		beforeSend: function (xhr) {
			xhr.setRequestHeader ("Authorization", localStorage.info_autenticacao);
		},
        //O dado é do tipo JSON
        dataType: 'json',
        contentType: 'application/json',
        //Permite acesso a crossdomain
        crossDomain: true,
        //O objeto que será transmitido em formato string
        data: JSON.stringify(rota),
        // Se inseriu com sucesso 
        success: function () {
            alert('Rota cadastrada com sucesso');
            $('#id-nome').val("");
            $('#id-caminho').val("");
            $.mobile.navigate("rotas.html");
        }
    });
};

//ALterar uma rota via REST
function alterar(rota) {
    $.ajax({
        // Local onde está o recurso desejado
        url: endereco_base+'/rotas/' + idRota,
        // Method utilizado
        type: 'PUT',
		// dados para autenticação
		beforeSend: function (xhr) {
			xhr.setRequestHeader ("Authorization", localStorage.info_autenticacao);
		},
        //O dado é do tipo JSON
        dataType: 'json',
        contentType: 'application/json',
        //Permite acesso a crossdomain
        crossDomain: true,
        //O objeto que será transmitido em formato string
        data: JSON.stringify(rota),
        // Se inseriu com sucesso 
        success: function () {
            alert('Rota alterada com sucesso');
            $('#id-nome').val("");
            $('#id-caminho').val("");
            $.mobile.navigate("rotas.html");
        },
        
        error: function () {
                alert('Id não existe');
        }
    });
};

//Apagar uma rota via REST
function apagar() {
    $.ajax({
        // Local onde está o recurso desejado
        url: endereco_base+'/rotas/' + idRota,
        // Method utilizado
        type: 'DELETE',
		// dados para autenticação
		beforeSend: function (xhr) {
			xhr.setRequestHeader ("Authorization", localStorage.info_autenticacao);
		},
        //O dado é do tipo JSON
        dataType: 'json',
        //Permite acesso a crossdomain
        crossDomain: true,
        success: function () {
                alert('Rota apagada com sucesso');
                $.mobile.navigate("rotas.html");
        },
        
        error: function () {
                alert('Id não existe');
         }
    });
};

//Cadastra usuario via REST
function cadastrar_usuario(novo_cadastro) {
    $.ajax({
        // Local onde está o recurso desejado
        url: endereco_base+'/novo_usuario',
        // Method utilizado
        type: 'POST',
        //O dado é do tipo JSON
        dataType: 'json',
        contentType: 'application/json',
        //Permite acesso a crossdomain
        crossDomain: true,
        //O objeto que será transmitido em formato string
        data: JSON.stringify(novo_cadastro),
        // Se inseriu com sucesso 
        success: function (data) {
			// data.cod_return 0 = erro no cadastro, 1 = cadsatro realizdo 
			alert(data.msg_return);
			if(data.cod_return==1){
		        $('#id-nome').val("");
		        $('#id-email').val("");
				$('#id-senha').val("");
			}
        },
        error: function () {
                alert('Erro ao cadastrar usuário');
         }
    });
};

//verifica se a autenticação está correta
function verifica_autenticacao(callback){
	$.ajax({
        url: endereco_base+'/verifica_usuario_senha',
        dataType: 'json',
        type: 'GET',
		// dados para autenticação
		beforeSend: function (xhr) {
			xhr.setRequestHeader ("Authorization", localStorage.info_autenticacao);
		},
        crossDomain: true,
        success: function (data) {
        	callback({'codigo': '0', 'msg':''});    
        },
		error: function(xhr, ajaxOptions, thrownError){

			if(xhr.status == 403){
				resposta = JSON.parse(xhr.responseText);
				callback({'codigo': '1', 'msg': 'Usuário/senha incorreto!'});
			} else {
				callback({'codigo': '2', 'msg':'Erro de conexão com o webservice'});
			}
		}
    });
}

function set_usuario_senha(usuario, senha){
	localStorage.setItem("info_autenticacao", "Basic " + btoa(usuario+":"+senha));
}

function logoff(){
	localStorage.removeItem("info_autenticacao");
	$.mobile.navigate("index.html");
}

function enviar_comando_robo(comando){
	$('#id-log-comandos').append('Enviando: ' + comando + '&#13;&#10;');
	$.ajax({
        url: endereco_base+'/comando_robo/'+comando,
        dataType: 'json',
        type: 'GET',
		// dados para autenticação
		beforeSend: function (xhr) {
			xhr.setRequestHeader ("Authorization", localStorage.info_autenticacao);
		},
        crossDomain: true,
        success: function (data) {
            $('#id-log-comandos').append(data.msg_return+'&#13;&#10;&#13;&#10;');
			document.getElementById("id-log-comandos").scrollTop = document.getElementById("id-log-comandos").scrollHeight;
        },
		error: function(xhr, ajaxOptions, thrownError){
			var erro = 'Erro ao enviar comando '+thrownError;
			$('#id-log-comandos').append(erro+'&#13;&#10;&#13;&#10;');
			document.getElementById("id-log-comandos").scrollTop = document.getElementById("id-log-comandos").scrollHeight;
		}
    });
	document.getElementById("id-log-comandos").scrollTop = document.getElementById("id-log-comandos").scrollHeight;
}

// index.html
$(document).on('pageshow', '#id-home', function () {
	//verifica se tem suporte ao webstorage
	if(typeof(Storage) !== "undefined") {

		//verifica se tem informação de autenticação no webstorage
        if (localStorage.info_autenticacao) { // se tiver informação de autenticação
			// verifica se a autenticação está correta via API
            verifica_autenticacao(function(resposta){

				if(resposta.codigo==0){ // se a autenticação está correta, redireciona para a página rotas.html
					$.mobile.navigate("rotas.html");
				} else { // se a autenticação está incorreta ou erro de conexão
					//alert(resposta.msg);
				}
			});
        }
    } else { // se não tiver suporte ao webstorage
        alert('Este navegador não suporta Webstorage');
    }   
});

// login.html
$(document).on('pageshow', '#id-login', function () {
	// Pressinou botão incluir
    $('#id-logar').click(function () {
        
        var usuario = $('#id-usuario').val();
        var senha = $('#id-senha').val();

		set_usuario_senha(usuario, senha);		

		verifica_autenticacao(function(resposta){
			if(resposta.codigo==0){
				$.mobile.navigate("rotas.html");
			} else {
				alert(resposta.msg);
			}
		});
    });   
});

// rotas.html
$(document).on('pageshow', '#id-rotas', function () {
	$('#id-logoff').click(function () {
        logoff();
    });

    // Lê a lista de livros via REST
    $.ajax({
        url: endereco_base+'/rotas',
        dataType: 'json',
        type: 'GET',
		// dados para autenticação
		beforeSend: function (xhr) {
			xhr.setRequestHeader ("Authorization", localStorage.info_autenticacao);
		},
        crossDomain: true,
        success: function (data) {
            // Limpa a lista de rotas
            $('#id-lista-rotas').empty();
            var content;
            // Carrega novamente a lista de rotas com base no retorno
            $.each(data.rotas, function (i, rota) {
                content = '<tr>\n\
                                <td>' + rota.id + '</td>\n\
                                <td><a class="ui-link-inherited" href="editar.html?id=' + rota.id + '">' + rota.nome + '</a></td>\n\
                                <td>' + rota.caminho + '</td>\n\
                                <td>' + rota.horario_hora + '</td>\n\
                                <td>' + rota.horario_minuto + '</td>\n\
				<td>' + rota.fl_habilitada + '</td>\n\
			</tr>';
                $('#id-lista-rotas').append(content);
            });

        },
		error: function(xhr, ajaxOptions, thrownError){

			if(xhr.status == 403){
				resposta = JSON.parse(xhr.responseText);
				alert(resposta.erro);
			} else {
				alert(thrownError);
			}
		}
    });

	$(document).keydown(function( event ) {
	  if ( event.keyCode == 37 ) {
		 $('#bt-esquerda').click();
	  } else if ( event.keyCode == 38 ) {
		 $('#bt-frente').click();
	  } else if ( event.keyCode == 39 ) {
		 $('#bt-direita').click();
	  } else if ( event.keyCode == 40 ) {
		 $('#bt-tras').click();
	  }
	}); 
	
	$('#bt-esquerda').click(function(){
		//enviar_comando_robo('esquerda');
		enviar_comando_robo('0,4');
	}); 

	$('#bt-direita').click(function(){
		//enviar_comando_robo('direita');
		enviar_comando_robo('0,3');
	});

	$('#bt-frente').click(function(){
		//enviar_comando_robo('frente');
		enviar_comando_robo('0,1');
	});

	$('#bt-tras').click(function(){
		//enviar_comando_robo('tras');
		enviar_comando_robo('0,2');
	});
});

// novo.html
$(document).on('pageshow', '#id-novo', function () {
    // Pressinou botão incluir
    $('#id-incluir').click(function () {

		var fl_habilitada = false;

		if(document.getElementById('id-fl-habilitada').checked) fl_habilitada = true;

        // Converte os dados para um objeto JSON
        var rota = {
            nome: $('#id-nome').val(),
            caminho: $('#id-caminho').val(),
			horario_hora: $('#id-hora').val(),
			horario_minuto: $('#id-minuto').val(),
			fl_habilitada: fl_habilitada
        };
        salvar(rota);
    });
});

// editar.html
$(document).on('pageshow', '#id-editar', function () {
    // Recupere a rota via REST
    idRota = getUrlParameter('id');
    $.ajax({
        // Local onde está o recurso desejado
        url: endereco_base+'/rotas/' + idRota,
        // Method utilizado
        type: 'GET',
		// dados para autenticação
		beforeSend: function (xhr) {
			xhr.setRequestHeader ("Authorization", localStorage.info_autenticacao);
		},
        //O dado é do tipo JSON
        dataType: 'json',
        //Permite acesso a crossdomain
        crossDomain: true,
        // Recuperando com sucesso, atualiza os values dos inputs
        success: function (data) {
            $('#id-nome').val(data.rota.nome);
            $('#id-caminho').val(data.rota.caminho);
            $('#id-rota').val(data.rota.id);
			$('#id-hora').val(data.rota.horario_hora);
			$('#id-minuto').val(data.rota.horario_minuto);

			if(data.rota.fl_habilitada==true){
				$('#id-fl-habilitada').prop('checked', true).checkboxradio('refresh');
			}
			else {
				$('#id-fl-habilitada').prop('checked', false).checkboxradio('refresh');
			}
        }
    })

    //Evento ao cliclar no botão Alterar
    $('#id-alterar').click(function () {
        //Complete o evento para salvar as alterações
        idRota = $('#id-rota').val();
		
		var fl_habilitada = false;

		if(document.getElementById('id-fl-habilitada').checked) fl_habilitada = true;

        // Converte os dados para um objeto JSON
        var rota = {
            nome: $('#id-nome').val(),
            caminho: $('#id-caminho').val(),
			horario_hora: $('#id-hora').val(),
			horario_minuto: $('#id-minuto').val(),
			fl_habilitada: fl_habilitada
        };
        alterar(rota);        

    });
    
    //Evento ao cliclar no botão Apagar
    $('#id-apagar').click(function () {
        apagar();
    });
})

// excluir.html
$(document).on('pageshow', '#id-excluir', function () {
    //Evento ao cliclar no botão Apagar
    $('#id-apagar').click(function () {
       idRota = $('#id-rota').val();
       apagar();
    });
})

// cadastro.html
$(document).on('pageshow', '#id-novo-cadastro', function () {
    // Pressinou botão incluir
    $('#id-cadastrar').click(function () {
        // Converte os dados para um objeto JSON
        var novo_cadastro = {
            nome: $('#id-nome').val(),
            senha: $('#id-senha').val(),
			email: $('#id-email').val()
        };
        cadastrar_usuario(novo_cadastro);
    });
});

