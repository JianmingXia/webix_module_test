import default_skin from "./webix-text.scss";

var webix = require("./webix-button");

webix.protoUI({
	name:"text",
	_allowsClear:true,
	_init_onchange:function(){
		if (this._allowsClear){

		    webix.event(this.getInputNode(),"change",this._applyChanges,{bind:this});

			if (this._settings.suggest)
		   		webix.$$(this._settings.suggest).linkInput(this);
		 }
	},
	_applyChanges: function(){
		var newvalue = this.getValue();

		if (newvalue != this._settings.value)
			this.setValue(newvalue, true);
	},
	$skin:function(){
		this.defaults.height = webix.skin.$active.inputHeight;
		this.defaults.inputPadding = webix.skin.$active.inputPadding;
	},
	$init:function(config){
		if (config.labelPosition == "top")
			if (webix.isUndefined(config.height) && this.defaults.height)  // textarea
				config.height = this.defaults.height + this._labelTopHeight;

		//suggest reference for destructor
		this._destroy_with_me = [];

		this.attachEvent("onAfterRender", this._init_onchange);
	},
	$renderIcon:function(){
		var config = this._settings;
		if (config.icon){
			var height = config.aheight - 2*config.inputPadding,
				padding = (height - 18)/2 -1;
				var result = "<span style='height:"+(height-padding)+"px;padding-top:"+padding+"px;' class='webix_input_icon iconfont icon-"+config.icon;
				result += this._addSkinCss("webix_input_icon") + this._addSkinCss(config.icon) + "'></span>";
				return result;
			}
			return "";
	},
	relatedView_setter:function(value){
		this.attachEvent("onChange", function(){
			var value = this.getValue();
			var mode = this._settings.relatedAction;
			var viewid = this._settings.relatedView;
			var view = webix.$$(viewid);
			if (!view){
				var top = this.getTopParentView();
				if (top && top.$$)
					view = top.$$(viewid);
			}

			webix.assert(view, "Invalid relatedView: "+viewid);

			if (mode == "enable"){
				if (value) view.enable(); else view.disable();
			} else {
				if (value) view.show(); else view.hide();
			}
		});
		return value;
	},
	validateEvent_setter:function(value){
		if (value == "blur")
			this.attachEvent("onBlur", this.validate);

		if (value == "key")
			this.attachEvent("onTimedKeyPress", this.validate);

		return value;
	},
	validate:function(){
		var rule = this._settings.validate;
		if (!rule && this._settings.required)
			rule = webix.rules.isNotEmpty;

		var form =this.getFormView();
		var name = this._settings.name;
		var value = this.getValue();
		var data = {}; data[name] = value;

		webix.assert(form, "Validation works only for fields in the form");
		webix.assert(name, "Validation works only for fields with name");

		if (rule && !this.getFormView()._validate(rule, value, data, name))
			return false;
		return true;
	},
	bottomLabel_setter: function(value){
		if(!this._settings.bottomPadding)
			this._settings.bottomPadding = 18;
		return value;
	},
	_getInvalidText: function(){
		var text = this._settings.invalidMessage;
		if(typeof text == "function"){
			text.call(this);
		}
		return text;
	},
	setBottomText: function(text, height){
		var config = this._settings;
		if (typeof text != "undefined"){
			if (config.bottomLabel == text) return;
			config.bottomLabel = text;
		}

		var message = (config.invalid ? config.invalidMessage : "" ) || config.bottomLabel;
		if (!message && !config.bottomPadding)
			config.inputHeight = 0;
		if (message && !config.bottomPadding){
			this._restorePadding = 1;
			config.bottomPadding = config.bottomPadding || height || 18;
			//textarea
			if (!config.height)
				this.render();
			this.resize();
		} else if (!message && this._restorePadding){
			config.bottomPadding = this._restorePadding = 0;
			//textarea
			if (!config.height)
				this.render();
			this.resize();
		} else
			this.render();
	},
	$getSize: function(){
		var sizes = webix.ui.view.prototype.$getSize.apply(this,arguments);
		var heightInc = this.config.bottomPadding;
		if(heightInc){
			sizes[2] += heightInc;
			sizes[3] += heightInc;
		}
		return sizes;
	},
	$setSize:function(x,y){
		var config = this._settings;

		if(webix.ui.view.prototype.$setSize.call(this,x,y)){
			if (!x || !y) return;

			if (config.labelPosition == "top"){
				// textarea
				if (!config.inputHeight)
					this._inputHeight = this._content_height - this._labelTopHeight - (this.config.bottomPadding||0);
				config.labelWidth = 0;
			} else if (config.bottomPadding){
				config.inputHeight = this._content_height - this.config.bottomPadding;
			}
			this.render();
		}
	},
	_get_input_width: function(config){
		var width = (this._input_width||0)-(config.label?this._settings.labelWidth:0)- 	4 - (config.iconWidth || 0);

		//prevent js error in IE
		return (width < 0)?0:width;
	},
	_render_div_block:function(obj, common){
		var id = "x"+webix.uid();
		var width = common._get_input_width(obj);
		var inputAlign = obj.inputAlign || "left";
		var icon = this.$renderIcon?this.$renderIcon(obj):"";
		var height = this._settings.aheight - 2*webix.skin.$active.inputPadding -2;
		var text = (obj.text||obj.value||this._get_div_placeholder(obj));

		var html = "<div class='webix_inp_static";
		html += this._addSkinCss("webix_inp_static");
		html += "' tabindex='0' onclick='' style='line-height:"+height+"px;width: " + width + "px; text-align: " + inputAlign + ";' >"+ text +"</div>";

		return common.$renderInput(obj, html, id);
	},
	_baseInputHTML:function(tag){
		var html = "<"+tag+(this._settings.placeholder?" placeholder='"+this._settings.placeholder+"' ":" ");
		if (this._settings.readonly)
			html += "readonly='true' ";

		var attrs = this._settings.attributes;
		if (attrs)
			for(var prop in attrs)
				html += prop+"='"+attrs[prop]+"' ";
		return html;
	},
	$renderLabel: function(config, id){
		var labelAlign = (config.labelAlign||"left");
		var top = this._settings.labelPosition == "top";
		var labelTop =  top?"display:block;":("width: " + this._settings.labelWidth + "px;");
		var label = "";
		var labelHeight = top?this._labelTopHeight-2:( this._settings.aheight - 2*this._settings.inputPadding);

		var css_name = "webix_inp_"+(top?"top_":"")+"label";
		var css  = "class='" + css_name;
		css += this._addSkinCss(css_name) + " ";
		if (config.label)
			label = "<label style='"+labelTop+"text-align: " + labelAlign + ";line-height:"+labelHeight+"px;' onclick='' for='"+id+"' "+ css +(config.required?"webix_required":"")+"'>" + (config.label||"") + "</label>";
		return label;
	},
	$renderInput: function(config, div_start, id) {
		var inputAlign = (config.inputAlign||"left");
		var top = (config.labelPosition == "top");
		var inputWidth = this._get_input_width(config);

		id = id||webix.uid();

		var label = this.$renderLabel(config,id);

		var html = "";
		if(div_start){
			html += div_start;
		} else {
			html += this._baseInputHTML("input")+"id='" + id + "' type='"+(config.type||this.name)+"' value='" + webix.template.escape(config.value||"") + "' style='width: " + inputWidth + "px; text-align: " + inputAlign + ";'";
			var attrs = config.attributes;
			if (attrs)
				for(var prop in attrs)
					html += " "+prop+"='"+attrs[prop]+"'";
			html += " />";
		}
		var icon = this.$renderIcon?this.$renderIcon(config):"";
		html += icon;

		var result = "";
		//label position, top or left
		if (top)
			result = label+"<div class='webix_el_box " + this._addSkinCss("webix_el_box") + "' style='width:"+config.awidth+"px; height:"+config.aheight+"px'>"+html+"</div>";
		else
			result = "<div class='webix_el_box " + this._addSkinCss("webix_el_box") + "' style='width:"+config.awidth+"px; height:"+config.aheight+"px'>"+label+html+"</div>";


		//bottom message width
		var padding = config.awidth-inputWidth-webix.skin.$active.inputPadding*2;
		//bottom message text
		var message = (config.invalid ? config.invalidMessage : "") || config.bottomLabel;
		if (message)
			result +=  "<div class='webix_inp_bottom_label' style='width:"+(inputWidth||config.awidth)+"px;margin-left:"+Math.max(padding,webix.skin.$active.inputPadding)+"px;'>"+message+"</div>";

		return result;
	},
	defaults:{
		template:function(obj, common){
			return common.$renderInput(obj);
		},
		label:"",
		labelWidth:80
	},
	type_setter:function(value){ return value; },
	_set_inner_size:false,
	$setValue:function(value){
		this.getInputNode().value = value;
	},
	$getValue:function(){
		return this.getInputNode().value;
	},
	suggest_setter:function(value){
		if (value){
			webix.assert(value !== true, "suggest options can't be set as true, data need to be provided instead");

			if (typeof value == "string"){
				var attempt = webix.$$(value);
				if (attempt)
					return webix.$$(value)._settings.id;

				value = { body: { url:value , dataFeed :value } };
			} else if (webix.isArray(value))
				value = { body: { data: this._check_options(value) } };
			else if (!value.body)
				value.body = {};

			value.body.text_overflow_type = this._text_overflow_type;
			value.body.skin = this._skin;
			if(this.config.yCount) {
				value.body.yCount = this.config.yCount;
			}

			webix.extend(value, { view:"suggest"});

			var view = webix.ui(value);
			this._destroy_with_me.push(view);
			return view._settings.id;
		}
		return false;
	}
}, webix.ui.button);

module.exports = webix;
