import default_skin from "./webix-uploader.scss";
var webix = require("./webix-button");


webix.UploadDriver = {
    flash: {
        $render: function(render_config) {

            if (!window.swfobject)
                webix.require("legacy/swfobject.js", true); // sync loading

            var config = this._settings;
            config.swfId = (config.swfId||"webix_swf_"+webix.uid());

            this._getBox().innerHTML += "<div class='webix_upload_flash'><div id='"+config.swfId+"'></div></div>";
            this._upload_area = this._getBox().lastChild;

            // add swf object
            swfobject.embedSWF(webix.codebase+"/legacy/uploader.swf", config.swfId, "100%", "100%", "9", null, {
                    uploaderId: config.id,
                    ID: config.swfId,
                    enableLogs:(config.enableLogs?"1":""),
                    paramName:(config.inputName),
                    multiple:(config.multiple?"Y":"")
            }, {wmode:"transparent"});

            var v = swfobject.getFlashPlayerVersion();

            webix.event(this._viewobj, "click", webix.bind(function() {
                var now_date = new Date();
                if (now_date - (this._upload_timer_click||0)  > 250){
                    this.fileDialog();
                }
            }, this));

            this.files.attachEvent("onBeforeDelete", webix.bind(this._stop_file,this));
        },
        $applyFlash: function(name,params){
            return this[name].apply(this,params);
        },
        getSwfObject: function(){
            return swfobject.getObjectById(this._settings.swfId);
        },
        fileDialog:function(){
            if(this.getSwfObject())
                this.getSwfObject().showDialog();
        },
        send: function(id){
            if (typeof id == "function"){
                this._last_assigned_upload_callback = id;
                id = 0;
            }

            if (!id){
                var order = this.files.data.order;
                var complete = true;
                if (order.length)
                    for (var i=0; i<order.length; i++){
                        complete = this.send(order[i])&&complete;
                    }

                if (complete)
                    this._upload_complete();

                return;
            }
            var item = this.files.getItem(id);
            if (item.status !== 'client')
                return false;
            item.status = 'transfer';

            if(this.getSwfObject()){
                this.getSwfObject().upload(id, this._settings.upload,this._settings.formData||{});
            }
            return true;

        },
        $beforeAddFileToQueue: function( id, name, size ){

            var type = name.split(".").pop();
            var format = this._format_size(size);
            return this.callEvent("onBeforeFileAdd", [{
                id: id,
                name:name,
                size:size,
                sizetext:format,
                type:type
            }]);
        },
        $addFileToQueue: function(id, name, size){
            if(this.files.exists(id))
                return false;
            if (!this._settings.multiple)
                this.files.clearAll();
            var type = name.split(".").pop();
            var format = this._format_size(size);
            var file_struct = {
                name:name,
                id: id,
                size:size,
                sizetext:format,
                type:type,
                status:"client"
            };
            this.files.add(file_struct);
            this.callEvent("onAfterFileAdd", [file_struct]);

            if (id && this._settings.autosend)
                this.send(id);
        },
        stopUpload: function(id){
            this._stop_file(id);
        },
        _stop_file: function(id) {
            var item = this.files.getItem(id);
            this.getSwfObject().uploadStop(id);
            item.status = "client";
        },
        $onUploadComplete: function(){
            if(this._settings.autosend){
                this._upload_complete();
            }
        },
        $onUploadSuccess: function(id,name,response){
            var item = this.files.getItem(id);
            if(item){
                item.status = "server";
                item.progress = 100;
                if(response.text && (typeof response.text == "string")){


                    webix.DataDriver.json.toObject(response.text);

                    webix.extend(item,response,true);
                }
                this.callEvent("onFileUpload", [item,response]);
                this.callEvent("onChange", []);
                this.files.updateItem(id);
            }
        },
        $onUploadFail: function(id){
            var item = this.files.getItem(id);
            item.status = "error";
            delete item.percent;
            this.files.updateItem(id);
            this.callEvent("onFileUploadError", [item, ""]);
        }
    },
    html5: {
        $render: function(config) {
            if (this._upload_area){
                this._contentobj.appendChild(this._upload_area);
                return;
            }
            this.files.attachEvent("onBeforeDelete", this._stop_file);

            var input_config =  {
                "type": "file",
                "class": "webix_hidden_upload",
                tabindex:-1
            };

            if (this._settings.accept)
                input_config.accept = this._settings.accept;

            if (this._settings.multiple)
                input_config.multiple = "true";

            var f = webix.html.create("input",input_config);
            this._upload_area = this._contentobj.appendChild(f);

            webix.event(this._viewobj, 'drop', webix.bind(function(e) { this._drop(e); webix.html.preventEvent(e); }, this));
            webix.event(f, 'change', webix.bind(function() { 
                this._add_files(f.files); 
                if (webix.env.isIE){
                    var t = document.createElement("form");
                    t.appendChild(this._upload_area);
                    t.reset();
                    this._contentobj.appendChild(f);
                } else 
                    f.value = "";
            }, this));
            webix.event(this._viewobj, "click", webix.bind(function() { 
                var now_date = new Date();
                if (now_date - (this._upload_timer_click||0)  > 250){
                    this.fileDialog();
                }
            }, this));

            webix.event(this._viewobj, 'dragenter', webix.html.preventEvent);
            webix.event(this._viewobj, 'dragexit', webix.html.preventEvent);
            webix.event(this._viewobj, 'dragover', webix.html.preventEvent);
        },

        // adding files by drag-n-drop
        _drop: function(e) {
            var files = e.dataTransfer.files;
            if (this.callEvent('onBeforeFileDrop', [files, e]))
                this._add_files(files);
            this.callEvent("onAfterFileDrop",[files, e]);
        },

        fileDialog:function(context){
            this._upload_timer_click = new Date();
            this._last_file_context = context;
            var inputs = this._viewobj.getElementsByTagName("INPUT");
            inputs[inputs.length-1].click();
        },
        send: function(id, details){
            //alternative syntx send(callback)
            if (typeof id == "function"){
                this._last_assigned_upload_callback = id; 
                id = 0;
            }

            if (!id){
                var order = this.files.data.order;
                var complete = true;
                
                if (order.length)
                    for (var i=0; i<order.length; i++)
                        complete = (!this.send(order[i], details)) && complete;

                if (complete)
                    this._upload_complete();

                return;
            }

            var item = this.files.getItem(id);
            if (item.status !== 'client') return false;

            webix.assert(this._settings.upload, "You need to define upload url for uploader component");
            item.status = 'transfer';

            var formData = new FormData();
            formData.append(this.config.inputName, item.file);

            var headers = {};
                details = details || {};

            var xhr = new XMLHttpRequest();
            if(webix.callEvent("onBeforeAjax",["POST", this._settings.upload, details, xhr, headers, formData])){
                for (var key in details)
                    formData.append(key, details[key]);

                item.xhr = xhr;

                xhr.upload.addEventListener('progress', webix.bind(function(e){ this.$updateProgress(id, e.loaded/e.total*100); }, this), false);
                xhr.onload = webix.bind(function(e){ if (!xhr.aborted) this._file_complete(id); }, this);
                xhr.open('POST', this._settings.upload, true);

                for (var key in headers)
                    xhr.setRequestHeader(key, headers[key]);

                xhr.send(formData);
            }

            this.$updateProgress(id, 0);
            return true;
        },

        _file_complete: function(id) {
            var item = this.files.getItem(id);
            if (item){
                var response = null;
                if(item.xhr.status == 200)
                    response = webix.DataDriver[this._settings.datatype||"json"].toObject(item.xhr.responseText);
                if (!response || response.status == "error"){
                    item.status = "error";
                    delete item.percent;
                    this.files.updateItem(id);
                    this.callEvent("onFileUploadError", [item, response]);
                } else {
                    this._complete(id, response);
                }
                delete item.xhr;
            }
        },
        stopUpload: function(id){
            webix.bind(this._stop_file,this.files)(id);
        },
        _stop_file: function(id) {
            var item = this.getItem(id);
            if (typeof(item.xhr) !== 'undefined'){
                item.xhr.aborted = true;
                item.xhr.abort();
            }
            delete item.xhr;
            item.status = "client";
        }
    }
};

