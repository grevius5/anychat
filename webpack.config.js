const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/app.js',
    mode: "development",
    output: {
        path: path.resolve(__dirname, 'public/js'),
        filename: 'app.js'
    },
    plugins: [
        new CopyPlugin([
            { from: 'src/img/*', to: '../img/[name].[ext]' },
        ]),
    ],
};