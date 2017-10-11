var webix = require("../lib/webix/webix-button");
require("../lib/webix/webix-window");
require("../lib/webix/webix-spacer");
require("../lib/webix/webix-layout");

// var button = webix.ui({
//     cols:[
//         {
//             view:"button",
//             value:"Button",
//             inputWidth:100
//         },
//         {
//             view:"button",
//             id:"my_button",
//             value:"Button",
//             inputWidth:100
//         },
//         {
//             view:"button",
//             value:"Button",
//             inputWidth:100
//         }
//     ]
// });

// 浮于右边
// webix.ui({
//     view:"window",
//     head:"My Window",
//     autofit: false,
//     window_point: true,
//     window_point_pos: "left",
//     body:{
//         template:"Some text"
//     }
// }).show($$("my_button").getNode(),
//     {
//       pos: "right",
//       x: 100
//     }
// );

// 浮于左边
// webix.ui({
//     view:"window",
//     head:"My Window",
//     autofit: false,
//     window_point: true,
//     window_point_pos: "right",
//     body:{
//         template:"Some text"
//     }
// }).show($$("my_button").getNode(),
//     {
//           pos: "left",
//           x: 12
//     }
// );

// 浮于下方
// webix.ui({
//     view:"window",
//     head:"My Window",
//     autofit: false,
//     window_point: true,
//     window_point_pos: "top",
//     body:{
//         template:"Some text"
//     }
// }).show($$("my_button").getNode(),
//     {
//           pos: "bottom",
//           x: 12
//     }
// );

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

// 浮于上方
webix.ui({
    view:"window",
    head:"My Window",
    modal: true,
    autofit: false,
    window_point: true,
    window_point_pos: "bottom",
    body:{
        template:"Some text"
    }
}).show($$("my_button").getNode(),
    {
          pos: "top",
          x: 12,
          y: -10
    }
);