webix.protoUI({
    name:"uploader",
    defaults:{
        autosend:true,
        multiple:true,
        inputName:"upload"
    },
    $cssName:"button",
    _allowsClear:true,

    //will be redefined by upload driver
    send:function(){},
    fileDialog:function(){},
    stopUpload:function(){},

    $init:function(config){
        var driver = webix.UploadDriver.html5;
        this.files = new webix.DataCollection();

        // browser doesn't support XMLHttpRequest2
        if (webix.isUndefined(XMLHttpRequest) || webix.isUndefined((new XMLHttpRequest()).upload))
            driver = webix.UploadDriver.flash;

        webix.assert(driver,"incorrect driver");
        webix.extend(this, driver, true);
    },
    $setSize:function(x,y){
        if (webix.ui.view.prototype.$setSize.call(this,x,y)){
            this.render();
        }
    },
    apiOnly_setter:function(value){
        webix.delay(this.render, this);
        return (this.$apiOnly=value);
    },
    _add_files: function(files){
        for (var i = 0; i < files.length; i++)
            this.addFile(files[i]);

    },
    link_setter:function(value){
        if (value)
            webix.delay(function(){
                var view = webix.$$(this._settings.link);
                if (view.sync && view.filter)
                    view.sync(this.files);
                else if (view.setValues)
                    this.files.data.attachEvent("onStoreUpdated", function(){
                        view.setValues(this);
                    });
                view._settings.uploader = this._settings.id;
            }, this);
        return value;
    },

    addFile:function(name, size, type){
        var file = null;
        if (typeof name == "object"){
            file = name;
            name = file.name;
            size = file.size;
        }

        var format = this._format_size(size);
        type = type || name.split(".").pop();

        var file_struct = { 
            file:file, 
            name:name, 
            id:webix.uid(), 
            size:size, 
            sizetext:format, 
            type:type, 
            context:this._last_file_context,
            status:"client" 
        };
        if (this.callEvent("onBeforeFileAdd", [file_struct])){
            if (!this._settings.multiple)
                this.files.clearAll();
            
            var id = this.files.add(file_struct);
            this.callEvent("onAfterFileAdd", [file_struct]);
            if (id && this._settings.autosend)
                this.send(id, this._settings.formData);
        }
    },


    addDropZone:function(id, hover_text){
        var node = webix.toNode(id);
        var extra_css = "";
        if (hover_text)
            extra_css = " "+webix.html.createCss({ content:'"'+hover_text+'"' }, ":before");

        var fullcss = "webix_drop_file"+extra_css;

        //web
        webix.event(node,"dragover", webix.html.preventEvent);
        webix.event(node,"dragover", function(e){
            webix.html.addCss(node, fullcss, true);
        });
        webix.event(node,"dragleave", function(e){
            webix.html.removeCss(node, fullcss);
        });

        webix.event(node,"drop", webix.bind(function(e){
            webix.html.removeCss(node, fullcss);

            var data=e.dataTransfer;
            if(data&&data.files.length)
                for (var i = 0; i < data.files.length; i++)
                    this.addFile(data.files[i]);

            return webix.html.preventEvent(e);
        }, this));
    },
    
    _format_size: function(size) {
        var index = 0;
        while (size > 1024){
            index++;
            size = size/1024;
        }
        return Math.round(size*100)/100+" "+webix.i18n.fileSize[index];
    },

    _complete: function(id, response) {
        if (response.status != 'error') {
            var item = this.files.getItem(id);

            item.status = "server";
            item.progress = 100;
            webix.extend(item, response, true);

            this.callEvent("onFileUpload", [item, response]);
            this.callEvent("onChange", []);
            this.files.updateItem(id);
        }
        
        if (this.isUploaded())
            this._upload_complete(response);
    },
    _upload_complete:function(response){
        this.callEvent("onUploadComplete", [response]);
        if (this._last_assigned_upload_callback){
            this._last_assigned_upload_callback.call(this, response);
            this._last_assigned_upload_callback = 0;
        }
    },
    isUploaded:function(){
        var order = this.files.data.order;
        for (var i=0; i<order.length; i++)
            if (this.files.getItem(order[i]).status != "server")
                return false;

        return true;
    },
    $onUploadComplete: function(){

    },
    $updateProgress: function(id, percent) {
        var item = this.files.getItem(id);
        item.percent = Math.round(percent);
        this.files.updateItem(id);
    },
    setValue:function(value){
        if (typeof value == "string")
            value = { value:value, status:"server" };

        this.files.clearAll();
        if (value)
            this.files.parse(value);

        this.callEvent("onChange", []);
    },
    getValue:function(){
        var data = [];
        this.files.data.each(function(obj){
            if (obj.status == "server")
                data.push(obj.value||obj.name);
        });

        return data.join(",");
    }

}, webix.ui.button);

module.exports = webix;