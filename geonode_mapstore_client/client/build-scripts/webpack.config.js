const path = require("path");
const fs = require("fs");

const extractThemesPlugin = require('../MapStore2/build/themes.js').extractThemesPlugin;
const ModuleFederationPlugin = require('../MapStore2/build/moduleFederation').plugin;
const CopyWebpackPlugin = require('copy-webpack-plugin');
const createDevServer = require('./devServer');
const createCopyPatterns = require('./copyPatterns');
const PostBuildPlugin = require('./postBuildPlugin');
const DIST_PATH = require('./distPath');
const projectConfig = require('./projectConfig');

const CLIENT_ROOT = path.join(__dirname, '..');
const FRAMEWORK = path.join(CLIENT_ROOT, "MapStore2", "web", "client");

const appsPath = path.join(CLIENT_ROOT, 'js', 'apps');
const bundles = fs.readdirSync(appsPath, { withFileTypes: true })
    .filter(entry => entry.isFile() && /\.(js|jsx)$/.test(entry.name))
    .reduce((acc, entry) => ({
        ...acc,
        [`js/${entry.name.replace(/\.(js|jsx)$/, '')}`]: path.join(appsPath, entry.name)
    }), {});

const themesPath = path.join(CLIENT_ROOT, 'themes');
const themeEntries = fs.readdirSync(themesPath, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(themesPath, entry.name, 'theme.less')))
    .reduce((acc, entry) => ({
        ...acc,
        [`themes/${entry.name}`]: path.join(themesPath, entry.name, 'theme.less')
    }), {});

const paths = {
    base: CLIENT_ROOT,
    dist: DIST_PATH,
    framework: FRAMEWORK,
    chunks: "js/",
    code: [path.join(CLIENT_ROOT, "js"), FRAMEWORK]
};

function createWebpackConfig({ prod = false, isCompileDev = false } = {}) {
    return require('../MapStore2/build/buildConfig')({
        bundles,
        themeEntries,
        paths,
        plugins: [extractThemesPlugin, ModuleFederationPlugin, new CopyWebpackPlugin(createCopyPatterns(paths)), new PostBuildPlugin()],
        prod,
        ...(prod ? {
            mode: isCompileDev ? 'development' : 'production',
            devtool: isCompileDev ? 'source-map' : false
        } : {}),
        publicPath: createDevServer.PUBLIC_PATH,
        cesiumBaseUrl: `${createDevServer.PUBLIC_PATH}cesium`,
        cssPrefix: `.${projectConfig.themePrefix}`,
        projectConfig: {
            themePath: `${createDevServer.PUBLIC_PATH}themes`,
            themePrefix: projectConfig.themePrefix,
            version: prod ? (isCompileDev ? 'dev-staging' : projectConfig.version) : 'dev'
        },
        prodPlugins: [],
        devServer: createDevServer(),
        alias: {
            "@mapstore/framework": FRAMEWORK,
            "@mapstore/patcher": path.resolve(CLIENT_ROOT, "node_modules", "@mapstore", "patcher"),
            "@mapstore": FRAMEWORK,
            "@js": path.resolve(CLIENT_ROOT, "js")
        }
    });
}

module.exports = (env = {}) => createWebpackConfig({ prod: !!env.prod, isCompileDev: !!env.isCompileDev });
module.exports.createWebpackConfig = createWebpackConfig;
