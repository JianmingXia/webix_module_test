import default_skin from "./webix-window.scss";

var webix = require("./webix-template");

webix.protoUI({
    name:"window",

    $init:function(config){
        this._skin = config.skin;

        var innerHTML = "<div class='webix_win_content'><div class='webix_win_head";
        innerHTML += this._addSkinCss("webix_win_head");
        innerHTML += "'></div><div class='webix_win_body'></div></div>";

        this._viewobj.innerHTML = innerHTML;
        this._contentobj = this._viewobj.firstChild;
        this._headobj = this._contentobj.childNodes[0];
        this._dataobj = this._bodyobj = this._contentobj.childNodes[1];
        this._viewobj.className +=" webix_window";
        this._viewobj.className += this._addSkinCss("webix_window");

        this._head_cell = this._body_cell = null;
        this._settings._inner = {top:false, left:false, right:false, bottom:false }; //set border flags
        if (!config.id) config.id = webix.uid();

        webix.event(this._contentobj, "click", webix.bind(this._ignore_clicks, this));

        // IE8 does not allow to define event capturing
        if(this._contentobj.addEventListener)
            webix.event(this._contentobj, "click", function(){
                // brings a window to the front of other windows
                if(!this._settings.zIndex && this._settings.toFront){
                    this._viewobj.style.zIndex = webix.ui.zIndex();
                }
            }, {bind:this, capture: true});

        // hidden_setter handling
        if(config.modal)
            this._modal = true;
    },
    _ignore_clicks:function(e){
        var popups = webix.ui._popups;
        var index = popups.find(this);
        if (index == -1)
            index = popups.length - 1;

        e.click_view = index;
        if (webix.env.isIE8)
            e.srcElement.click_view = index;
    },
    getChildViews:function(){
        if (this._head_cell)
            return [this._head_cell, this._body_cell];
        else
            return [this._body_cell];
    },
    zIndex_setter:function(value){
        this._viewobj.style.zIndex = value;
        return value;
    },
    _remove:function(){
        this._body_cell = { destructor:function(){} };
    },
    _replace:function(new_view){
        this._body_cell.destructor();
        this._body_cell = new_view;
        this._body_cell._parent_cell = this;

        this._bodyobj.appendChild(this._body_cell._viewobj);

        var cell = this._body_cell._viewobj.style;
        cell.borderTopWidth = cell.borderBottomWidth = cell.borderLeftWidth = cell.borderRightWidth = "1px";
        this._body_cell._settings._inner = webix.clone(this._settings._inner);

        this.resize(true);
    },
    show:function(node, mode, point){
        if(!this.callEvent("onBeforeShow",arguments))
            return false;

        this._settings.hidden = false;
        this._viewobj.style.zIndex = (this._settings.zIndex||webix.ui.zIndex());
        if (this._settings.modal || this._modal){
            this._modal_set(true);
            this._modal = null; // hidden_setter handling
        }

        var pos, dx, dy;
        mode = mode || {};
        if (!mode.pos)
            mode.pos = this._settings.relative;

        //get position of source html node
        //we need to show popup which pointing to that node
        if (node){
            //if event was provided - get node info from it
            if (typeof node == "object" && !node.tagName){
                /*below logic is far from ideal*/
                if (node.target || node.srcElement){
                    pos = webix.html.pos(node);
                    dx = 20;
                    dy = 5;
                } else
                    pos = node;


            } else {
                node = webix.toNode(node);
                webix.assert(node,"Not existing target for window:show");
                pos = webix.html.offset(node);
            }

            //size of body, we need to fit popup inside
            var x = Math.max(window.innerWidth || 0, document.body.offsetWidth);
            var y = Math.max(window.innerHeight || 0, document.body.offsetHeight);

            //size of node, near which popup will be rendered
            dx = dx || node.offsetWidth  || 0;
            dy = dy || node.offsetHeight || 0;
            //size of popup element
            var size = this._last_size;

            var fin_x = pos.x;
            var fin_y = pos.y;
            var point_y = 0;
            var point_x = 0;

            if (this._settings.autofit){
                var delta_x = 6; var delta_y=6; var delta_point = 6;

                //default pointer position - top
                point = "top";
                fin_y=0; fin_x = 0;
                //if we want to place menu at righ, but there is no place move it to left instead
                if (x - pos.x - dx < size[0] && mode.pos == "right")
                    mode.pos = "left";

                if (mode.pos == "right"){
                    fin_x = pos.x+delta_x+dx;
                    delta_y = -dy;
                    point = "left";
                    point_y = Math.round(pos.y+dy/2);
                    point_x = fin_x - delta_point;
                } else if (mode.pos == "left"){
                    fin_x = pos.x-delta_x-size[0]-1;
                    delta_y = -dy;
                    point = "right";
                    point_y = Math.round(pos.y+dy/2);
                    point_x = fin_x + size[0]+1;
                } else  {
                    //left border of screen
                    if (pos.x < 0){
                        fin_x = 0;
                        //popup exceed the right border of screen
                    } else if (x-pos.x > size[0]){
                        fin_x = pos.x; //aligned
                    } else{
                        fin_x = x-delta_x-size[0]; //not aligned
                    }

                    point_x = Math.round(pos.x+dx/2);
                    //when we have a small popup, point need to be rendered at center of popup
                    if (point_x > fin_x + size[0])
                        point_x = fin_x + size[0]/2;
                }

                //if height is not fixed - use default position
                var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
                if ((!size[1] || (y+scrollTop-dy-pos.y-delta_y > size[1])) && mode.pos != "top"){
                    //bottom
                    fin_y = dy+pos.y+delta_y - 4;
                    if (!point_y){
                        point = "top";
                        point_y = fin_y-delta_point;
                    }
                } else {
                    //top
                    fin_y = pos.y-delta_y - size[1];
                    if (fin_y < 0){
                        fin_y = 0;
                        //left|right point can be used, but there is no place for top point
                        if (point == "top") point = false;
                    } else if (!point_y){
                        point = "bottom";
                        fin_y --;
                        point_y = fin_y+size[1]+1;
                    }
                }
                var deltax = (mode.x || 0);
                var deltay = (mode.y || 0);
                this.setPosition(fin_x+deltax, fin_y+deltay);

                if (this._set_point){
                    if (point)
                        this._set_point(point,point_x+deltax, point_y+deltay);
                    else
                        this._hide_point();
                }
            } else {
                var deltax = (mode.x || 0);
                var deltay = (mode.y || 0);

                switch(mode.pos) {
                    case "left":
                        this.setPosition(fin_x - this._last_size[0] + deltax, fin_y + deltay);
                        break;
                    case "top":
                        this.setPosition(fin_x + deltax, fin_y + deltay - this._last_size[1]);
                        break;
                    case "right":
                        this.setPosition(fin_x + deltax + pos.width, fin_y + deltay);
                        break;
                    case "bottom":
                        this.setPosition(fin_x + deltax, fin_y + deltay + pos.height);
                        break;
                    default:
                        break;
                }

                if(this._settings && this._settings.window_point && this._set_window_point ) {
                    point = this._getWindowPoint(point);
                    var window_pos = this._getWindowPos(point, pos, mode, {dy: dy});
                    if (point)
                        this._set_window_point(point, window_pos.point_x, window_pos.point_y);
                    else
                        this._hide_window_point();
                } else {

                }
            }
        } else if (this._settings.position)
            this._setPosition();

        this._viewobj.style.display = "block";
        this._hide_timer = 1;
        webix.delay(function(){ this._hide_timer = 0; }, this, [], (webix.env.touch ? 400 : 100 ));

        this._render_hidden_views();


        if (this.config.autofocus){
            this._prev_focus = webix.UIManager.getFocus();
            webix.UIManager.setFocus(this);
        }

        if (-1 == webix.ui._popups.find(this))
            webix.ui._popups.push(this);

        this.callEvent("onShow",[]);
    },
    _getWindowPos(point, pos, mode, data ) {
        this._utilData(mode);

        var delta_x = 6; var delta_y=6; var delta_point = 6;
        var point_x, point_y;

        switch(point) {
            case "left":
                point_x = pos.x + pos.width + mode.x - delta_x + mode.offset_x;
                point_y = Math.round(pos.y + mode.y + mode.offset_y);
                break;
            case "top":
                point_x = pos.x + mode.x - delta_x + mode.offset_x;
                point_y = Math.round(pos.y + mode.y + mode.offset_y + pos.height - delta_y);
                break;
            case "right":
                point_x = pos.x + mode.x + 1 + mode.offset_x;
                point_y = Math.round(pos.y + mode.y + mode.offset_y);
                break;
            case "bottom":
                point_x = pos.x + mode.x - delta_x + mode.offset_x;
                point_y = Math.round(pos.y + mode.y + mode.offset_y - delta_y);
                break;
            default:
                break;
        }

        return {point_x: point_x, point_y: point_y};
    },
    _utilData(data) {
        if(typeof data.x == "undefined") {
            data.x = 0;
        }
        if(typeof data.y == "undefined") {
            data.y = 0;
        }
        if(typeof data.offset_y == "undefined") {
            data.offset_y = 0;
        }
        if(typeof data.offset_x == "undefined") {
            data.offset_x = 0;
        }
    },
    _getWindowPoint(point) {
        return this._settings.window_point_pos ? this._settings.window_point_pos : point;
    },
    _set_window_point:function(mode, left, top){
        this._hide_window_point();

        var color_css = "blue";
        if(typeof arguments[3] !=  "undefined") {
            color_css = arguments[3];
        }

        var class_value = "webix_point_" + mode;
        class_value = "webix_point_left " + class_value + '_' + color_css;

        document.body.appendChild(this._point_element = webix.html.create("DIV",{ "class":class_value },""));
        this._point_element.style.zIndex = webix.ui.zIndex();
        this._point_element.style.top = top+"px";
        this._point_element.style.left = left+"px";
    },
    _hide_window_point:function(){
        this._point_element = webix.html.remove(this._point_element);
    },
    _hide:function(e){
        //do not hide modal windows
        if (this._settings.hidden || this._settings.modal || this._hide_timer || (e && e.showpopup)) return;
        //do not hide popup, when we have modal layer above the popup
        if (webix._modality && this._settings.zIndex <= webix._modality) return;

        //ignore inside clicks and clicks in child-popups

        if (e){
            var index = webix.env.isIE8 ? e.srcElement.click_view : e.click_view;
            if (!index && index !== 0) index = -1;

            var myindex = webix.ui._popups.find(this);

            if (myindex <= index) return;
        }

        this.hide();
    },
    hidden_setter:function(value){
        if(value)
            this.hide();
        else
            this.show();
        return !!value;
    },
    hide:function(force){
        if (this.$destructed) return;

        if (!force)
            if(this._settings.hidden) return;

        if (this._settings.modal)
            this._modal_set(false);

        if (this._settings.position == "top"){
            webix.animate(this._viewobj, {type: 'slide', x:0, y:-(this._content_height+20), duration: 300,
                callback:this._hide_callback, bind:this});
        }
        else
            this._hide_callback();

        if (this._settings.autofocus){
            var el = document.activeElement;
            //as result of hotkey, we can have a activeElement set to document.body
            if (el && this._viewobj && (this._viewobj.contains(el) || el === document.body)){
                webix.UIManager.setFocus(this._prev_focus);
                this._prev_focus = null;
            }
        }

        this._hide_sub_popups();

        // hide window point
        if(this._settings && this._settings.window_point && this._set_window_point ){
            this._hide_window_point();
        }
    },
    //hide all child-popups
    _hide_sub_popups:function(){
        var order = webix.ui._popups;
        var index = order.find(this);
        var size = order.length - 1;

        if (index > -1)
            for (var i = size; i > index; i--)
                if (order[i]._hide_point)	//hide only popups, skip windows
                    order[i].hide();

        order.removeAt(index);
    },
    destructor: function() {
        this._modal_set(false);
        webix.html.remove(this._viewobj);

        if (this._settings.autofocus){
            if (!webix._final_destruction)
                webix.UIManager.setFocus(this._prev_focus);
            this._prev_focus = null;
        }

        this._hide_sub_popups();
        if (this._hide_point)
            this._hide_point();
        webix.Destruction.destructor.apply(this, []);
    },
    _hide_callback:function(){
        if (!this.$destructed){
            this._viewobj.style.display = "none";
            this._settings.hidden = true;
            this.callEvent("onHide",[]);
        }
    },
    close:function(){
        this.destructor();
    },
    _inner_body_set:function(value){
        value.borderless = true;
    },
    body_setter:function(value){
        if (typeof value != "object")
            value = {template:value };
        this._inner_body_set(value);

        webix._parent_cell = this;
        this._body_cell = webix.ui._view(value);
        this._body_cell._parent_cell = this;

        this._bodyobj.appendChild(this._body_cell._viewobj);
        return value;
    },
    head_setter:function(value){
        if (value === false) return value;
        if (typeof value != "object")
            value = { template:value, padding:0 };

        value.borderless = true;

        webix._parent_cell = this;
        this._head_cell = webix.ui._view(value);
        this._head_cell._parent_cell = this;

        this._headobj.appendChild(this._head_cell._viewobj);
        return value;
    },
    getBody:function(){
        return this._body_cell;
    },
    getHead:function(){
        return this._head_cell;
    },
    adjust:function(){ return this.resize(); },
    resizeChildren:function(){
        if (this._body_cell)
            this.resize();
    },
    resize:function(){
        webix.ui.baseview.prototype.adjust.call(this);
        this._setPosition(this._settings.left, this._settings.top);
    },
    _setPosition:function(x,y){
        if (this._settings.position){
            this.$view.style.position = "fixed";

            var width = this._content_width;
            var height = this._content_height;
            webix.assert(width && height, "Attempt to show not rendered window");

            var maxWidth = (window.innerWidth||document.documentElement.offsetWidth);
            var maxHeight = (window.innerHeight||document.documentElement.offsetHeight);
            var left = Math.round((maxWidth-width)/2);
            var top = Math.round((maxHeight-height)/2);

            if (typeof this._settings.position == "function"){
                var state = { 	left:left, top:top,
                    width:width, height:height,
                    maxWidth:maxWidth, maxHeight:maxHeight };
                this._settings.position.call(this, state);
                if (state.width != width || state.height != height)
                    this.$setSize(state.width, state.height);

                this.setPosition(state.left, state.top);
            } else {
                if (this._settings.position == "top"){
                    if (webix.animate.isSupported())
                        top = -1*height;
                    else
                        top = 10;
                }
                this.setPosition(left, top);
            }

            if (this._settings.position == "top")
                webix.animate(this._viewobj, {type: 'slide', x:0, y:height-((this._settings.padding||0)*2), duration: 300 ,callback:this._topPositionCallback, bind:this});
        } else
            this.setPosition(x,y);
    },
    _topPositionCallback:function(node){
        webix.animate.clear(node);
        this._settings.top=-((this._settings.padding||0)*2);
        this.setPosition(this._settings.left, this._settings.top);
    },
    setPosition:function(x,y){
        this._viewobj.style.top = y+"px";
        this._viewobj.style.left = x+"px";
        this._settings.left = x; this._settings.top=y;
    },
    $getSize:function(dx, dy){
        var _borders = this._settings._inner;
        if (_borders){
            dx += (_borders.left?0:1)+(_borders.right?0:1);
            dy += (_borders.top?0:1)+(_borders.bottom?0:1);
        }
        //line between head and body
        if (this._settings.head)
            dy += 1;

        var size =  this._body_cell.$getSize(0,0);
        if (this._head_cell){
            var head_size = this._head_cell.$getSize(0,0);
            if (head_size[3]==head_size[2])
                this._settings.headHeight = head_size[3];
            dy += this._settings.headHeight;
        }

        if (this._settings.fullscreen){
            var width = window.innerWidth || document.body.clientWidth;
            var height = window.innerHeight || document.body.clientHeight;
            return [width, width, height, height];
        }

        //get layout sizes
        var self_size = webix.ui.view.prototype.$getSize.call(this, 0, 0);

        //use child settings if layout's one was not defined
        self_size[1] = Math.min(self_size[1],(size[1]>=100000&&self_size[1]>=100000?Math.max(size[0], 300):size[1])+dx);
        self_size[3] = Math.min(self_size[3],(size[3]>=100000&&self_size[3]>=100000?Math.max(size[2], 200):size[3])+dy);

        self_size[0] = Math.min(Math.max(self_size[0],size[0] + dx), self_size[1]);
        self_size[2] = Math.min(Math.max(self_size[2],size[2] + dy), self_size[3]);

        return self_size;
    },
    $setSize:function(x,y){
        webix.ui.view.prototype.$setSize.call(this,x,y);
        x = this._content_width;
        y = this._content_height;
        if (this._settings.head === false) {
            this._headobj.style.display="none";
            this._body_cell.$setSize(x,y);
        } else {
            this._head_cell.$setSize(x,this._settings.headHeight);
            this._body_cell.$setSize(x,y-this._settings.headHeight);
        }
    },
    $skin:function(){
        this.defaults.headHeight = webix.skin.$active.barHeight;
    },
    defaults:{
        top:0,
        left:0,
        autofit:true,
        relative:"bottom",
        body:"",
        head:"",
        hidden: true,
        autofocus:true
    }
}, webix.ui.view, webix.Movable, webix.Modality, webix.EventSystem);

module.exports = webix;
