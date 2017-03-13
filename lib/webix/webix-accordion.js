require("./webix-accordionitem");
var webix = require("./webix-layout");

webix.protoUI({
	name:"accordion",
	defaults:{
		panelClass:"accordionitem",
		multi:false,
		collapsed:false
	},
	addView:function(view){
		//adding view to the accordion
		var id = webix.ui.layout.prototype.addView.apply(this, arguments);
		var child = webix.$$(id);
		//repainting sub-panels in the accordion
		if (child.collapsed_setter && child.refresh) child.refresh();
		return id;
	},
	_parse_cells:function(){
		var panel = this._settings.panelClass;
		var cells = this._collection;

		for (var i=0; i<cells.length; i++){
			if ((cells[i].body || cells[i].header)&& !cells[i].view)
				cells[i].view = panel;
			if (webix.isUndefined(cells[i].collapsed))
				cells[i].collapsed = this._settings.collapsed;

		}

	
		this._skin_render_collapse = true;
		webix.ui.layout.prototype._parse_cells.call(this);
		this._skin_render_collapse = false;

		for (var i=0; i < this._cells.length; i++){
			if (this._cells[i].name == panel) 
				this._cells[i].refresh();
			this._cells[i]._accLastChild = false;
		}
		var found = false;
		for (var i= this._cells.length-1; i>=0 &&!found; i--){
			if(!this._cells[i]._settings.hidden){
				this._cells[i]._accLastChild = true;
				found = true;
			}
		}

	},
	_afterOpen:function(view){
		if (this._settings.multi === false && this._skin_render_collapse !== true){
			for (var i=0; i < this._cells.length; i++) {
				if (view != this._cells[i] && !this._cells[i]._settings.collapsed && this._cells[i].collapse)
					this._cells[i].collapse();
			}
		}
	},
	_canCollapse:function(view){
		if (this._settings.multi === true || this._skin_render_collapse) return true;
		//can collapse only if you have other item to open
		for (var i=0; i < this._cells.length; i++)
			if (view != this._cells[i] && !this._cells[i]._settings.collapsed && this._cells[i].isVisible())
				return true;
		return false;
	},
	$skin:function(){
		var defaults = this.defaults;
		if(webix.skin.$active.accordionType)
			defaults.type = webix.skin.$active.accordionType;
	}
}, webix.ui.layout);

module.exports = webix;