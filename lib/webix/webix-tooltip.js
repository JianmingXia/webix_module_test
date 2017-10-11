import default_skin from "./webix-tooltip.scss";

var webix = require("./webix-base");

webix.protoUI({
    name:"tooltip",
    defaults:{
        dy:0,
        dx:20
    },
    $init:function(container){
        if (typeof container == "string"){
            container = { template:container };
        } else {
            this._skin = container.skin;
            this._text_overflow_type = container.text_overflow_type;
        }

        this.type = webix.extend({}, this.type);

        //create  container for future tooltip
        this._viewobj = this._contentobj = this._dataobj = document.createElement("DIV");
        this._contentobj.className = "webix_tooltip";
        this._contentobj.className += this._addSkinCss("webix_tooltip");
        this._contentobj.className += this._addTextOverflowCss('tooltip');

        webix.html.insertBefore(this._contentobj,document.body.firstChild,document.body);
        webix.attachEvent("onClick", webix.bind(function(e){
            if (this._visible && webix.$$(e) != this)
                this.hide();
        }, this));
    },
    adjust:function(){  },
    //show tooptip
    //pos - object, pos.x - left, pox.y - top
    isVisible:function(){
        return true;
    },
    show:function(data,pos){
        if (this._disabled) return;
        //render sefl only if new data was provided
        if (this.data!=data){
            this.data=webix.extend({},data);
            this.render(data);
        }

        if (this._dataobj.firstChild){
            //show at specified position
            this._contentobj.style.top = pos.y+this._settings.dy+"px";
            this._contentobj.style.left = pos.x+this._settings.dx+"px";
            this._contentobj.style.display="block";
        }
        this._visible = true;
    },
    //hide tooltip
    hide:function(){
        this.data=null; //nulify, to be sure that on next show it will be fresh-rendered
        if (this._contentobj) {
            this._contentobj.style.display = "none";
        }
        this._visible = false;
    },
    disable:function(){
        this._disabled = true;
    },
    enable:function(){
        this._disabled = false;
    },
    type:{
        template:webix.template("{obj.id}"),
        templateStart:webix.template.empty,
        templateEnd:webix.template.empty
    }

}, webix.SingleRender, webix.Settings, webix.EventSystem, webix.ui.view);

module.exports = webix;