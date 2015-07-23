var exec = require('child_process').execFile;
var request = require('request');
var fs = require('fs');

//constructor + class-vars
var Grabber = function(globalArgs){
	globalArgs = globalArgs || 'flags=1';
	this.settingsFileName = Grabber.settingsFile;
	this.config = {
		'ahk-exe': 'D:\\Program Files\\AutoHotkey\\AutoHotkey.exe',
		'ahk-script': (__dirname + '\\key.ahk'),
		'repeat': Grabber.time*2, //in ms
		'global-args': globalArgs,
		'items-get-url':'http://find-out-yourself/api/items/get?',
		'items-info-url':'http://find-out-yourself/api/items/info?itemId='
	};
	this.initSettingsFile();
	this.run();
}

//statics
Grabber.time = 5000;
Grabber.SEMAPHORE = false;
Grabber.settingsFile = "settings.js";
Grabber.keys=[];
Grabber.checkedComments = [];
//Grabber.debugFile = fs.openSync("debug.txt", "a+");
//Grabber.keyFile = fs.openSync("keys.txt", "a+");

//methods
Grabber.debug = function(args){
	/*
	var str="";
	for(var key in arguments){
		str=str+arguments[key]+" ";
	};
	fs.writeSync(Grabber.debugFile, "\r\n"+str, Grabber.filewriteDebug);
	*/
	console.log.apply(this, arguments);
};

Grabber.filewriteDebug=function(err){
	if(err){
		console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
		console.log("ERROR IN FILE WRITE!!!!", err);
	}
};

Grabber.prototype.readSettingsFile = function(){
	var self = this;
	fs.exists(this.settingsFileName, function(exists){
		if(exists){
			var settings = JSON.parse(fs.readFileSync(self.settingsFileName, 'utf8'));
			if(settings.keys) Grabber.keys = settings.keys;
			if(settings.checkedComments) Grabber.checkedComments = settings.checkedComments;
		}
	});
}
Grabber.prototype.writeSettingsFile = function(){
	var settings = {
		'keys': Grabber.keys,
		'checkedComments': Grabber.checkedComments
	};
	fs.writeFileSync(this.settingsFileName, JSON.stringify(settings), 'utf8');
}

Grabber.prototype.initSettingsFile = function(){
	var self = this;

	this.readSettingsFile();

	var saveSettings = function(code) {
		console.log('XXXX About to exit with code:', code);
		self.writeSettingsFile();
	}
	var saveSettingsExit = function(code) {
		saveSettings(code);
		process.exit();
	}
	process.on('SIGINT', saveSettingsExit); // ctrl+c
	process.on('exit', saveSettingsExit);
	process.on('uncaughtException', saveSettingsExit);
	process.on('SIGBREAK', saveSettings); // ctrl+break
};

Grabber.prototype.adjustTime = function(anzahlOPs){
	var max=15000;
	var min=4000;
	var newTime=this.config['repeat'];

	if(anzahlOPs<1){
		newTime = newTime + 1000;
	}
	if(anzahlOPs>2){
		newTime = newTime - 2000; 
	}
	if(anzahlOPs>4){
		newTime = newTime - 5000; 
	}

	if(newTime>max){
		newTime = max;
	}
	if(newTime<min){
		newTime = min;
	}
	/*
	if(this.config['repeat']!=newTime){
		Grabber.debug("+++adjusted time:", newTime, "got:", anzahlOPs);
	}else{
		Grabber.debug("+++not-adjusted time:", newTime, "got:", anzahlOPs);
	}
	*/
	this.config['repeat']=newTime;
}

Grabber.prototype.execAHK = function(key){
	var self = this;
	/* 
	STOP! SINGLE-RUN-FUNCTION! no multiple runs! its running if Grabber.SEMAPHORE == true
	to avoid multirun, all calls are sheduling themself again in a second and terminate.
	*/
	if(Grabber.SEMAPHORE){
		setTimeout((function(self){
			return function(){
				self.execAHK(key);
			};
		})(this), 1000);
		return;
	};
	Grabber.SEMAPHORE=true;

	var executeFile = this.config['ahk-exe'];
	var executeArgs = [this.config['ahk-script'], key];

	exec(executeFile, executeArgs, function(err, data) {
		Grabber.SEMAPHORE=false;
		if(err)
			Grabber.debug("executeArgs, err, data:", executeArgs, err, data);
	});
};

Grabber.prototype.run = function() {
	var self = this;

	//fs.writeSync(Grabber.keyFile, "\r\n==== neuer Lauf: ====\r\n", Grabber.filewriteDebug);

	Grabber.keys.forEach(function(key){
		//self.execAHK(key);
		Grabber.debug("has key (from com/pic",key.comID,"/",key.picID,"):", key.key);
	});

	this.loop();	
};

Grabber.prototype.loop = function(){
	var self = this;
	request((self.config['items-get-url'])+(self.config['global-args']), function (error, response, body) {
		if (error || response.statusCode != 200) {
			Grabber.debug(error);
			return;
		}

		var pictureIds= [];
		var tested = 0;

		var list=JSON.parse(body);
		Grabber.debug("got "+list.items.length+" OPs ("+self.config['global-args']+")"+" timing: "+self.config['repeat']);
		list.items.forEach(function(listitem){
			pictureIds.push(listitem.id);
		});

		//only get first... items
		var first = 10000;
		pictureIds.forEach(function(pictureId){
			if(first<1){
				return;
			}
			first--;

			request((self.config['items-info-url'])+pictureId, function (error, response, body) {
				if (error || response.statusCode != 200) {
					debug(error);
					return;
				}

				//console.log(body) // Print the body of response.
				var picturedata=JSON.parse(body);
				//Grabber.debug("picturedata", picturedata);
				picturedata.comments.forEach(function(comment){
					//Grabber.debug("got comment", comment.content);
					//Grabber.debugl(".");
					if(Grabber.checkedComments.indexOf(comment.id)<0){
						tested++;
						Grabber.checkedComments.push(comment.id);
						Grabber.debug("  new (comID, PicID):", comment.id, pictureId, comment.content);
						var foundKeys = comment.content.match(/(\s|^)[\w\d]{5}\-[\w\d]{5}\-[\w\d]{5}(?=(\s|$))/g);
						if(foundKeys != null){
							foundKeys.forEach(function(key){
								key = key.match(/[^\s]+/)[0];
								Grabber.keys.push({'key':key, 'picID':pictureId, 'comID':comment.id});
								Grabber.debug("=================================");
								Grabber.debug(key);
								Grabber.debug("=================================");
								//fs.writeSync(Grabber.keyFile, "ComID/PicID: "+comment.id+"/"+pictureId+" | "+key+"\r\n", Grabber.filewriteDebug)
								self.execAHK(key);
							});
						}
					}
				});
			})
		});
		setTimeout((function(self){
			return function(){
				try{
					self.adjustTime(tested);
				}catch(e){};
				setTimeout((function(self){
					return function(){
						self.loop();
					}
				})(self), self.config['repeat']);
			}
		})(self), 500);
	});
};

new Grabber();
setTimeout(function(){new Grabber('flags=1&promoted=1');}, Grabber.time);

