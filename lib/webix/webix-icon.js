import default_skin from "./webix-icon.scss";
var webix = require("./webix-button");

webix.protoUI({
	name:"icon",
	$skin:function(){
		this.defaults.height = webix.skin.$active.inputHeight;
	},
	defaults:{
		template:function(obj){
			var result = "<button type='button' "+(!obj.tabFocus?"tabindex='-1'":"")+" style='height:100%;width:100%;' class='webix_icon_button";
			result += webix.getSkinCss("webix_icon_button", obj.skin);
			result += webix.getCursorCss(obj.cursor_type);
			result +="'><span class='webix_icon";
			result += webix.getSkinCss("webix_icon", obj.skin);
			result += " iconfont icon-" + obj.icon + " '></span>";
			
			if(obj.badge){
				result += "<span class='webix_badge" + webix.getSkinCss("webix_badge", obj.skin) + "'>"+obj.badge+"</span>";
			}
			result += "</button>";

			return result;
		},
		width:33
	},
	_set_inner_size:function(){
		
	}
}, webix.ui.button);

module.exports = webix;