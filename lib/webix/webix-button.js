import default_skin from "./webix-button.scss";
var webix = require("./webix-base");

webix.protoUI({
	name:"button",
	touchable:true,
	_disabled_pre: "disabled_",
	$skin:function(){
		this.defaults.height = webix.skin.$active.buttonHeight||webix.skin.$active.inputHeight;
		//used in "text"
		this._labelTopHeight = webix.skin.$active.labelTopHeight||15;
	},
	defaults:{
		template:function(obj, common){
			var text = common.$renderInput(obj, common);
			if (obj.badge) text = text.replace("</button>", "<span class='webix_badge'>"+obj.badge+"</span></button>");
			var result = "<div class='webix_el_box";
			result += webix.getSkinCss("webix_el_box", common._skin);
			result += "' style='width:"+obj.awidth+"px; height:"+obj.aheight+"px'>"+ text + "</div>";
			return result;
		},
		label:"",
		tabFocus:true,
		borderless:true
	},
	$renderInput:function(obj){
		var button_class = "webixtype_" + (obj.type||"base");
		var css = "class='" + button_class;
		if(obj.disabled){
			button_class = this._disabled_pre + button_class;
		}
		css += this._addButtonCss(button_class) + "' ";
		return "<button type='button' "+css+">"+webix.template.escape(obj.label||obj.value)+"</button>";
	},
	_addButtonCss: function(class_name){
		if(this._skin && this._skin[class_name]){
			return ' ' + this._skin[class_name];
		}
		return '';
	},
	_deleteButtonCss: function(class_name, deleted_class){
		if(this._skin && this._skin[deleted_class]){
			return class_name.replace(' ' + this._skin[deleted_class], '');
		}
		return class_name;
	},
	$init:function(config){
		this._skin = config.skin;
		this._text_overflow_type = config.text_overflow_type;
		this._cursor_type = config.cursor_type;

		var el_classs_name = "webix_el_"+(this.$cssName||this.name)
		this._viewobj.className += " webix_control " + el_classs_name;
		this._viewobj.className += this._addSkinCss(el_classs_name);
		this._viewobj.className += this._addCursorCss();
		this._viewobj.className += this._addTextOverflowCss('button');

		this.data = this._settings;
		this._dataobj = this._viewobj;

		this._calc_size(config);
	},
	hotkey_setter: function(key){
		var control = this;
		this._addElementHotKey(key, function(view,ev){
			var elem = control.$view.firstChild;
			if(elem.dispatchEvent){
				var clickEvent = document.createEvent('MouseEvents');
				clickEvent.initEvent('click', true, true);
				ev.preventDefault();
				elem.dispatchEvent(clickEvent);
			}
		});
	},

	_addElementHotKey: function(key, func, view){
		var keyCode = webix.UIManager.addHotKey(key, func, view);
		this.attachEvent("onDestruct", function(){
			webix.UIManager.removeHotKey(keyCode, func, view);
		});
	},
	tooltip_setter: function(value){
		var box = this._getBox() || this.$view.firstChild;
		if(box)
			box.title = value;
		return value;
	},
	type_setter:function(value){
		if (this._types[value]){
			this.$renderInput = webix.template(this._types[value]);
		} else{
			switch(value){
				case "iconButtonTop":
					this.$renderInput = webix.template(this._iconButtonTop());
					break;
				case "icon":
					this.$renderInput = webix.template(this._icon());
					break;
				default:
					break;
			}
		}


		if (value == 'prev' || value == 'next')
			this._set_inner_size = this._set_inner_size_next;
		else
			this._set_inner_size = false;
		return value;
	},
	_types:{
		htmlbutton: "<button type='button' class='webix_el_htmlbutton webixtype_base'>#label#</button>",

		prev:"<input type='button' class='webixtype_prev' value='#label#' /><div class='webix_el_arrow webixtype_prev_arrow'></div>",
		next:"<input type='button' class='webixtype_next' value='#label#' /><div class='webix_el_arrow webixtype_next_arrow'></div>",

		imageButton:"<button type='button' class='webix_img_btn_abs webixtype_base' style='width:100%; line-height:#cheight#px'><div class='webix_image' style='width:#dheight#px;height:#dheight#px;background-image:url(#image#);'> </div> #label#</button>",
		imageButtonTop:"<button type='button' class='webix_img_btn_abs webix_img_btn_abs_top webixtype_base'><div class='webix_image' style='width:100%;height:100%;background-image:url(#image#);'> </div> <div class='webix_img_btn_text'>#label#</div></button>",

		image:"<button type='button' class='webix_img_btn' style='line-height:#cheight#px;'><div class='webix_image' style='width:#cheight#px;height:#cheight#px;background-image:url(#image#);'> </div> #label#</button>",
		imageTop:"<button type='button' class='webix_img_btn_top' style='background-image:url(#image#);'><div class='webix_img_btn_text'>#label#</div></button>",

		iconButton:"<button type='button' class='webix_img_btn_abs webixtype_base' style='width:100%;'><span class='webix_icon iconfont icon-#icon#'></span> #label#</button>",
		iconTop:"<button type='button' class='webix_img_btn_top' style='width:100%;top:4px;text-align:center;'><span class='webix_icon iconfont icon-#icon#'></span><div class='webix_img_btn_text'>#label#</div></button>",
	},
	_icon: function(){
		var result = "<button type='button' class='webix_img_btn' style='line-height:#cheight#px;'>" +
			"<span class='webix_icon_btn iconfont icon-#icon#";
		result += this._addSkinCss("webix_icon");
		result += "' style='max-width:#cheight#px;'></span>#label#</button>";

		return result;
	},
	_iconButtonTop: function() {
		var result = "<button type='button' class='webix_img_btn_abs webix_img_btn_abs_top";
		result += this._addSkinCss("webixtype_base");
		result += " webixtype_base";
		result += "' style='width:100%;top:0px;text-align:center;'><span class='webix_icon iconfont icon-#icon#";
		result += this._addSkinCss("webix_icon");
		result += "'></span><div class='webix_img_btn_text";
		result += this._addSkinCss("webix_img_btn_text");
		result += "'>#label#</div></button>";

		return result;
	},
	_findAllInputs: function(){
		var result = [];
		var tagNames = ["input","select","textarea","button"];
		for(var i=0; i< tagNames.length; i++){
			var inputs = this.$view.getElementsByTagName(tagNames[i]);
			for(var j = 0; j< inputs.length; j++){
				result.push(inputs[j]);
			}
		}
		return result;
	},
	disable: function(){
        var i,
	        elem = this._getBox();
    	webix.ui.baseview.prototype.disable.apply(this, arguments);
		if(elem && elem.className.indexOf(" webix_disabled_box")== -1){
			elem.className += " webix_disabled_box";
			var inputs = this._findAllInputs();
			for(i=0; i< inputs.length; i++){
				var class_array = inputs[i].className.split(" ");
				var disabled_class = "";
				if(class_array.length >= 2){
					disabled_class = this._addButtonCss(this._disabled_pre + class_array[class_array.length - 2]);
					inputs[i].className = this._deleteButtonCss(inputs[i].className, this._disabled_pre + class_array[class_array.length - 2]);
					inputs[i].className = this._deleteButtonCss(inputs[i].className, class_array[class_array.length - 2]);
				}

				if(disabled_class.length < 1){
					disabled_class = this._addButtonCss(this._disabled_pre + class_array[class_array.length - 1]);
				}
				inputs[i].className += disabled_class;

				inputs[i].setAttribute("disabled",true);
			}

			if(this._settings.labelPosition == "top"){
				var label = this._dataobj.firstChild;
				if(label)
					label.className += " webix_disabled_top_label";
			}
		}
	},
	enable: function(){
		webix.ui.baseview.prototype.enable.apply(this, arguments);
		var elem = this._getBox();
		if(elem){
			elem.className = elem.className.replace(" webix_disabled_box","");
			var inputs = this._findAllInputs();
			for(var i=0; i< inputs.length; i++){
				var class_array = inputs[i].className.split(" ");
				var enabled_class = "";
				if(class_array.length >= 2){
					enabled_class = this._addButtonCss(class_array[class_array.length - 2]);
					inputs[i].className = this._deleteButtonCss(inputs[i].className, this._disabled_pre + class_array[class_array.length - 2]);
					inputs[i].className = this._deleteButtonCss(inputs[i].className, class_array[class_array.length - 2]);
				}

				if(enabled_class.length < 1){
					enabled_class = this._addButtonCss(class_array[class_array.length - 1]);
				}
				inputs[i].className += enabled_class;

				inputs[i].removeAttribute("disabled");
			}

			if(this._settings.labelPosition == "top"){
				var label = this._dataobj.firstChild;
				if(label)
					label.className = label.className.replace(" webix_disabled_top_label","");
			}
		}
	},
	$setSize:function(x,y){
		if(webix.ui.view.prototype.$setSize.call(this,x,y)){
			this.render();
		}
	},
	setValue:function(value){
		var oldvalue = this._settings.value;
		if (oldvalue == value) return false;

		this._settings.value = value;

		if (this._rendered_input)
			this.$setValue(value);

		this.callEvent("onChange", [value, oldvalue]);
	},
	//visual part of setValue
	$setValue:function(value){
//		this._settings.label = value;
		(this.getInputNode()||{}).value = value;
	},
	getValue:function(){
		//if button was rendered - returning actual value
		//otherwise - returning last set value
		var value = this._rendered_input? this.$getValue() : this._settings.value;
		return (typeof value == "undefined") ? "" : value;
	},
	$getValue:function(){
		return this._settings.value||"";
	},
	focus:function(){
		var input = this.getInputNode();
		if (input && input.focus) input.focus();
	},
	blur:function() {
		var input = this.getInputNode();
		if (input && input.blur) input.blur();
	},
	//get input element
	getInputNode: function() {
		return this._dataobj.getElementsByTagName('input')[0]||this._dataobj.getElementsByTagName('button')[0];
	},
	//get top-level sub-container
	_getBox:function(){
		for(var i=0;i< this._dataobj.childNodes.length;i++){
			if(this._dataobj.childNodes[i].className.indexOf("webix_el_box")>=0)
				return this._dataobj.childNodes[i];
		}
		return null;
	},
	_sqrt_2:Math.sqrt(2),
	_set_inner_size_next:function(){
		var cfg = this._settings;
		var arrow = this._getBox().childNodes[1];
		var button = arrow.previousSibling;
		var style = cfg.type == "next"?"right":"left";
		var height = cfg.aheight-webix.skin.$active.inputPadding*2-2; //-2 - borders

		var arrowEdge = height*this._sqrt_2/2;
		arrow.style.width = arrowEdge+"px";
		arrow.style.height = arrowEdge+"px";
		arrow.style.top = (height - arrowEdge)/2 + webix.skin.$active.inputPadding+ "px";
		arrow.style[style] = (height - arrowEdge)/2 +this._sqrt_2/2+ "px";
		button.style.width = cfg.awidth - height/2 -2  + "px";
		button.style.height = height + 2 + "px";
		button.style[style] =  height/2 + 2 + "px";
		button.style.top = webix.skin.$active.inputPadding+ "px";

	},
	_calc_size:function(config){
		config = config || this._settings;

		if (config.autowidth)
			config.width = webix.html.getTextSize((config.value||config.label), "webixbutton").width +
				(config.badge ? 15 : 0) +
				(config.type === "iconButton" ? 30 : 0) +
				(config.type === "icon"? 20 : 0);

		if(config.autoheight){
			config.height = webix.html.getTextHeightSize((config.value||config.label), config.width, config.line_height);
		}
	},
	_calck_input_size:function(){
		//use width for both width and inputWidth settings in clever way
		//in form, we can define width for some element smaller than for siblings
		//it will use inputWidth to render the desired view
		this._input_width = this._settings.inputWidth ||
			((this._content_width - this._settings.width > 2)?this._settings.width:0) || this._content_width;
		this._input_height = this._settings.inputHeight||this._inputHeight||0;
	},
	resize: function(){
		this._calc_size();
		return webix.ui.view.prototype.resize.apply(this,arguments);
	},
	render:function(){
		this._calck_input_size();
		this._settings.awidth  = this._input_width||this._content_width;
		this._settings.aheight = this._input_height||this._content_height;

		//image button - image width
		this._settings.bheight = this._settings.aheight+2;
		this._settings.cheight = this._settings.aheight- 2*webix.skin.$active.inputPadding;
		this._settings.dheight = this._settings.cheight - 2; // - borders

		if(webix.AtomRender.render.call(this)){
			this._rendered_input = true;
			if (this._set_inner_size) this._set_inner_size();
			if (this._settings.align){
				var handle = this._dataobj.firstChild;
				if (this._settings.labelPosition == "top" && handle.nextSibling)
					handle = handle.nextSibling;

				switch(this._settings.align){
					case "right":
						handle.style.cssFloat = "right";
						break;
					case "center":
						handle.style.display = "inline-block";
						handle.parentNode.style.textAlign = "center";
						break;
					case "middle":
						handle.style.marginTop = Math.round((this._content_height-this._input_height)/2)+"px";
						break;
					case "bottom":
						handle.style.marginTop = (this._content_height-this._input_height)+"px";
						break;
					case "left":
						handle.style.cssFloat = "left";
						break;
					default:
						webix.assert(false, "Unknown align mode: "+this._settings.align);
						break;
				}
			}

			if (this.$render)
				this.$render(this.data);

			if (this._settings.disabled)
				this.disable();

			// set tooltip after render
			if (this._settings.tooltip)
				this.define("tooltip",this._settings.tooltip );

			if (this._init_once){
				this._init_once(this.data);
				this._init_once = 0;
			}
		}
	},

	refresh:function(){ this.render(); },

	on_click:{
		_handle_tab_click: function(ev, button){
			var id = webix.html.locate(ev, "button_id");
			if (id && this.callEvent("onBeforeTabClick", [id, ev])){
				this.setValue(id);
				this.callEvent("onAfterTabClick", [id, ev]);
			}
		},
		webix_all_segments:function(ev, button){
			this.on_click._handle_tab_click.call(this, ev, button);
		},
		webix_all_tabs:function(ev, button) {
			this.on_click._handle_tab_click.call(this, ev, button);
		},
		webix_inp_counter_next:function(e, obj, node){
			this.next();
		},
		webix_inp_counter_prev:function(e, obj, node){
			this.prev();
		},
		webix_inp_combo:function(e, obj, node){
			node.focus();
		},
		webix_inp_checkbox_border: function(e, obj, node) {
			if (!this._settings.disabled && (e.target||e.srcElement).tagName != "DIV" && !this._settings.readonly)
				this.toggle();
		},
		webix_inp_checkbox_label: function(e, obj, node) {
			if (!this._settings.readonly)
				this.toggle();
		},
		webix_inp_radio_border: function(e, obj, node) {
			var value = webix.html.locate(e, "radio_id");
			this.setValue(value);
		},
		webix_inp_radio_label: function(e, obj, node) {
			node = node.parentNode.getElementsByTagName('input')[0];
			return this.on_click.webix_inp_radio_border.call(this, node, obj, node);
		},
		webix_tab_more_icon: function(ev,obj, node){
			this.getPopup().resize();
			this.getPopup().show(node,null,true);
		},
		webix_tab_close:function(ev, obj, node){
			var id = webix.html.locate(ev, "button_id");
            if (id && this.callEvent("onBeforeTabClose", [id, ev]))
			    this.removeOption(id);
		}
	},

	//method do not used by button, but  used by other child-views
	_check_options:function(opts){
		webix.assert(opts, this.name+": options not defined");
		for(var i=0;i<opts.length;i++){
			//FIXME: asserts need to be removed in final version
			webix.assert(!opts[i].text, "Please replace .text with .value in control config");
			webix.assert(!opts[i].label, "Please replace .label with .value in control config");

			if(typeof opts[i]=="string"){
				opts[i] = {id:opts[i], value:opts[i]};
			}
			else {
				if(webix.isUndefined(opts[i].id))
					opts[i].id = opts[i].value;

				if(webix.isUndefined(opts[i].value))
					opts[i].value = opts[i].id;
			}
		}
		return opts;
	},
	_get_div_placeholder: function(obj){
		var placeholder = (obj?obj.placeholder:this._settings.placeholder);
		return (placeholder?"<span class='webix_placeholder'>"+placeholder+"</span>":"");
	},
	_get_event_id: function(evName){
		return "webix_"+evName+"_"+this._settings.id;
	}
}, webix.ui.view, webix.AtomRender, webix.Settings, webix.EventSystem);

module.exports = webix;
