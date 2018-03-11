function download(glink){
    new DownloadManager(glink).download();
}

function DownloadManager(glink)
{
    var self = this;
    self.updateServers = function(hlinks){
        var new_servers = hlinks.map(function(e){
            return new URL(e).host;
        });
        var additional = new_servers.filter(function(item){
            return config.servers.indexOf(item) < 0;
        });
        config.servers = config.servers.concat(additional);
        chrome.storage.local.set({'config': config});
    };
    self.getHLinks = function(cb){
        var parsed_glink = self.parsed_glink;
        if(!page.bduss){
            var hlinks = config.servers.map(function(e){
                parsed_glink.host = e;
                parsed_glink.protocol = 'http';
                return self.parsed_glink.href;
            });
            self.hlinks = hlinks;
            return cb(hlinks);
        }
        var pathnames = parsed_glink.pathname.split('/');
        var url = 'https://d.pcs.baidu.com/rest/2.0/pcs/file?time='+parsed_glink.searchParams.get('time')+'&version=2.2.0&vip=1&path='+pathnames[pathnames.length-1]+'&fid='+parsed_glink.searchParams.get('fid')+'&rt=sh&sign='+parsed_glink.searchParams.get('sign')+'&expires=8h&chkv=1&method=locatedownload&app_id=250528&esl=0&ver=4.0';
        console.log(url);
        $.ajax({
            url: url,
            dataType: 'json',
            success: function(res){
                console.log(res);
                if(res.error_code && res.error_code != 0){
                    new Error(res.error_code).handle();
                    return;
                }
                console.log('Get hlink list success');
                var hlinks = res.urls.map(function(e){
                    return e.url;
                });
                self.hlinks = hlinks;
                self.updateServers(hlinks);
                return cb(hlinks);
            }
        });
    };
    self.download = function(){
        self.getHLinks(self.__download__);
    };
    self.__download__ = function(hlinks){
        // prepare json request
        var hlink = new URL(hlinks[0]);
		options = {};
		options.split = config.maxThreads+'';
		options['max-connection-per-server'] = '16';
		options['user-agent'] = navigator.userAgent;
		options['check-certificate'] = 'false';
		options['min-split-size'] = '1m';
		options['summary-interal'] = '0';
		options.out = hlink.searchParams.get('fin');
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
    self.init = function(glink){
        // get rpc interface
        if(!config.rpc){
            config.rpc = config.rpcList[0];
        }
        var rpc = config.rpc;
        self.rpcInterface = rpc.protocol+'://'+rpc.host+':'+rpc.port+'/jsonrpc';
        self.parsed_glink = new URL(glink);
    };
    self.init(glink);
}