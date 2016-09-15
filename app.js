var config = require("./config");
var hangoutsBot = require("hangouts-bot");
var http = require("http");
var request = require("request");
var hue = require("node-hue-api");
var bot = new hangoutsBot(config.hangout.user, config.hangout.password);
var hueIp = config.hue.ip;
var hueUserAuthCode = config.hue.authCode;
var hueApiUrl = 'http://'+hueIp+"/api/"+hueUserAuthCode;
var respuesta = '';
var msgTo = false;
var Hue = function(){
	this.send = (command,callback, data)=>{
		console.log("sending command");
		var method = 'GET';
		if(data) method = 'PUT'
		var options = {
			url: hueApiUrl+"/"+command,
			body: JSON.stringify(data),
			method: method
		};		
		console.log(options);
		request(options, (error, response, body)=>{
			callback(body);
		});		
	}

}
var displayBridges = function(bridge) {
    console.log("Hue Bridges Found: " + JSON.stringify(bridge));
};

// --------------------------
// Using a promise
hue.nupnpSearch().then(displayBridges).done();

// --------------------------
// Using a callback
hue.nupnpSearch(function(err, result) {
    if (err) throw err;
    displayBridges(result);
});
bot.on('online', function() {
    console.log('online');
});

bot.on('message', function(from, message) {
    respuesta = '';
    msgTo = from;
    var comandos = message.split(" ");
    console.log(comandos)
    var comando = comandos[0];
    if(comando == 'estado'){
    	estado();
    }
    if(comando == 'ayuda'){
    	commandos();
    }
    if(comando == 'encender'){
    	estadoLuz(comandos[1], true);
    }
    if(comando == 'apagar'){
    	estadoLuz(comandos[1], false);
    }
});
var commandos = ()=>{
	bot.sendMessage(msgTo, 'Comandos disponibles:');
	bot.sendMessage(msgTo, 'estado: devuelve el estado de cada bombilla');
}
var estado = ()=>{
	var command = 'lights';
	console.log('estado');
	hue.send(command,(data)=>{
		var jsonData = JSON.parse(data);
		console.log(jsonData);
		for(lightId in jsonData){
			var lightData = jsonData[lightId];
			if(lightData.state.reachable === true){
				var estado = lightData.state.on?'Encendido':'Apagado';
				respuesta= "Bombilla '"+lightData.name+"' está "+estado;			
				console.log(lightData.name, estado);
				bot.sendMessage(msgTo, respuesta);
			}
			
		}
		
	});	
}
var estadoLuz = (bombilla, estado)=>{
	var command = 'lights';
	var Ids = [];
	hue.send(command,(data)=>{
		var jsonData = JSON.parse(data);
		console.log(jsonData);
		for(lightId in jsonData){
			var lightData = jsonData[lightId];
			if(lightData.state.reachable === true){
				if(lightData.name == bombilla){
					cambiaEstado(lightId, estado);
				}
			}
			
		}
		
	});	
}
var cambiaEstado = (lightId, state)=>{
	var command = 'lights/'+lightId+'/state';
	var data = {"on":state};
	hue.send(command, (data)=>{
		console.log(data);
	}, data);
}
//estado();