if (X)
(function(){

webix.XView = X.View.extend({

	initialize : function (options) {
		this.options = options || {};
	},
	render:function(){
		if (this.beforeRender) this.beforeRender.apply(this, arguments);

		var config = this.config || this.options.config;
		var el;

		if (!config.view || !webix.ui.hasMethod(config.view, "setPosition")){
			el = window.$ ? $(this.el)[0] : this.el;

			if (el && !el.config) el.innerHTML = "";
		}

		var ui = webix.copy(config);
		ui.$scope = this;
		this.root = webix.ui(ui, el);
		
		if (this.afterRender) this.afterRender.apply(this, arguments);
		return this;
	},
	destroy:function(){
		if (this.root) this.root.destructor();
	},
	getRoot:function(){
		return this.root;
	},
	getChild:function(id){
		return this.root.$$(id);
	}
});

})();