// trim out what you don't need
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const webpack = require('webpack')
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');
const { BytenodeWebpackPlugin } = require( '@herberttn/bytenode-webpack-plugin');

// const { config } = require('dotenv')
// config()

// const isProduction = process.env.NODE_ENV === 'production'

module.exports = (env) => {
  const stylesHandler = env.isProduction ? MiniCssExtractPlugin.loader : 'style-loader'
  
  /** @type {import('webpack').Configuration} */
  const config = {
    mode: env.isProduction ? 'production' : 'none',
    entry: {
      user: path.resolve(__dirname, `src/local/desktop/renderer/user/index.tsx`),
      dialog: path.resolve(__dirname, `src/local/desktop/renderer/dialog/index.tsx`),
      assistant: path.resolve(__dirname, `src/local/desktop/renderer/openai-assistant/index.tsx`)
    },
    output: {
      path: path.resolve(__dirname, path.join('bundle', env.output)),
      // publicPath: '/',
      filename: '[name]_[contenthash].js'
    },
    // cause an error in dev server
    target: 'electron-renderer',
    plugins: [
      new HtmlWebpackPlugin({
        template: 'src/local/desktop/renderer/user/index.html',
        filename: 'user.html',
        chunks : ['user']
      }),
      new HtmlWebpackPlugin({
        template: 'src/local/desktop/renderer/dialog/index.html',
        filename: 'dialog.html',
        chunks : ['dialog']
      }),
      new HtmlWebpackPlugin({
        template: 'src/local/desktop/renderer/openai-assistant/index.html',
        filename: 'openai-assistant.html',
        chunks : ['assistant']
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'public',
            globOptions: {
              // glob pattern
              ignore: ['**/*.html']
            }
          },
          {
            from: 'src/local/desktop/renderer/user/user.css',
            to: '[name][ext]',
            toType: 'template',
          },
          {
            from: 'src/local/desktop/renderer/dialog/dialog.css',
            to: '[name][ext]',
            toType: 'template',
          },
          {
            from: 'src/local/desktop/renderer/openai-assistant/assistant.css',
            to: '[name][ext]',
            toType: 'template',
          }
        ]
      }),
      // new BytenodeWebpackPlugin({
      //   compileForElectron: true
      // })
      // Add your plugins here
      // Learn more about plugins from https://webpack.js.org/configuration/plugins/
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
      modules: ['src', 'node_modules']
      // fallback : {
      //   "crypto": require.resolve('crypto-browserify'),
      // }
      // alias: {
      //   '@Home': path.resolve(__dirname, 'src/views/home/')
      // }
    },
    
  }

  if (env.isProduction) {
    config.plugins.push(new WebpackObfuscator({
      compact: true,
      controlFlowFlattening: false,
      deadCodeInjection: false,
      debugProtection: false,
      debugProtectionInterval: 0,
      disableConsoleOutput: true,
      identifierNamesGenerator: 'hexadecimal',
      log: false,
      numbersToExpressions: false,
      renameGlobals: false,
      selfDefending: true,
      simplify: true,
      splitStrings: false,
      stringArray: true,
      stringArrayCallsTransform: false,
      stringArrayEncoding: [],
      stringArrayIndexShift: true,
      stringArrayRotate: true,
      stringArrayShuffle: true,
      stringArrayWrappersCount: 1,
      stringArrayWrappersChainedCalls: true,
      stringArrayWrappersParametersMaxCount: 2,
      stringArrayWrappersType: 'variable',
      stringArrayThreshold: 0.75,
      unicodeEscapeSequence: false
    }, []))

    config.plugins.push(new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: '[id].[hash].css'
    }))

    config.plugins.push(new BytenodeWebpackPlugin({
        compileForElectron: true
    }))
  } else {
    config.plugins.push(      
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(env.nodeEnv || 'development')
      })
    )
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
