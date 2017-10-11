require("../lib/webix/webix-tree");
require("../lib/webix/webix-layout");
require("../lib/webix/webix-scrollview");
require("../lib/webix/webix-template");
require("../lib/webix/webix-button");
require("../lib/webix/webix-datatable");
require("../lib/webix/webix-tooltip");

var datatable = webix.ui({
  view: "datatable",
  drag: true,
  select: "row",
  navigation: true,
  onContext: {},
  editable: true,
  editaction: "custom",
  text_overflow_type: "ellipsis",
  tooltip: function (obj, common) {
    debugger;
    if (common.column.id == 'node_name') {
     
    }
    return '';
  },
  columns: [
    { id: "rank", header: "", width: 50 },
    { id: "title", header: "Film title", width: 200 },
    { id: "year", header: "Released", width: 80 },
    { 
      id: "votes", 
      header: "Votes", 
      width: 100,
      template: function(obj) {
        debugger;
        return obj.votes;
      }
    }
  ],
  data: [
    { id: 1, title: "The Shawshank Redemption", year: 1994, votes: 678790, rank: 1 },
    { id: 2, title: "The Godfather", year: 1972, votes: 511495, rank: 2 }
  ]
});

// import Config from './Config/config'

// import IndexSkin from '../lib/web_css/index.scss'
// console.log(IndexSkin);
// console.log(Config);

// debugger;
// var button = webix.ui({
//   view: "button",
//   id: "my_button",
//   value: "Button",
//   type: "form",
//   skin: IndexSkin,
//   inputWidth: 100
// });

// var table_data0 = [
//   {
//     id: "root", value: "Cars", open: true, data: [
//       {
//         id: "1", open: true, value: "Toyota", data: [
//           { id: "1.1", value: "Avalon" },
//           { id: "1.2", value: "Corolla" },
//           { id: "1.3", value: "Camry" }
//         ]
//       },
//       {
//         id: "2", value: "Skoda", open: true, data: [
//           { id: "2.1", value: "Octavia" },
//           { id: "2.2", value: "Superb" }
//         ]
//       }
//     ]
//   }
// ];
// var table_data1 = [
//   {
//     id: "root", value: "Cars", open: true, data: [
//       {
//         id: "1", open: true, value: "Toyota", data: [
//           { id: "1.1", value: "Avalon" },
//           { id: "1.2", value: "Corolla" },
//           { id: "1.3", value: "Camry" }
//         ]
//       },
//       {
//         id: "2", value: "Skoda", open: true, data: [
//           { id: "2.1", value: "Octavia" },
//           { id: "2.2", value: "Superb" }
//         ]
//       }
//     ]
//   }
// ];

// webix.ui({
//   view: "scrollview",
//   scroll: "y", 
//   width: 200,
//   body: {
//     rows: [
//       {
//         view: "tree",
//         select: true,
//         data: table_data0,
//         css: "table_0",
//         scroll: false,
//         autoheight: true,
//         resize_tree_scroll: true
//       },
//       {
//         view: "tree",
//         select: true,
//         data: table_data1,
//         scroll: false
//       }
//     ]
//   }
// });

// var scrollview = webix.ui({
//   view: "scrollview",
//   id: "scrollview",
//   scroll: "y",
//   height: 160,
//   width: 150, body: {
//     rows: [
//       { template: "Lorem ipsum", autoheight: true },
//       { template: "Lorem ipsum dolor sit amet", autoheight: true },
//       { template: "Lorem ipsum dolor", autoheight: true },
//       { template: "Lorem ipsum dolor sit amet, mentitum", autoheight: true },
//       { template: "Lorem ipsum dolor sit", autoheight: true },
//     ]
//   }
// });