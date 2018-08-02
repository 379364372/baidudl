function DownloadManager(file)
{
	var self = this;

	self.download = function(){
		if(!self.file.hlinks){
			page.message = 'Warning: HLinks should be obtained before download!';
			updatePopup();
			return;
		}
		self.__download__(self.file.hlinks);
	};
	self.__download__ = function(hlinks){
		// prepare json request
		var hlink = new URL(hlinks[0]);
		options = {};
		if(config.maxThreads < 16*hlinks.length)options.split = config.maxThreads+'';
		else options.split = 16*hlinks.length+'';
		if(self.file.md5){
			options.checksum = 'md5='+self.file.md5;
			options['check-integrity'] = 'true';
		}
		options['max-connection-per-server'] = '16';
		options['user-agent'] = navigator.userAgent;
		options['check-certificate'] = 'false';
		options['min-split-size'] = '1m';
		if(self.file.size <= 1024*1024*10){
			options['lowest-speed-limit'] = '15k';
		}
		options['async-dns'] = 'false';
		options['summary-interal'] = '0';
		options.out = self.file.name;
		params = [];
		if (config.rpcList[config.rpcIdx].token && config.rpcList[config.rpcIdx].token.length > 0) {
			params.push('token:'+config.rpcList[config.rpcIdx].token);
		}
		params.push(hlinks);
		params.push(options);
		jsonreq = {};
		jsonreq.jsonrpc = '2.0';
		jsonreq.id = hlink.searchParams.get('fin');
		jsonreq.method = 'aria2.addUri';
		jsonreq.params = params;

		// prepare rpc interface
		var rpc = config.rpc;

		// send request to rpc server
		$.ajax({
			url: self.rpcInterface,
			type: 'POST',
			timeout: 2000,
			data: JSON.stringify(jsonreq),
			dataType: 'json',
			success: function(res){
				page.message = '"'+self.file.name+'"'+' is added to '+self.rpcInterface+'. The speed is '+hlink.searchParams.get('csl');
				updatePopup();
			},
			error: function(){
				page.message = 'Error: Cannot send requests to RPC server. Please make sure baidu-dl_rpc or aria2 is running.';
				updatePopup();
			}
		});
	};
	self.__init__ = function(file){
		// get rpc interface
		var rpc = config.rpcList[config.rpcIdx];
		self.rpcInterface = rpc.protocol+'://'+rpc.host+':'+rpc.port+'/jsonrpc';
		self.file = file;
	};
	self.__init__(file);
}
