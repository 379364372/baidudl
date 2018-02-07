/*
Page models
Current implementation will lead to some overhead. But it could be improved by using content scripts.
*/

function SharePage(url)
{
    var self = this;
    self.url = url;
    self.page = 1;

    // get yunData in share page
    self.getYunData = function(cb){
        $.ajax({
            url: self.url.href,
            success: function(html){
                var code = html.match(/yunData\.setData\(.*\)/);
                var data = code[0].substring(16, code[0].length-1);
                var yunData = JSON.parse(data);
                self.yunData = yunData;
                cb();
            }
        });
    };

    // list dir
    self.listDir = function(cb){
        $.ajax({
            url: 'https://pan.baidu.com/share/list?uk='+self.yunData.uk+"&shareid="+self.yunData.shareid+'&dir='+getURLParameter(self.url, 'path')+"&bdstoken="+self.yunData.bdstoken+"&num=100&order=time&desc=1&clienttype=0&showempty=0&web=1&page="+self.page,
            success: function(res){
                console.log("List dir succeeds");
                // if error is encountered
                if(res.errno != 0 ){
                    return;
                }
                // good, we make it
                if(res.list.length == 0){
                    return;
                }
                self.file_list = res.list;
                cb();
            }
        });
    };

    self.getGlink = function(){
        
    };

    // main logic in share page
    self.execute = function(){
        console.log('share page');
        self.getYunData(function(){
            var file_list = self.yunData.file_list.list;

            // handle duplicate redirections
            if((file_list.length > 1 || file_list[0].isdir) && self.url.hash.substr(0, 5) != '#list')return;

            if(self.url.hash.indexOf('list') < 0 || getURLParameter(self.url, 'path') == '%2F'){
                self.file_list = file_list;
                self.getGlink();
            }
            else{
                self.listDir(self.getGlink);
            }
        });
    };
}

function HomePage(url)
{
    this.url = url;
    this.execute = function(){
        console.log('home page');
    };
}

function SearchPage(url)
{
    this.url = url;
    this.execute = function(){
        console.log('search page');
    };
}