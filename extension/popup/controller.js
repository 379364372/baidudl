var app = angular.module('popup', []);
app.controller('control', function($scope, $http){

	// init
	$scope.init = function(background){
		var page = background.page;
		console.log('initializing popup');
		chrome.tabs.getSelected(null, function(tab){
			if(!page || !page.url || tab.url != page.url.href){
				background.refresh(new URL(tab.url));
				$scope.init(background);
				return;
			}
			$scope.$apply(function(){
				$scope.message = 'Loading...';
				$scope.fileList = page.fileList.fileList;
				$scope.fsidList = page.fileList.fsidList;
				$scope.page = page.pageno;
				$scope.vcode = page.vcode;
				$scope.input = '';
				$scope.background = background;
				$scope.textarea = angular.element(document.getElementById('copy'));
			});
		});
	};
	$scope.clear = function(){};
	$scope.generate = function(){};
	$scope.generateAll = function(){};
	// copy link to clipboard
	$scope.copy = function(idx, type){
		if(type == 'hlink')$scope.textarea.val($scope.fileList[idx].hlinks[0]);
		else $scope.textarea.val($scope.fileList[idx].glink);
		if(!$scope.textarea.val()){
			$scope.message = "This field is empty";
			return;
		}
		$scope.textarea[0].select();
		if(document.execCommand("copy"))$scope.message = "Copy success";
		else $scope.message = "Copy failure";
		$scope.textarea.val('');
	};
	// copy all links to clipboard
	$scope.copyAll = function(type){
		var links = [];
		for(var i=0; i<$scope.fileList.length; i++){
			if(type == 'glink'){
				if(!$scope.fileList[i].glink)continue;
				links.push($scope.fileList[i].glink);
			}
			else{
				if(!$scope.fileList[i].hlinks)continue;
				links.push($scope.fileList[i].hlinks[0]);
			}
		}
		$scope.textarea.val(links.join('\n'));
		if(!$scope.textarea.val()){
			$scope.message = "No links";
			return;
		}
		$scope.textarea[0].select();
		if(document.execCommand("copy"))$scope.message = "Copy all success";
		else $scope.message = "Copy failure";
		$scope.textarea.val('');
	};
	// download a file through rpc
	$scope.download = function(idx){
		// check glink
		if(!$scope.fileList[idx].hlinks || !$scope.fileList[idx].hlinks.length){
			$scope.message = 'Warning: HLinks should be generated before download!';
			return;
		}
		$scope.background.download($scope.fileList[idx]);
	};
	// refresh vcode
	$scope.refresh = function(){
		new $scope.background.Error(-20).handle();
	};
	// verify and get glinks
	$scope.verify = function(input){
		$scope.background.page.getGLinks(true, $scope.vcode, input);
		$scope.input = '';
	};

	// start init
	$scope.init(chrome.extension.getBackgroundPage());
});