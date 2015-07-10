var exec = require('child_process').execFile;
var request = require('request');
var debug = console.log;
var checkedComments = [];
var SEMAPHORE = false;

var Grabber = function(globalArgs){
	globalArgs = globalArgs || 'flags=1';
	this.keys=[];
	this.config = {
		'ahk-exe': 'D:\\Program Files\\AutoHotkey\\AutoHotkey.exe',
		'ahk-script': (__dirname + '\\key.ahk'),
		'repeat': 20000, //in ms
		'global-args': globalArgs,
		'items-get-url':'find-out-yourself/api/items/get?',
		'items-info-url':'find-out-yourself/api/items/info?itemId='
	};
	this.run();
}

Grabber.prototype.execAHK = function(key){
	/* 
	STOP! SINGLE-RUN-FUNCTION! no multiple runs! its running if SEMAPHORE == true
	to avoid multirun, all calls are sheduling themself again in a second and terminate.
	*/
	if(SEMAPHORE){
		setTimeout((function(self){
			return function(){
				self.execAHK(key);
			};
		})(this), 1000);
		return;
	};
	SEMAPHORE=true;

	var executeFile = this.config['ahk-exe'];
	var executeArgs = [this.config['ahk-script'], key];

	exec(executeFile, executeArgs, function(err, data) {
		SEMAPHORE=false;
		if(err)
			debug("executeArgs, err, data:", executeArgs, err, data);
	});
};

Grabber.prototype.run = function() {
	var that = this;
	this.keys.forEach(function(key){
		that.execAHK(key);
	});
	this.loop();	
	setInterval((function(self){
		return function(){
			self.loop();
		}
	})(this), this.config['repeat']);
};

Grabber.prototype.loop = function(){
	var that = this;
	request((that.config['items-get-url'])+(that.config['global-args']), function (error, response, body) {
		if (error || response.statusCode != 200) {
			debug(error);
			return;
		}

		var pictureIds= [];
		var tested = 0;

		var list=JSON.parse(body);
		debug("got "+list.items.length+" OPs ("+that.config['global-args']+")");
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

			request((that.config['items-info-url'])+pictureId, function (error, response, body) {
				tested++;
				if (error || response.statusCode != 200) {
					debug(error);
					return;
				}

				//console.log(body) // Print the body of response.
				var picturedata=JSON.parse(body);
				//debug("picturedata", picturedata);
				picturedata.comments.forEach(function(comment){
					//debug("got comment", comment.content);
					//debugl(".");
					if(checkedComments.indexOf(comment.id)<0){
						checkedComments.push(comment.id);
						debug("new (comID, PicID):", comment.id, pictureId, comment.content);
						var foundKeys = comment.content.match(/\s[\w\d]{5}\-[\w\d]{5}\-[\w\d]{5}(?=\s)/);
						if(foundKeys != null){
							foundKeys.forEach(function(key){
								that.keys.push(key);
								debug(key);
								that.execAHK(key);
							});
						}
					}
				});
			})
		});
	})
};

new Grabber();
setTimeout(function(){new Grabber('flags=1&promoted=1');}, 10000);

