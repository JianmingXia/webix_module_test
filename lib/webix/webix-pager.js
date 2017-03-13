import default_skin from "./webix-pager.scss";

var webix = require("./webix-base");

webix.protoUI({
    defaults:{
        size:10,    //items on page
        page: 0,    //current page
        group:5,
        template:"{common.pages()}",
        maxWidth:100000,
        height:30,
        borderless:true
    },
    name:"pager",
    on_click:{
        //on paging button click
        "webix_pager_item":function(e,id){
            this.select(id);
        }
    },
    $init:function(config){
        this.data = this._settings;
        this._dataobj = this._viewobj;
        this._viewobj.className += " webix_pager";

        if(config.master===false||config.master === 0)
             this.$ready.push(this._remove_master);
    },
    _remove_master:function(){
        this.refresh();
        this.$master = { refresh:function(){}, select:function(){} };
    },
    select:function(id){
        if (this.$master && this.$master.name == "pager")
            return this.$master.select(id);

        //id - id of button, number for page buttons
        switch(id){
            case "next":
                id = this._settings.page+1;
                break;
            case "prev":
                id = this._settings.page-1;
                break;
            case "first":
                id = 0;
                break;
            case "last":
                id = this._settings.limit-1;
                break;
            default:
                //use incoming id
                break;
        }
        if (id<0) id=0;
        if (id>=this.data.limit) id=this.data.limit-1;

        var old = this.data.page;
        this.data.page = id*1; //must be int

        if (this.refresh()){
            if (!this._settings.animate || !this._animate(old, id*1, this._settings.animate))
                this.$master.refresh();
        }
    },
    _id:"webix_p_id",
    template_setter:webix.template,
    type:{
        template:function(a,b){ return a.template.call(this, a,b); },
        //list of page numbers
        pages:function(obj){
            var html="";
            //skip rendering if paging is not fully initialized
            if (obj.page == -1) return "";
            //current page taken as center of view, calculate bounds of group
            obj.$min = obj.page-Math.round((obj.group-1)/2);
            obj.$max = obj.$min + obj.group*1 - 1;
            if (obj.$min<0){
                obj.$max+=obj.$min*(-1);
                obj.$min=0;
            }
            if (obj.$max>=obj.limit){
                obj.$min -= Math.min(obj.$min,obj.$max-obj.limit+1);
                obj.$max = obj.limit-1;
            }
            //generate HTML code of buttons
            for (var i=(obj.$min||0); i<=obj.$max; i++)
                html+=this.button({id:i, index:(i+1), selected:(i == obj.page ?"_selected":"")});
            return html;
        },
        page:function(obj){
            return obj.page+1;
        },
        //go-to-first page button
        first:function(){
            return this.button({ id:"first", index:webix.locale.pager.first, selected:""});
        },
        //go-to-last page button
        last:function(){
            return this.button({ id:"last", index:webix.locale.pager.last, selected:""});
        },
        //go-to-prev page button
        prev:function(){
            return this.button({ id:"prev", index:webix.locale.pager.prev, selected:""});
        },
        //go-to-next page button
        next:function(){
            return this.button({ id:"next", index:webix.locale.pager.next, selected:""});
        },
        button:webix.template("<button type='button' webix_p_id='{obj.id}' class='webix_pager_item{obj.selected}'>{obj.index}</button>")
    },
    clone:function(pager){
        if (!pager.$view){
            pager.view = "pager";
            pager = webix.ui(pager);
        }

        this._clone = pager;
        pager.$master = this;
        this._refresh_clone();
    },
    refresh:function(){
        var s = this._settings;
        if (!s.count) return;

        //max page number
        s.limit = Math.ceil(s.count/s.size);

        var newPage = Math.min(s.limit-1, s.page);

        if (newPage != s.page)
            return this.$master.setPage(newPage);

        s.page = newPage;
        if (newPage>=0 && (newPage!=s.old_page) || (s.limit != s.old_limit) || (s.old_count != s.count)){
            //refresh self only if current page or total limit was changed
            this.render();
            this._refresh_clone();
            s.old_limit = s.limit;  //save for onchange check in next iteration
            s.old_page = s.page;
            s.old_count = s.count;
            return true;
        }
    },
    apiOnly_setter:function(value){
        return (this.$apiOnly=value);
    },
    _refresh_clone:function(){
        if (this._clone){
            this._clone._settings.count = this._settings.count;
            this._clone._settings.page = this._settings.page;
            this._clone.refresh();
        }
    },
    _animate:function(old, id, config){
        if (old == id) return false;
        if (this._pgInAnimation){
            if(this._pgAnimateTimeout){
                window.clearTimeout(this._pgAnimateTimeout);
            }
            return (this._pgAnimateTimeout = webix.delay(this._animate, this,[old, id, config],100));
        }
        var direction = id > old ? "left" : "right";
        if (config.direction == "top" || config.direction == "bottom")
            direction = id > old ? "top" : "bottom";
        if (config.flip)
            direction = "";

        

        //make copy of existing view
        var top = 0;
        var snode = this.$master._dataobj;
        if (this.$master._body){    //datatable
            snode = this.$master._body;
            top = snode.offsetTop;
            webix.html.addCss(this.$master.$view, "webix_animation");
        }

        var onode = snode.cloneNode(true);
        onode.style.width = snode.style.width = "100%";
        onode.style.backgroundColor = snode.style.backgroundColor = "white";
        
        //redraw page
        this.$master.refresh();
        //append copy next to original
        webix.html.insertBefore(onode, snode.nextSibling, snode.parentNode);

        //animation config
        var line;
        var base = config !== true ? config : {};
        var aniset = webix.extend({
            direction:direction,
            callback:webix.bind(function(){
                aniset.callback = null;
                webix.animate.breakLine(line);
                this._pgInAnimation = false;
                if (this.$master._body)
                    webix.html.removeCss(this.$master.$view, "webix_animation");
            },this),
            top:top
        }, base);

        //run animation
        line = webix.animate.formLine(snode, onode, aniset);
        webix.animate([ snode, onode ], aniset );
        this._pgInAnimation = true;
    }
}, webix.MouseEvents, webix.SingleRender, webix.ui.view, webix.EventSystem);

module.exports = webix;