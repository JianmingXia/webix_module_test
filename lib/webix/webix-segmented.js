import default_skin from "./webix-segmented.scss";

var webix = require("./webix-text");

webix.protoUI({
    name:"segmented",
    _allowsClear:false,
    $init:function(){
        this.attachEvent("onChange", function(value){
            if (this._settings.multiview){
                var top = this.getTopParentView();
                var view = null;

                //get from local isolate
                if (top && top.$$)
                    view = top.$$(value);
                //or check globally
                if (!view)
                    view = webix.$$(value);

                if(view && view.show)
                    view.show();
            }
        });
    },
    defaults:{
        template:function(obj, common){
            if(!obj.options)
                webix.assert(false, "segmented: options undefined");
            var options = obj.options;
            common._check_options(options);
            options = common._filterOptions(options);

            var width = common._get_input_width(obj);

            var id = webix.uid();
            var html = "<div style='width:"+width+"px' class='webix_all_segments'>";
            var optionWidth = obj.optionWidth || Math.floor(width/options.length);
            if(!obj.value)
                obj.value = options[0].id;

            for(var i=0; i<options.length; i++){
                html+="<button type='button' style='width:"+(options[i].width || optionWidth)+"px' ";
                html+="class='"+((obj.value==options[i].id)?"webix_selected ":"")+"webix_segment_"+((i==options.length-1)?"N":(i>0?1:0))+"' button_id='"+options[i].id+"' >";
                html+= options[i].value+"</button>";
            }

            return common.$renderInput(obj, html+"</div>", id);
        }
    },
    $setValue:function(value){
        this.refresh();
    },
    getValue:function(){
        return this._settings.value;
    },
    getInputNode:function(){
        return null;
    },
    optionIndex:function(id){
        var pages = this._settings.options;
        for (var i=0; i<pages.length; i++)
            if (pages[i].id == id)
                return i;
        return -1;
    },
    addOption:function(id, value, show, index){
        var obj = id;
        if (typeof id != "object"){
            value = value || id;
            obj = { id:id, value:value };
        } else {
            id = obj.id;
            index = show;
            show = value;
        }

        if (this.optionIndex(id) < 0)
            webix.PowerArray.insertAt.call(this._settings.options, obj, index);

        if (show)
            this.setValue(id);
    },
    removeOption:function(id, value){
        var index = this.optionIndex(id);
        var options = this._settings.options;

        if (index >= 0)
            webix.PowerArray.removeAt.call(options, index);

        // if we remove a selected option
        if(this._settings.value == id)
            this._setNextVisible(options, index);

        this.callEvent("onOptionRemove", [id, this._settings.value]);
        this.refresh();

    },
    _setNextVisible: function(options, index){
        var size = options.length;

        if(size){
            index = Math.min(index, size-1);
            //forward search
            for (var i=index; i<size; i++)
                if (!options[i].hidden)
                    return this.setValue(options[i].id);
            //backward search
            for (var i=index; i>=0; i--)
                if (!options[i].hidden)
                    return this.setValue(options[i].id);
        }

        //nothing found
        this.setValue("");
    },
    _filterOptions: function(options){
        var copy = [];
        for(var i=0; i<options.length;i++)
            if(!options[i].hidden)
                copy.push(options[i]);
        return copy;
    },
    _setOptionVisibility: function(id, state){
        var options = this._settings.options;
        var index = this.optionIndex(id);
        var option = options[index];
        if (option && state == !!option.hidden){  //new state differs from previous one
            option.hidden = !state;
            if (state || this._settings.value != id){ 	//show item, no need for extra steps
                this.refresh();
            } else {									//hide item, switch to next visible one
                this._setNextVisible(options, index);
            }
        }
    },
    hideOption: function(id){
        this._setOptionVisibility(id,false);
    },
    showOption: function(id){
        this._setOptionVisibility(id,true);
    },
    _set_inner_size:false
}, webix.ui.text);

module.exports = webix;