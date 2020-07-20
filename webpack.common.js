/* eslint-disable */
const path = require('path');
const fs = require('fs');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RemovePlugin = require('remove-files-webpack-plugin');

const getHash = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const hash = getHash();


function generateHtmlPlugins(templateDir) {
  const templateFiles = fs.readdirSync(path.resolve(__dirname, templateDir));
  return templateFiles.map(item => {
    const parts = item.split('.');
    const name = parts[0];
    const extension = parts[1];
    return new HtmlWebpackPlugin({
      filename: `${name}.html`,
      template: `!!ejs-webpack-loader!${templateDir}/${name}.${extension}`,
      data: {hash},
      inject: false,
    })
  })
}

const getJsFiles = (jsDir) => {
  const files = {}
  fs.readdirSync(path.resolve(__dirname, jsDir)).forEach(el => files[el.split('.')[0]] = `${jsDir}/${el}`);
  return files
}

const getScssFiles = (scssDir) => {
  const files = {}
  fs.readdirSync(path.resolve(__dirname, scssDir)).forEach(el => files[el] = `${scssDir}/${el}`);
  return files
}

console.log({
  ...getJsFiles('./src/js'),
  ...getScssFiles('./src/styles'),
})

const htmlPlugins = generateHtmlPlugins('./src/templates/views');


module.exports = {
  entry: {
    ...getJsFiles('./src/js'),
    ...getScssFiles('./src/styles'),
  },
  output: {
    filename: `js/[name].${hash}.js`,
    path: path.resolve(__dirname, 'docs/'),
  },
  module: {
    rules: [
      {
        test: /\.(sass|scss)$/,
        include: path.resolve(__dirname, 'src/styles'),
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              url: false,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              sourceMap: true,
              plugins: () => [
                require('cssnano')({
                  preset: [
                    'default',
                    {
                      discardComments: {
                        removeAll: true,
                      },
                    },
                  ],
                }),
                require('autoprefixer')()
              ],
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.ejs$/,
        use: [
          {
            loader: "ejs-webpack-loader",
          }
        ]
      }
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: `styles/[name].${hash}.css`,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: './src/fonts',
          to: './fonts',
        },
        {
          from: './src/img',
          to: './img',
        },
      ],
    }),
    new RemovePlugin({
    after: {
      test: [
        {
          folder: './docs/js',
          method: (absPath) => new RegExp(/(.*).scss.(.*).js/).test(absPath)
        }
      ]
    }
  })
  ].concat(htmlPlugins),
};
