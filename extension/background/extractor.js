function Extractor(file)
{
	var self = this;

	self.getHLinks = function(){
		self.__getHLinks__(function(hlinks){
			self.__fast_filterHLinks__(hlinks, function(filtered){
				page.fileList.updateHLinks(self.file, filtered.concat(hlinks));
				updatePopup();
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

		console.log('Try to fetch hlinks');
		self.hlinks = [];

		// get hlinks according to account status
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
		console.log('Try to get hlinks when logged in');
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
					self.hlinks = hlinks.concat(self.hlinks);
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
		console.log('Try to anonymously get hlinks');
		$.ajax({
			url: self.file.glink,
			type: 'HEAD',
			timeout: 3000,
			tryCount: 0,
			retryLimit: 5,
			success: function(res, status, request){
				console.log('Catch glink successfully');
				var tmp_hlink = request.getResponseHeader('url');
				var parsed_hlink = new URL(tmp_hlink);
				var hlinks = config.servers.map(function(e){
					parsed_hlink.host = e;
					parsed_hlink.protocol = 'http';
					return parsed_hlink.href;
				});
				self.hlinks = hlinks.concat(self.hlinks);
				cb(self.hlinks);
			},
			error: function(xhr, status, error){
				console.log(xhr);
				console.log(status);
				console.log(error);
				if(xhr.status == 400 || xhr.status == 0){
					this.tryCount += 1;
					if(this.tryCount <= this.retryLimit){
						console.log('retry...');
						console.log('try count is: ' + this.tryCount);
						$.ajax(this);
						return;
					}
					return;
				}
			}
		});
	};
	self.__filterHLinks__ = function(hlinks, cb){
		// rule out useless hlinks by header testing
		console.log('filtering hlinks');
		if(config.mode == 'rpc')self.__all_filterHLinks__(hlinks, cb);
		else self.__fast_filterHLinks__(hlinks, cb);
	};

	self.__fast_filterHLinks__ = function(hlinks, cb){
		console.log('look for the first successful hlink');

		// init filtering
		var filtered = [];
		var promises = hlinks.map(function(e, i){
			var func = function(){
				var promise = $.ajax({
					url: e,
					type: 'HEAD',
					timeout: 3000,
					success: function(res, status, request){
						filtered[i] = e;

						// if md5 exists in response, update md5
						var md5 = request.getResponseHeader('Content-MD5');
						if(md5){
							page.fileList.updateMD5(self.file, md5);
						}
					}
				});
				return promise;
			};
			return func;
		});

		// find the first successful hlink
		var result = Q();
		var flag = 0;
		promises.forEach(function(func){
			result = result.then(func).fail(function(){}).then(function(){
				if(filtered.length && !flag){
					var hlinks = filtered.filter(function(e){
						if(e)return true;
					});
					cb(hlinks);
					flag = 1;
				}
				if(filtered.length){
					throw new Error();
				}
			});
		});
	};

	self.__all_filterHLinks__ = function(hlinks, cb){
		console.log('filter hlinks for rpc download');

		// init filtering
		var filtered = [];
		var promises = hlinks.map(function(e, i){
			var promise = $.ajax({
				url: e,
				type: 'HEAD',
				timeout: 3000,
				success: function(res, status, request){
					var md5 = request.getResponseHeader('Content-MD5');
					if(md5){
						filtered[i] = e;
						page.fileList.updateMD5(self.file, md5);
					}
				}
			});
			return promise;
		});

		// start filtering
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
		var bad_codes = [400, 403, 406, 503];
		if(bad_codes.indexOf(details.statusCode) >= 0){
			// drop packet if status code is bad
			return {redirectUrl: 'javascript:'};
		}
		else if(details.statusCode == 302){
			// get redirect url
			var header = details.responseHeaders.filter(function(e){
				if(e.name == 'Location')return e;
			})[0];
			var url = new URL(header.value);

			// drop packet if we know we are going to 401 or 403
			if(url.pathname == '/401.html')return {redirectUrl: 'javascript:'};
			if(url.pathname == '/403.html')return {redirectUrl: 'javascript:'};

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

chrome.webRequest.onBeforeSendHeaders.addListener(
	function(details){
		var headers = details.requestHeaders;
		var index = -1;
		for(var i=0; i<headers.length; i++){
			if(headers[i].name == 'User-Agent'){
				index = i;
				headers[index].value = 'netdisk;2.2.0;macbaiduyunguanjia';
				break;
			}
		}
		return {'requestHeaders': headers};
	},
	{urls: ['*://d.pcs.baidu.com/rest/2.0/pcs/file?*']},
	['blocking', 'requestHeaders']
);