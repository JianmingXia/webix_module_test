import default_skin from "./webix-line.scss";
var webix = require("./webix-base");

webix.protoUI({
    name:"line",
    $init:function(config){
        this._skin = config.skin;

        var element;
    	if(typeof config.y != 'undefined' && config.y == true){
    		if(!config.width) {
                config.width = 3;
            }

            element = "<div class='webix_context_separator_y";
            element += this._addSkinCss("webix_context_separator_y");

            this._contentobj.innerHTML = element;
		} else {
            if(!config.height) {
                config.height = 3;
            }

            var element = "<div class='webix_context_separator_x";
            element += this._addSkinCss("webix_context_separator_x");
    	}

        element += "'><div class='line";
        element += this._addSkinCss("line");
        element += "'></div></div>";

        this._contentobj.innerHTML = element;
        this._dataobj = this._contentobj;
    },
    defaults:{
		borderless:true,
		margin: 1,
		padding: 1,
		x: true,
		y: false
	},
}, webix.ui.view);

module.exports = webix;