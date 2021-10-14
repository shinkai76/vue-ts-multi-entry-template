const path = require('path');
const fs = require('fs');
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const resolve = dir => path.join(__dirname, dir);

const sign = process.argv[4] // pc or  m
console.log('sign', sign)
const config = {
    entry: 'main.ts',
    html: 'index.html',
    pagesRoot: path.resolve(__dirname, 'src/pages')
};

const genRoutes = () => {
    const allRoutes = [];

    const findAllRoutes = (source, routes) => {
        const files = fs.readdirSync(source);
        files.forEach(filename => {
            const fullname = path.join(source, filename);
            const stats = fs.statSync(fullname);
            if (!stats.isDirectory()) return;
            if (fs.existsSync(`${fullname}/${config.html}`)) {
                routes.push(fullname);
            } else {
                findAllRoutes(fullname, routes);
            }
        });
    };
    findAllRoutes(config.pagesRoot, allRoutes);
    return allRoutes;
};

const genPages = () => {
    const pages = {};
    genRoutes().forEach(route => {
        const filename = route.slice(config.pagesRoot.length + 1);
        pages[filename] = {
            entry: `${route}/${config.entry}`,
            template: `${route}/${config.html}`,
            filename: 'index.html',
            chunks: ['chunk-vendors', 'chunk-common', sign]
        };
    });
    return pages;
};

const pages = genPages();

// 是否使用gzip
const productionGzip = true
// 需要gzip压缩的文件后缀
const productionGzipExtensions = ['js', 'css']

module.exports = {
    publicPath: './',
    lintOnSave: false,
    filenameHashing: true,
    pages,
    outputDir: 'dist-' + sign,
    devServer: {
        historyApiFallback: true,
    },
    chainWebpack: config => {

        // 配置路径别名
        config.resolve.alias
            .set('@', resolve('src'))
            .set('assets', resolve('src/assets'))
            .set('components', resolve('src/components'))
            .set('utils', resolve('src/utils'))
        config.plugins.delete('named-chunks')

        if (process.env.NODE_ENV !== 'development') {
            // 启用GZip压缩
            productionGzip && new CompressionWebpackPlugin({
                test: new RegExp('\\.(' + productionGzipExtensions.join('|') + ')$'),
                threshold: 8192,
                minRatio: 0.8
            })
        }
    },
    configureWebpack: config => {
        if (process.env.NODE_ENV === 'production') {
            config.output = {
                path: path.join(__dirname, './dist'),
                filename: '[name]/js/[name].[contenthash:8].js',
                publicPath: '/',
                chunkFilename: '[name]/js/[name].[contenthash:8].js'
            };
        }
    }
}
