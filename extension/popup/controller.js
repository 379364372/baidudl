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
				$scope.page = page;
				$scope.vcode = page.vcode;
				$scope.input = '';
				$scope.background = background;
				$scope.textarea = angular.element(document.getElementById('copy'));
			});
		});
	};

	// TODO: clearcache should simply use refresh()
	$scope.clear = function(){};
	$scope.generate = function(){
		var filtered = $scope.fileList.filter(function(file){
			if(file.check)return true;
		});
		$scope.background.generate(filtered);
		$scope.uncheckAll();
	};
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

	// check all checker boxes
	$scope.checkAll = function(){
		for(i=0; i<$scope.fileList.length; i+=1)$scope.fileList[i].check = true;
	};
	$scope.uncheckAll = function(){
		for(i=0; i<$scope.fileList.length; i+=1)$scope.fileList[i].check = false;
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
		$scope.background.page.getGLinks(function(){}, true, $scope.vcode, input);
		$scope.input = '';
	};
	// check whether this page is a share page
	$scope.pageCheck = function(){
		return !$scope.page || $scope.page instanceof $scope.background.SharePage;
	};

	// start init
	$scope.init(chrome.extension.getBackgroundPage());
});

