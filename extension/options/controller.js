var app = angular.module('options', []);
app.controller('control', function($scope, $http){
	$scope.init = function(background){
		$scope.background = background;
		$scope.rpcList = background.config.rpcList;
		$scope.mode = $scope.background.config.mode == 'rpc'? 'on':'off';
		$scope.maxThreads = $scope.background.config.maxThreads;
	};
	$scope.add = function(){
		var rpc = {};
		rpc.protocol = 'http';
		rpc.name = '';
		rpc.port = "6800";
		rpc.host = '';
		rpc.token = null;
		$scope.rpcList.push(rpc);
	};
	$scope.save = function(){
		$scope.background.config.rpcList = $scope.rpcList;
		chrome.storage.local.set({'config': $scope.background.config});
	};
	$scope.reset = function(){
		var config = $scope.background.config;
		config.rpcList = [];
		var tmp = {
			protocol:	'http',
			name	:	'Default',
			token	:	null,
			host	:	'127.0.0.1',
			port	:	"6800"
		};
		config.rpcList.push(tmp);
		config.rpcIdx = 0;
		$scope.background.config = config;
		chrome.storage.local.set({'config': config});
		window.location.reload();
	};
	$scope.modeChange = function(){
		$scope.background.config.mode = $scope.mode == 'on'? 'rpc':'fast';
	};
	$scope.threadsChange = function(){
		if(!$scope.maxThreads)return;
		$scope.background.config.maxThreads = $scope.maxThreads;
	};
	$scope.resetAll = function(){
		$scope.background.resetConfig();
		window.location.reload();
	};

	$scope.init(chrome.extension.getBackgroundPage());
});
