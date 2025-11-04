const path = require('path')
const webpack = require('webpack')
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')
const WebpackObfuscator = require('webpack-obfuscator');
const { BytenodeWebpackPlugin } = require( '@herberttn/bytenode-webpack-plugin');

// const { config } = require('dotenv')
// config()

module.exports = (env) => {
  /** @type {import('webpack').Configuration} */
  const config = ({
    mode: env.isProduction ? 'production' : 'development',
    entry: {
      main : path.resolve(__dirname, `src/local/desktop/main/index.ts`),
      // 'extension-message-handler' : path.resolve(__dirname, `src/${env.output}/main/extension-message-handler.ts`)
    },
    output: {
      path: path.resolve(__dirname, path.join('bundle', env.output)),
      filename: '[name].js'
    },    
    target: 'electron-main',
    plugins: [
      // new webpack.DefinePlugin({
      //   "process.env" : JSON.stringify(process.env)
      // }),
      // This is the important part for onoff to work

      // new BytenodeWebpackPlugin({
      //   compileForElectron: true
      // })
      
      // new webpack.ExternalsPlugin('commonjs', [
      //   '@nut-tree/nut-js',
      //   'tesseract.js',
      //   'sharp'
      //   // 'shared/lib/genie'
      // ])
    ],    
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: ['/node_modules/'],
          loader: 'ts-loader'
        },
        {
          test: /\.node$/,
          use: 'node-loader'
        }
      ]
    },
    devtool: false,
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      modules: ['src', 'node_modules'],    
    },
    optimization: {
      nodeEnv: env.isProduction ? 'production' : 'development',
      // minimizer: [new UglifyJsPlugin()],
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