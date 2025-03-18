const path = require('path');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  entry: {
    vendor: ['semantic-ui-react'],
    app: './src/index.js'
  },
  output: {
    // We want to create the JavaScript bundles under a 
    // 'static' directory
    filename: 'static/[name].[hash].js',
    // Absolute path to the desired output directory. In our 
    //case a directory named 'dist'
    // '__dirname' is a Node variable that gives us the absolute
    // path to our current directory. Then with 'path.resolve' we 
    // join directories
    // Webpack 4 assumes your output path will be './dist' so you 
    // can just leave this
    // entry out.
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },
  // Change to production source maps
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.css$/,
          use: [
            {
              // We configure 'MiniCssExtractPlugin'              
              loader: MiniCssExtractPlugin.loader,
            },       
            {
              loader: 'css-loader',
              options: {
                modules: true,
                // Allows to configure how many loaders 
                // before css-loader should be applied
                // to @import(ed) resources
                importLoaders: 1,
                localsConvention: 'camelCase',
// Create source maps for CSS files
                sourceMap: true
              }
            },
            {
              // PostCSS will run before css-loader and will 
              // minify and autoprefix our CSS rules.
              loader: 'postcss-loader',
            }
          ]

      }
    ]
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true
        },        
        vendor: {
          chunks: 'initial',
          test: 'vendor',
          name: 'vendor',
          enforce: true
        }
      }
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'public/index.html',
      favicon: 'public/favicon.ico'
    }),
    
    // Create the stylesheet under 'styles' directory
    new MiniCssExtractPlugin({
      filename: 'styles/styles.[hash].css',
    })
  ]
};