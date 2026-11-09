const path = require('path');
const fs = require('fs');

module.exports = (paths) => [
    { from: path.join(paths.framework, 'translations'), to: path.join(paths.dist, '..', 'ms-translations') },
    ...fs.existsSync(path.join(paths.base, 'configs'))
        ? [{ from: path.join(paths.base, 'configs'), to: path.join(paths.dist, 'configs') }]
        : [],
    ...fs.existsSync(path.join(paths.base, 'assets'))
        ? [{ from: path.join(paths.base, 'assets'), to: path.join(paths.dist, 'assets') }]
        : [],
    ...fs.existsSync(path.join(paths.base, 'translations'))
        ? [{ from: path.join(paths.base, 'translations'), to: path.join(paths.dist, 'translations') }]
        : [],
    ...fs.existsSync(path.join(paths.framework, 'libs', 'cesium-navigation'))
        ? [{ from: path.join(paths.framework, 'libs', 'cesium-navigation'), to: path.join(paths.dist, 'libs', 'cesium-navigation') }]
        : []
];
