const path = require('path')
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');
const { BytenodeWebpackPlugin } = require( '@herberttn/bytenode-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = (env) => {
  const stylesHandler = 'style-loader'

  /** @type {import('webpack').Configuration} */
  const config = ({
    /**
     * preload should be always production for tree-shaking
     * otherwise It will includes unnecessary which is electron in preload
     */
    mode: env.isProduction ? 'production' : 'development',
    entry: {
      'ee11cbb19052e40b07aac0ca060c23ee': path.resolve(__dirname, `src/local/desktop/preload/user.ts`),
      '4ae35dbb42614d2429b7d6d181a950bb': path.resolve(__dirname, `src/local/desktop/preload/dialog.ts`),
      '4f642e388f5654bfaf2ea505be8320d1': path.resolve(__dirname, `src/local/desktop/preload/assistant.ts`)
    },
    output: {
      path: path.resolve(__dirname, path.join('bundle', env.output)),
      filename: '[name].js'
    },
    plugins : [
    ],    
    target: ['electron-preload'],
    module: {
      rules: [
        {
          test: /\.m?jsx?/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
              plugins: ['@babel/plugin-proposal-object-rest-spread']
            }
          }
        },      
        {
          test: /\.(ts|tsx)$/i,
          loader: 'ts-loader',
          exclude: ['/node_modules/']
        },
        {
          test: /\.css$/i,
          use: [stylesHandler, 'css-loader']
        }
      ]
    },
    optimization: {
      // minimizer: [new UglifyJsPlugin()],
    },    
    devtool: false,
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      modules: ['src', 'node_modules'],    
    }    
  })
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
    config.plugins.push(new BytenodeWebpackPlugin({
      compileForElectron: true
    }))
  }
  return config
}
