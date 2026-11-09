const { createWebpackConfig } = require('./webpack.config');

const isCompileDevMode = process.env.MAPSTORE_COMPILE_DEV === 'true';

module.exports = createWebpackConfig({
    prod: !isCompileDevMode,
    isCompileDev: isCompileDevMode
});
