'use strict';
const path = require('path');
const webpack = require('webpack');
require('es6-promise').polyfill();

function webpackConfig(target, mode) {
  let filename;
  if (target === 'var') {
    filename = `painterro-${require("./package.json").version}.min.js`
  } else if (target === 'var-latest') {
    filename = `painterro.min.js`
    target = 'var'
  } else {
    filename = `painterro.${target}.js`
  }

  let options = {
    mode,
    entry: './js/main.js',
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: filename,
      library: 'Painterro', // export as library
      libraryTarget: target
    },
    module: {
      rules: [
        {
          enforce: "pre",
          test: /\.js$/,
          exclude: /node_modules/,
          loader: "eslint-loader",
          options: {
            fix: true,
          },
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: [/node_modules/],
          options: {
            // sourceType: "module",
            presets: [['@babel/env', { "modules": "commonjs" }]],
          }
        },
        {
          test: /\.css$/,
          use: [
            { loader: "style-loader" },
            { loader: "css-loader" }
          ]
        },
        {
          test: /\.(ttf|woff|woff2|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          loader: "url-loader"
        }
      ]
    },
    stats: {
      colors: true
    },

    devtool: 'source-map',
  }
  
  if (mode === 'development') {
    options = {
      ...options,
      devServer: {
        injectClient: false,
        static: path.join(__dirname, 'build'),
        hot: true,
      },
    }
  }
  return options;
}

const isDevServer = process.argv.find(v => v.includes('serve'));

if (!isDevServer) {
  console.log('Building production');
  module.exports = [
    webpackConfig('var', 'production'),
    webpackConfig('var-latest', 'production'),
    webpackConfig('commonjs2', 'production'),
    webpackConfig('amd', 'production'),
    webpackConfig('umd', 'production')
  ];
} else {
  console.log('Building development');
  module.exports = [webpackConfig('var-latest', 'development')];
}