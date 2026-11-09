const childProcess = require('child_process');
const { STATIC_PREFIX, PUBLIC_PATH } = require('./devServer');

let commit = '';
try {
    commit = childProcess.execSync('git rev-parse HEAD').toString().trim();
} catch (e) {
    commit = '';
}

module.exports = {
    themePrefix: 'msgapi',
    themePath: `${PUBLIC_PATH}themes`,
    version: commit,
    translationsPath: [
        `${STATIC_PREFIX}/ms-translations`,
        `${STATIC_PREFIX}/gn-translations`
    ],
    localConfigPath: `${STATIC_PREFIX}/configs/localConfig.json`,
    assetsPath: `${PUBLIC_PATH}assets`,
    extensionsRegistry: `${STATIC_PREFIX}/extensions/extensions.json`,
    extensionsFolder: `${STATIC_PREFIX}/extensions/`
};
