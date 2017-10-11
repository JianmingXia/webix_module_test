var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
var path = require('path');
var version = require('yargs').argv.version || 'trunk';
var environment = require('yargs').argv.environment || 'production';
var publicPath = "";

function make() {
  var global = {
    is_dev: false,
    is_production: false,
  };

  switch (environment) {
    case 'dev':
      {
        global["is_dev"] = true;
        publicPath = 'http://127.0.0.1:12304/' + version + '/';
        break;
      }
    default:
      {
        global["is_production"] = true;
        publicPath = 'https://cdnt.quqi.com/' + version + '/';
        break;
      }
  }

  var entry = {
    app: "./src_web/index.js",
    vendor: [
      "lodash"
    ]
  };

  var plugins = [
    new webpack.ProvidePlugin({
      _: "lodash"
    }),
    new ExtractTextPlugin('css/[contenthash].css', {
      allChunks: true
    }),
    new HtmlWebpackPlugin({
      template: './src_web/index.html',
      favicon: './src_web/favicon.ico',
      faviconPath: publicPath + 'favicon.ico',
    }),
    new webpack.DefinePlugin({
      IS_PRODUCTION: JSON.stringify(global.is_production),
      IS_DEV: JSON.stringify(global.is_dev)
    }),
    new webpack.optimize.CommonsChunkPlugin("vendor", "vendor.bundle.js")
  ];

  var webpack_config = {

    entry: entry,

    output: {
      filename: 'module.[hash].js',
      path: path.resolve('./dist_web/' + version + '/'),
      publicPath: publicPath,
      libraryTarget: 'umd'
    },

    module: {
      loaders: [{
        test: /\.js$/,
        loader: 'babel-loader?optional[]=runtime&stage=0',
        exclude: /(node_modules|bower_components|spread|file_saver)/
      }, {
        test: /(((.*)webix(.*))|((.*)Gcspread(.*))|((.*)ueditor(.*))|((.*)pdfjs(.*))|((.*)f7message(.*)))\.scss$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader!autoprefixer-loader?{browsers:["last 2 version", "ie >= 10"]}!sass-loader', {
          publicPath: '../'
        })
      }, {
        test: /(.*)web_css(.*)\.scss$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader?modules&importLoaders=2&localIdentName=[name]__[local]___[hash:base64:5]!autoprefixer-loader?{browsers:["last 2 version", "ie >= 10"]}!sass-loader', {
          publicPath: '../'
        })
      }, {
        test: /\.html$/,
        loader: 'html'
      }, {
        test: /\.jade$/,
        loader: "jade-loader?self"
      }, {
        test: /\.(woff|woff2|eot|ttf|svg|png|gif)$/,
        loader: 'url-loader?limit=10000&name=[path][name]_[hash:base64:5].[ext]'
      }]
    },
    resolve: {
      alias: {
        lodash: "lodash/lodash.min.js"
      }
    },
    plugins: plugins
  };

  if (global.is_dev) {
    webpack_config.devtool = 'source-map';
  }

  return webpack_config;
}
module.exports = make();
