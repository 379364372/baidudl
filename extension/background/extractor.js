function Extractor(file)
{
	var self = this;

	self.getHLinks = function(cb){
		self.__getHLinks__(function(hlinks){
			self.__filterHLinks__(hlinks, function(filtered){
				page.fileList.updateHLinks(self.file, filtered);
				updatePopup();
				cb();
			});
		});
	};
	// update server list in config
	self.__updateServers__ = function(hlinks, cb){
		var new_servers = hlinks.map(function(e){
			return new URL(e).host;
		});
		var additional = new_servers.filter(function(item){
			return config.servers.indexOf(item) < 0;
		});
		if(additional.length > 0)console.log(additional);
		config.servers = config.servers.concat(additional);
		chrome.storage.local.set({'config': config});
		cb(config.servers);
	};
	self.__getHLinks__ = function(cb){

		// exploit a race condition bug to get unlimited speed
		var parsed_glink = self.parsed_glink;
		var hlinks = config.servers.map(function(e){
			parsed_glink.host = e;
			parsed_glink.protocol = 'http';
			return parsed_glink.href;
		});
		self.hlinks = hlinks;

		if(!page.bduss){
			self.__anonymous_getHLinks__(cb);
			return;
		}
		else{
			self.__login_getHLinks__(cb);
			return;
		}
	};
	self.__login_getHLinks__ = function(cb){
		var parsed_glink = self.parsed_glink;

		var pathnames = parsed_glink.pathname.split('/');
		var url = 'https://d.pcs.baidu.com/rest/2.0/pcs/file?dstime='+parsed_glink.searchParams.get('dstime')+'&version=2.2.0&vip=1&path='+pathnames[pathnames.length-1]+'&fid='+parsed_glink.searchParams.get('fid')+'&rt=sh&sign='+parsed_glink.searchParams.get('sign')+'&expires=8h&chkv=1&method=locatedownload&app_id=250528&esl=0&ver=4.0';
		$.ajax({
			url: url,
			dataType: 'json',
			success: function(res){
				// error handling
				if(res.error_code && res.error_code != 0){
					new Error(res.error_code).handle();
					return;
				}

				console.log('Get hlink list success');

				// create hlink list and update server list
				var hlinks = res.urls.map(function(e){
					return e.url;
				});
				
				var parsed_hlink = new URL(hlinks[0]);
				self.__updateServers__(hlinks, function(servers){
					var hlinks = servers.map(function(e){
						parsed_hlink.host = e;
						parsed_hlink.protocol = 'http';
						return parsed_hlink.href;
					});
					self.hlinks = self.hlinks.concat(hlinks);
					return cb(self.hlinks);
				});
			},
			error: function(){
				self.__anonymous_getHLinks__(cb);
				return;
			}
		});
	};
	self.__anonymous_getHLinks__ = function(cb){
		$.ajax({
			url: self.file.glink,
			type: 'HEAD',
			timeout: 3000,
			success: function(res, status, request){
				var tmp_hlink = request.getResponseHeader('url');
				var parsed_hlink = new URL(tmp_hlink);
				var hlinks = config.servers.map(function(e){
					parsed_hlink.host = e;
					parsed_hlink.protocol = 'http';
					return parsed_hlink.href;
				});
				self.hlinks = self.hlinks.concat(hlinks);
				cb(self.hlinks);
			}
		});
	};
	self.__filterHLinks__ = function(hlinks, cb){

		// rule out useless hlinks by header testing to exploit a race condition bug(or feature?)
		console.log('filtering hlinks');
		var filtered = [];
		var promises = hlinks.map(function(e, i){
			var promise = $.ajax({
				url: e,
				type: 'HEAD',
				timeout: 3000,
				success: function(res, status, request){
					if(request.getResponseHeader('Content-MD5')){
						filtered[i] = e;
					}
				}
			});
			return promise;
		});
		Q.allSettled(promises).then(function(res){
			filtered = filtered.filter(function(e){
				if(e)return true;
			});
			cb(filtered);
		});
	};

	self.__init__ = function(file){
		self.file = file;
		self.parsed_glink = new URL(file.glink);
	};
	self.__init__(file);
}

// remove cookie when sending requests
chrome.webRequest.onBeforeSendHeaders.addListener(
	function(details){
		var headers = details.requestHeaders;
		var index = -1;
		for(var i=0; i<headers.length; i++){
			if(headers[i].name == 'Cookie'){
				index = i;
				break;
			}
		}
		if(index >= 0){
			headers.splice(index, 1);
		}
		return {'requestHeaders': headers};
	},
	{urls: ["*://pan.baidu.com/api/sharedownload*", "*://pan.baidu.com/api/download*", "*://d.pcs.baidu.com/file/*"]},
	['blocking', 'requestHeaders']
);

// catch error when doing link filtering
chrome.webRequest.onHeadersReceived.addListener(
	function(details){
		if(details.statusCode == 400){
			// drop packet if status code is 400
			return {redirectUrl: 'javascript:'};
		}
		else if(details.statusCode == 302){
			// get redirect url
			var header = details.responseHeaders.filter(function(e){
				if(e.name == 'Location')return e;
			})[0];
			var url = new URL(header.value);

			// drop packet if we know we are going to 401
			if(url.pathname == '/401.html')return {redirectUrl: 'javascript:'};

			// otherwise, we let the packet pass through
			return {'responseHeaders': details.responseHeaders};
		}
		// set url header to indicate the real url
		details.responseHeaders.push({name: 'url', value: details.url});
		return {'responseHeaders': details.responseHeaders};
	},
	{urls: ["*://*.baidupcs.com/file/*", "*://*/*.baidupcs.com/file/*"]},
	['blocking', 'responseHeaders']
);
