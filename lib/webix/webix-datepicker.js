import default_skin from "./webix-datepicker.scss";

require("./webix-suggest");
require("./webix-text");
var webix = require("./webix-calendar");

webix.protoUI({
	name:"datepicker",
	$init:function(){
		this.$ready.push(this._init_popup);
	},
	defaults:{
		template:function(obj, common){
			if(common._settings.type == "time"){
				common._settings.icon = common._settings.timeIcon;
			}
			//temporary remove obj.type [[DIRTY]]
			var t = obj.type; obj.type = "";
			var res = obj.editable?common.$renderInput(obj):common._render_div_block(obj, common);
			obj.type = t;
			return res;
		},
		stringResult:false,
		timepicker:false,
		icon:"calendar",
		icons: true,
		timeIcon: "clock-o"
	},
	$skin:function(){
		this.defaults.inputPadding = webix.skin.$active.inputPadding;
	},
	getPopup: function(){
	 	return webix.$$(this._settings.popup);
	},
	_init_popup:function(){ 
		var obj = this._settings;
		if (obj.suggest)
			obj.popup = obj.suggest;
		else if (!obj.popup){
			var timepicker = this._settings.timepicker;
			obj.popup = obj.suggest = this.suggest_setter({
				type:"calendar", height:240+(timepicker?30:0), width:250, padding:0,
				body: { timepicker:timepicker, type: this._settings.type, icons: this._settings.icons }
			});
		}


		this._init_once = function(){};	
	},
	$render:function(obj){
		if (webix.isUndefined(obj.value)) return;
		this.$setValue(obj.value);
	},	
	_parse_value:function(value){
		var type = this._settings.type;
		var timeMode = type == "time";

		//setValue("1980-12-25")
		if(!isNaN(parseFloat(value)))
			value = ""+value;

		if (typeof value=="string" && value){
			var formatDate = null;
			if((type == "month" || type == "year") && this._formatDate){
				formatDate = this._formatDate;
			}
			else
				formatDate = (timeMode?webix.i18n.parseTimeFormatDate:webix.i18n.parseFormatDate);
			value = formatDate(value);
		}

		if (value){
			//time mode
			if(timeMode){
				//setValue([16,24])
				if(webix.isArray(value)){
					var time = new Date();
					time.setHours(value[0]);
					time.setMinutes(value[1]);
					value = time;
				}
			}
			//setValue(invalid date)



			if(isNaN(value.getTime()))
				value = "";
		}

		return value;
	},
	$setValue:function(value){
		var popup =  webix.$$(this._settings.popup.toString());
		var calendar = popup._body_cell;

		//convert string or array to date
		value = this._parse_value(value);
		//select date in calendar-popup
		calendar.selectDate(value,true);

		//save value
		this._settings.value = (value)?calendar.config.date:"";

		//set visible date
		var timeMode = this._settings.type == "time";
		var timepicker = this.config.timepicker;
		var formatStr = this._formatStr||(timeMode?webix.i18n.timeFormatStr:(timepicker?webix.i18n.fullDateFormatStr:webix.i18n.dateFormatStr));
		this._settings.text = (value?formatStr(this._settings.value):"");

		var node = this.getInputNode();
		if(node.value == webix.undefined){
			node.innerHTML = this._settings.text || this._get_div_placeholder();
		}
		else{
			node.value = this._settings.text || "";
		}
	},
	format_setter:function(value){
		if(value){
			if (typeof value === "function")
				this._formatStr = value;
			else {
				this._formatStr = webix.Date.dateToStr(value);
				this._formatDate = webix.Date.strToDate(value);
			}
		}
		else
			this._formatStr = this._formatDate = null;
		return value;
	},
	getInputNode: function(){
		return this._settings.editable?this._dataobj.getElementsByTagName('input')[0]:this._dataobj.getElementsByTagName("DIV")[1];
	},
	getValue:function(){
		var type = this._settings.type;
		//time mode
		var timeMode = (type == "time");
		//date and time mode
		var timepicker = this.config.timepicker;

		var value = this._settings.value;

		//input was not rendered, we need to parse value from setValue method
		if (!this._rendered_input)
			value = this._parse_value(value) || null;
		//rendere and in edit mode
		else if (this._settings.editable){
			var formatDate = this._formatDate||(timeMode?webix.i18n.timeFormatDate:(timepicker?webix.i18n.fullDateFormatDate:webix.i18n.dateFormatDate));
			value = formatDate(this.getInputNode().value);
		}

		//return string from getValue
		if(this._settings.stringResult){
			var formatStr =webix.i18n.parseFormatStr;
			if(timeMode)
				formatStr = webix.i18n.parseTimeFormatStr;
			if(this._formatStr && (type == "month" || type == "year")){
				formatStr = this._formatStr;
			}

			return (value?formatStr(value):"");
		}
		
		return value||null;
	},
	getText:function(){
		var node = this.getInputNode();
		return (node?(typeof node.value == "undefined" ? node.innerHTML : node.value):"");
	}
}, webix.ui.text);

module.exports = webix;