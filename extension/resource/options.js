$(function(){
    var config =(function(){
        return {
            init:function(){
                var self =this;
                var rpc_list=JSON.parse(localStorage.getItem("rpc_list")||'[{"name":"Aria2","url":"http://localhost:6800/jsonrpc"}]');
                for(var i in rpc_list){
                    var row='<div class="control-group rpc_details"><label class="control-label">JSON-RPC</label><div class="controls"><input type="text" class="input-small rpc-name" value="'+rpc_list[i]['name']+'" placeholder="RPC Name"><input type="text" class="input-xlarge rpc-path" value="'+rpc_list[i]['url']+'" placeholder="RPC Path"></div></div>';
                    if($(".rpc_details").length>0){
                        $(row).insertAfter($(".rpc_details").eq(i-1));
                    }else{
                        $(row).insertAfter($("fieldset legend"));
                    }
                }

                $("#add-rpc").on("click",function(){
                    var rpc_form='<div class="control-group rpc_details">'+
                        '<label class="control-label">JSON-RPC</label>'+
                        '<div class="controls">'+
                          '<input type="text" class="input-small rpc-name"  placeholder="RPC Name">'+
                          '<input type="text" class="input-xlarge rpc-path"  placeholder="RPC Path"></div></div>';
                    $("#rpc-list").append(rpc_form);
                });
                $("#save").on("click",function(){
                    self.save();
                });
                $("#reset").on("click",function(){
                    localStorage.clear();
                    location.reload();
                });
            },
            save:function(){
                var rpc_list=[];
                for(var i=0;i<$(".rpc_details").length;i++){
                    var child=$(".rpc_details").eq(i).children().eq(1).children();
                    if(child.eq(0).val()!= ""&&child.eq(1).val()!= ""){
                        rpc_list.push({"name":child.eq(0).val(),"url":child.eq(1).val()});
                    }
                }
                localStorage.setItem("rpc_list", JSON.stringify(rpc_list));
            }
        };
    })();  
    config.init();
});

