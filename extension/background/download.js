// fast call to download a file
function download(file){
	new DownloadManager(file).download();
}

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
		options.split = config.maxThreads+'';
		options.checksum = 'md5='+self.file.md5;
		options['check-integrity'] = 'true';
		options['max-connection-per-server'] = '16';
		options['user-agent'] = navigator.userAgent;
		options['check-certificate'] = 'false';
		options['min-split-size'] = '1m';
		options['summary-interal'] = '0';
		options.out = self.file.name;
		params = [];
		if (config.token && config.token.length > 0) {
			params.push('token:'+config.token);
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
			data: JSON.stringify(jsonreq),
			dataType: 'json',
			success: function(res){
				page.message = 'Added to '+self.rpcInterface+'. The speed is '+hlink.searchParams.get('csl');
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
		if(!config.rpc){
			config.rpc = config.rpcList[0];
		}
		var rpc = config.rpc;
		self.rpcInterface = rpc.protocol+'://'+rpc.host+':'+rpc.port+'/jsonrpc';
		self.file = file;
	};
	self.__init__(file);
}
