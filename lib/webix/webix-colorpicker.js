var webix = require('./webix-datepicker');

webix.protoUI({
	name:"colorpicker",
	$init:function(){
		this.$ready.push(this._init_popup);
	},
	defaults:{
		icon:true
	},
	_init_popup:function(){ 
		var obj = this._settings;
		if (obj.suggest)
			obj.popup = obj.suggest;
		else if (!obj.popup)
			obj.popup = obj.suggest = this.suggest_setter({
				type:"colorboard", height:200
			});
		this._init_once = function(){};	
	},	
	$render:function(obj){
		if (webix.isUndefined(obj.value)) return;
		this.$setValue(obj.value);
	},
	getValue:function(){
		if (this._rendered_input && this._settings.editable)
			return this.getInputNode().value;
		else 
			return this._settings.value;
	},
	_getColorNode: function(){
		return this.$view.getElementsByTagName("DIV")[this._settings.editable?1:2];
	},
	$setValue:function(value){
		var popup =  webix.$$(this.config.popup.toString());
		var colorboard = popup.getBody();
		colorboard.setValue(value);
		this.config.value = value;
		this._getColorNode().style.backgroundColor = value;
		var node = this.getInputNode();
		if(node.value == webix.undefined)
			node.innerHTML = value;
		else
			node.value = value;
	},
	$renderIcon:function(){
		var config = this.config;
		return '<div class="webix_input_icon" style="background-color:'+config.value+';"> </div>';
	}
}, webix.ui.datepicker);

module.exports = webix;