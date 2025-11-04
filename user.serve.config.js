const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const webpack = require('webpack')
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');
// const { config } = require('dotenv')
// config()

// const isProduction = process.env.NODE_ENV === 'production'

module.exports = (env) => {
  const stylesHandler = env.isProduction ? MiniCssExtractPlugin.loader : 'style-loader'
  /** @type {import('webpack').Configuration} */
  const config = {
    mode: env.isProduction ? 'production' : 'none',
    entry: {
      index : path.resolve(__dirname, 'src/local/desktop/renderer/user/serve.tsx'),
    },
    output: {
      path: path.resolve(__dirname, path.join('bundle', 'desktop/user')),
      // publicPath: '/',
      filename: '[name].js'
    },
    // cause an error in dev server
    // target: 'electron-renderer',
    plugins: [
      new HtmlWebpackPlugin({
        template: 'src/local/desktop/renderer/user/index.html',
        filename: 'index.html'
      })
    ],
    module: {
      rules: [
        {
          test: /\.m?jsx?$/,
          exclude: /(node_modules|bower_components)/,
          loader: 'babel-loader'
        },
        {
          test: /\.(ts|tsx)$/i,
          loader: 'ts-loader',
          exclude: ['/node_modules/']
        },
        {
          test: /\.css$/i,
          use: [stylesHandler, 'css-loader']
        },
        {
          test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
          type: 'asset'
        },
        {
          type: 'asset',
          resourceQuery: /url/ // *.svg?url
        },
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          use: ['@svgr/webpack']
        }

        // Add your rules for custom modules here
        // Learn more about loaders from https://webpack.js.org/loaders/
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      modules: ['src', 'node_modules'],
      alias: {
      }
    }
  }

  if (env.isProduction) {
    config.plugins.push(new MiniCssExtractPlugin(), new WebpackObfuscator({ rotateStringArray : true }, []))
  } else {
    config.plugins.push(new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(env.nodeEnv || 'development')
    }))
    // https://webpack.js.org/configuration/devtool/#root
    config.devtool = 'inline-source-map'
    config.devServer = {
      // static: {
      //   directory: path.join(__dirname, 'dist'),
      // },
      historyApiFallback: { index: '/', disableDotRule: true },
      compress: true,
      // HMR
      hot: true,
      open: true,
      host: 'localhost',
      // headers: [
      //   {
      //     key: 'CUSTOM-COOKIE',
      //     value: '1'
      //   }
      // ]
    }
  }
  return config
}