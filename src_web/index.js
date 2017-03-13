var webix = require("../lib/webix/webix-button");
require("../lib/webix/webix-window");
require("../lib/webix/webix-spacer");
require("../lib/webix/webix-layout");


var button = webix.ui({
    rows: [
        {
            height: 300
        },
        {
            cols:[
                {
                    view:"button",
                    value:"Button",
                    inputWidth:100
                },
                {
                    view:"button",
                    id:"my_button",
                    value:"Button",
                    inputWidth:100
                },
                {
                    view:"button",
                    value:"Button",
                    inputWidth:100
                }
            ]
        }
    ]
});
