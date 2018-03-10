var app = angular.module('app', []);
app.controller('control', function($scope, $http){

	// init
	$scope.init = function(background){
		var page = background.page;
		console.log('initializing popup');
		$scope.message = 'Loading...';
		$scope.fileList = page.fileList.fileList;
		$scope.fsidList = page.fileList.fsidList;
		$scope.page = page.pageno;
		$scope.vcode = page.vcode;
		$scope.background = background;
		$scope.message = 'Ready.';
	};
	$scope.clear = function(){};
	$scope.generate = function(){};
	$scope.generateAll = function(){};
	$scope.copy = function(){};
	$scope.copyAll = function(){};
	$scope.download = function(){};

	$scope.refresh = function(){
		new $scope.background.Error(-20).handle();
	};
	$scope.verify = function(input){
		$scope.background.page.getGlink(true, $scope.vcode, input);
	};
	$scope.init(chrome.extension.getBackgroundPage());
});