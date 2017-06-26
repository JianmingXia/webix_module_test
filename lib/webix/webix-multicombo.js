import default_skin from "./webix-multicombo.scss";

require("./webix-checksuggest");
var webix = require("./webix-richselect");

webix.protoUI({
    name:"multicombo",
    $cssName:"text",
    defaults:{
        keepText: true,
        separator:",",
        icon: false,
        iconWidth: 0,
        tagMode: true,
        tagDelete: true,
        tagTemplate: function(values){
            return (values.length?values.length+" item(s)":"");
        },
        template:function(obj,common){
            return common._render_value_block(obj, common);
        }
    },
    $init:function(){
        this.$view.className += this._addSkinCss("webix_multicombo") + " webix_multicombo";

        this.attachEvent("onBlur", webix.bind(function(){
            var value = this.getInputNode().value;
            if(value && this._settings.newValues){
                this._addNewValue(value);
            }

            this._inputValue = "";
            this.refresh();
        },this));

        this.attachEvent("onBeforeRender",function(){
            if(!this._inputHeight)
                this._inputHeight = webix.skin.$active.inputHeight;
            return true;
        });
        this.attachEvent("onAfterRender", function(){
            this._last_size = null;
        });

        this._renderCount = 0;
    },

    on_click: {
        "webix_multicombo_delete": function(e,view,node){
            var value;
            if(node && (value = node.parentNode.getAttribute("value")))
                this._removeValue(value);
            return false;
        }
    },
    _removeValue: function(value){
        var values = this._settings.value;
        if(typeof values == "string")
            values = values.split(this._settings.separator);
        values = webix.toArray(webix.copy(values));
        values.remove(value);

        this.setValue(values.join(this._settings.separator));
    },
    _addValue: function(newValue){
        var suggest = webix.$$(this.config.suggest);
        var list = suggest.getList();
        var item = list.getItem(newValue);

        if(item){
            var values = suggest.getValue();
            if(values && typeof values == "string")
                values = values.split(suggest.config.separator);
            values = webix.toArray(values||[]);
            if(values.find(newValue)<0){
                values.push(newValue);
                suggest.setValue(values);
                this.setValue(suggest.getValue());
            }
        }
    },

    _addNewValue: function(value){
        var suggest = webix.$$(this.config.suggest);
        var list = suggest.getList();
        if(!list.exists(value) && value.replace(/^\s+|\s+$/g,'')){
            list.add({id: value, value: value});
        }

        this._addValue(value);
    },
    _suggest_config:function(value){
        var isObj = !webix.isArray(value) && typeof value == "object" && !value.name,
            suggest = { view:"checksuggest", separator:this.config.separator, buttonText: this.config.buttonText, button: this.config.button },
            combo = this;

        if (this._settings.optionWidth)
            suggest.width = this._settings.optionWidth;

        if (isObj)
            webix.extend(suggest, value, true);

        var view = webix.ui(suggest);
        if(!this._settings.optionWidth)
            view.$customWidth = function(node){
                this.config.width = combo._get_input_width(combo._settings);
            };
        view.attachEvent("onBeforeShow",function(node,mode, point){
            if(this._settings.master){
                this.setValue(webix.$$(this._settings.master).config.value);

                if(webix.$$(this._settings.master).getInputNode().value){
                    this.getList().refresh();
                    this._dont_unfilter = true;
                }
                else
                    this.getList().filter();

                if(node.tagName && node.tagName.toLowerCase() == "input"){
                    webix.ui.popup.prototype.show.apply(this, [node.parentNode,mode, point]);
                    return false;
                }
            }

        });
        var list = view.getList();
        if (typeof value == "string")
            list.load(value);
        else if (!isObj)
            list.parse(value);

        return view;
    },
    _render_value_block:function(obj, common){
        var id, input, inputAlign,inputValue, inputWidth,
            height, html, label, list, message, padding,  width,
            bottomLabel = "",
            placeholder = obj.placeholder||"",
            top =  this._settings.labelPosition == "top";

        top = this._settings.labelPosition == "top";
        id = "x"+webix.uid();
        width = common._get_input_width(obj);
        inputAlign = obj.inputAlign || "left";

        height = this._inputHeight - 2*webix.skin.$active.inputPadding -2;

        inputValue = (this._inputValue||"");
        list = "<ul class='webix_multicombo_listbox' style='line-height:"+height+"px'></ul>";

        inputWidth = Math.min(width,(common._inputWidth||150));

        if(!obj.value && !this._inputValue){
            inputWidth = width;
        }

        input = "<input id='"+id+"' type='text' placeholder='"+placeholder+"' class='" + this._addSkinCss("webix_multicombo_input") + " webix_multicombo_input' style='width: "+inputWidth+"px;height:"+height+"px;max-width:"+width+"px' value='"+inputValue+"'/>";
        html = "<div class='" + this._addSkinCss("webix_inp_static") + " webix_inp_static' tabindex='0' onclick='' style='line-height:"+height+"px;width: " + width + "px;  text-align: " + inputAlign + ";height:auto' >"+list+input +"</div>";


        label = common.$renderLabel(obj,id);

        padding = this._settings.awidth - width - webix.skin.$active.inputPadding*2;
        message = (obj.invalid ? obj.invalidMessage : "") || obj.bottomLabel;
        if (message)
            bottomLabel =  "<div class='webix_inp_bottom_label' style='width:"+width+"px;margin-left:"+Math.max(padding,webix.skin.$active.inputPadding)+"px;'>"+message+"</div>";

        if (top)
            return label+"<div class='webix_el_box' style='width:"+this._settings.awidth+"px; '>"+html+bottomLabel+"</div>";
        else
            return "<div class='webix_el_box' style='width:"+this._settings.awidth+"px; min-height:"+this._settings.aheight+"px;'>"+label+html+bottomLabel+"</div>";
    },
    _getValueListBox: function(){
        return this._getBox().getElementsByTagName("UL")[0];
    },

    _set_inner_size: function(){
        var popup = this.getPopup();
        if(popup){

            var textArr = (popup ? popup.setValue(this._settings.value) : null);
            if(popup._toMultiValue)
                this._settings.value = popup._toMultiValue(this._settings.value);
            var html = "";
            var listbox = this._getValueListBox();
            var text = textArr && textArr.length;
            if(text){
                var height = this._inputHeight - 2*webix.skin.$active.inputPadding - 8;
                var values = this._settings.value;
                if(typeof values == "string")
                    values = values.split(this._settings.separator);

                if(this._settings.tagMode){
                    for(var i=0; i < textArr.length;i++){
                        var content = "<span>"+textArr[i]+"</span>"+(this._settings.tagDelete?"<span class='webix_multicombo_delete'>x</span>":"");
                        html += "<li class='webix_multicombo_value' style='line-height:"+height+"px;' value='"+ values[i]+"'>"+content+"</li>";
                    }
                }
                else{
                    html += "<li class='webix_multicombo_tag' style='line-height:"+height+"px;'>"+this._settings.tagTemplate(values)+"</li>";
                }

            }
            listbox.innerHTML = html;
            // reset placeholder
            if(this._settings.placeholder){
                if(text){
                    // this.getInputNode().placeholder = "";
                    if(!this.getInputNode().value && this.getInputNode().offsetWidth > 150)
                        this.getInputNode().style.width = "150px";
                }
            }
        }
        this._resizeToContent();
    },
    _focusAtEnd: function(inputEl){
        inputEl = inputEl||this.getInputNode();
        if (inputEl){
            if(inputEl.value.length){
                if (inputEl.createTextRange){
                    var FieldRange = inputEl.createTextRange();
                    FieldRange.moveStart('character',inputEl.value.length);
                    FieldRange.collapse();
                    FieldRange.select();
                }else if (inputEl.selectionStart || inputEl.selectionStart == '0') {
                    var elemLen = inputEl.value.length;
                    inputEl.selectionStart = elemLen;
                    inputEl.selectionEnd = elemLen;
                    inputEl.focus();
                }
            }else{
                inputEl.focus();
            }
        }
    },
    _resizeToContent: function(){
        var top = this._settings.labelPosition == "top";
        var inputDiv = this._getInputDiv();
        var inputHeight = Math.max(inputDiv.offsetHeight+ 2*webix.skin.$active.inputPadding, this._inputHeight);

        if(top)
            inputHeight += this._labelTopHeight;

        inputHeight += this._settings.bottomPadding ||0;

        var sizes = this.$getSize(0,0);

        if(inputHeight != sizes[2]){
            var cHeight = inputDiv.offsetHeight + (top?this._labelTopHeight:0);

            // workaround for potential rendering loop
            if(cHeight == this._calcHeight)
                this._renderCount++;
            else
                this._renderCount = 0;

            if(this._renderCount > 10)
                return false;

            this._calcHeight = cHeight;

            var topView =this.getTopParentView();
            clearTimeout(topView._template_resize_timer);
            topView._template_resize_timer = webix.delay(function(){
                this.config.height = this._calcHeight + 2*webix.skin.$active.inputPadding;
                this.resize();

                if(this._typing){
                    this._focusAtEnd(this.getInputNode());
                    this._typing = false;
                }
                if(this._enter){
                    if(!this._settings.keepText)
                        this.getInputNode().value = "";
                    else
                        this.getInputNode().select();
                    this._enter = false;
                }
                if(this.getPopup().isVisible()||this._typing){
                    this.getPopup().show(this._getInputDiv());
                }

            }, this);
        }
        if(this._enter){
            this.getInputNode().select();
        }
    },
    _getInputDiv: function(){
        var parentNode = this._getBox();
        var nodes = parentNode.childNodes;
        for(var i=0; i < nodes.length; i++){
            if(nodes[i].className && nodes[i].className.indexOf("webix_inp_static")!=-1)
                return nodes[i];
        }
        return parentNode;
    },
    getInputNode: function(){
        return this._getBox().getElementsByTagName("INPUT")[0];
    },
    $setValue:function(){
        this._set_inner_size();
    },
    getValue:function(){
        var value = this._settings.value;
        return (value && typeof value != "string"?value.join(this._settings.separator):value);
    },
    $setSize:function(x,y){
        var config = this._settings;
        if(webix.ui.view.prototype.$setSize.call(this,x,y)){
            if (!x || !y) return;
            if (config.labelPosition == "top"){
                config.labelWidth = 0;
            }
            this.render();
        }
    },
    _calcInputWidth: function(value){
        var tmp = document.createElement("span");
        tmp.className = this._addSkinCss("webix_multicombo_input") + " webix_multicombo_input";
        tmp.style.visibility = "visible";
        tmp.style.height = "0px";
        tmp.innerHTML = value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        document.body.appendChild(tmp);
        var width = tmp.offsetWidth+150;
        document.body.removeChild(tmp);
        return width;
    },

    _init_onchange:function(){
        // input focus and focus styling
        webix.event(this._getBox(),"click",function(){
            this.getInputNode().focus();
        },{bind:this, id: this._get_event_id("click")});
        webix.event(this.getInputNode(),"focus",function(){
            if(this._getBox().className.indexOf("webix_focused") == -1)
                this._getBox().className += " webix_focused";

        },{bind:this, id: this._get_event_id("focus")});
        webix.event(this.getInputNode(),"blur",function(){
            this._getBox().className = this._getBox().className.replace(" webix_focused","");
        },{bind:this, id: this._get_event_id("blur")});

        // resize
        webix.event(this.getInputNode(),"keyup",function(e){
            var inp = this.getInputNode();
            var width;
            e = (e||event);
            // to show placeholder
            if(this._settings.placeholder && !this._settings.value && !inp.value)
                width = this._get_input_width(this._settings);
            else
                width = this._calcInputWidth(inp.value);

            inp.style.width = width +"px";

            if(width!=this._inputWidth){
                if(this._settings.keepText || e.keyCode !=13){
                    this._inputValue = inp.value;
                }
                else{
                    this._inputValue = false;
                }
                this._typing = true;

                if(this._inputWidth)
                    this.getPopup().show(this._getInputDiv());

                this._inputWidth = width;
                this._resizeToContent();
            }
            else if(this._windowHeight != this.getPopup().$height){
                this.getPopup().show(this._getInputDiv());
            }
        },{bind:this, id: this._get_event_id("keyup")});

        // remove the last value on Backspace click
        webix.event(this.getInputNode(),"input",function(e){
            if(!this.getInputNode().value && this._inputValue){
                this.getInputNode().style.width = "150px";
                this._inputWidth = 150;

                this._inputValue = "";
                this._typing = true;

                this.getPopup().show(this._getInputDiv());
                this._resizeToContent();
            }
            this._enter = false;
            if (this.isVisible()){
                e = (e||event);
                var node = this._getValueListBox().lastChild;
                this._windowHeight = this.getPopup().$height;
                if(e.keyCode == 8 && node){
                    if(!this.getInputNode().value && ((new Date()).valueOf() - (this._backspaceTime||0) > 800)){
                        this._typing = true;
                        this._removeValue(node.getAttribute("value"));
                    }
                    else{
                        this._backspaceTime = (new Date()).valueOf();
                    }
                }

                if(e.keyCode == 13 || e.keyCode == 9){
                    var input = this.getInputNode();
                    var id = "";
                    var suggest = webix.$$(this._settings.suggest);
                    var list = suggest.getList();
                    // if no selected options

                    if(!list.getSelectedId()){
                        if (input.value)
                            id = suggest.getSuggestion();

                        if(this._settings.newValues){
                            if(e.keyCode == 13)
                                this._enter = true;
                            this._addNewValue(input.value);
                        }
                        else if(id){
                            if(e.keyCode == 9){
                                this._typing = false;
                                this._inputValue = "";
                                this._inputWidth = 10;
                                input.value = "";
                                this._addValue(id);
                            }
                            else{
                                this._enter = true;
                                this._addValue(id);
                                if(this._settings.keepText)
                                    this._inputValue = input.value;
                                else
                                    input.value = "";
                            }
                        }

                    }
                    if(e.keyCode == 13){
                        this._enter = true;
                        this._typing = true;
                    }

                }
            }
        },{bind:this, id:this._get_event_id("input")});
        webix.$$(this._settings.suggest).linkInput(this);
    }
}, webix.ui.richselect);

module.exports = webix;