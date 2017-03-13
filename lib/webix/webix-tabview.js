require("./webix-layout");
var webix = require("./webix-tabbar");

webix.protoUI({
    name:"tabview",
    defaults:{
        type:"clean"
    },
    setValue:function(val){
        this._cells[0].setValue(val);
    },
    getValue:function(){
        return this._cells[0].getValue();
    },
    getTabbar:function(){
        return this._cells[0];
    },
    getMultiview:function(){
        return this._cells[1];
    },
    addView:function(obj){
        var id = obj.body.id = obj.body.id || webix.uid();

        this.getMultiview().addView(obj.body);

        obj.id = obj.body.id;
        obj.value = obj.header;
        delete obj.body;
        delete obj.header;

        var t = this.getTabbar();
        t.addOption(obj);
        t.refresh();

        return id;
    },
    removeView:function(id){
        var t = this.getTabbar();
        t.removeOption(id);
        t.refresh();
    },
    $init:function(config){
        this.$ready.push(this._init_tabview_handlers);

        var cells = config.cells;
        var tabs = [];

        webix.assert(cells && cells.length, "tabview must have cells collection");

        for (var i = cells.length - 1; i >= 0; i--){
            var view = cells[i].body||cells[i];
            if (!view.id) view.id = "view"+webix.uid();
            tabs[i] = { value:cells[i].header, id:view.id, close:cells[i].close, width:cells[i].width, hidden:  !!cells[i].hidden};
            cells[i] = view;
        }

        var tabbar = { view:"tabbar", multiview:true };
        var mview = { view:"multiview", cells:cells, animate:(!!config.animate) };

        if (config.value)
            tabbar.value = config.value;

        if (config.tabbar)
            webix.extend(tabbar, config.tabbar, true);
        if (config.multiview)
            webix.extend(mview, config.multiview, true);

        tabbar.options = tabbar.options || tabs;

        config.rows = [
            tabbar, mview
        ];

        delete config.cells;
        delete config.tabs;
    },
    _init_tabview_handlers:function(){
        this.getTabbar().attachEvent("onOptionRemove", function(id){
            var view = webix.$$(id);
            if (view)
                view.destructor();
        });
    }
}, webix.ui.layout);

module.exports = webix;