const path = require('path');
const fs = require('fs');

module.exports = (devServerDefault, projectConfig) => {

    const appDirectory = projectConfig.appDirectory;
    const envPath = path.resolve(appDirectory, 'env.json');
    const envJson = fs.existsSync(envPath) ? require(envPath) : {};
    const packageJSON = require(path.resolve(appDirectory, 'package.json')) || {};
    const geoNodeProjectConfig = packageJSON.geonode || {};
    const devServerOptions = geoNodeProjectConfig.devServer || {};
    const devServerHost = devServerOptions.host || envJson.DEV_SERVER_HOST || 'localhost';
    const proxyTargetHost = devServerOptions.proxyTargetHost || envJson.DEV_SERVER_PROXY_TARGET_HOST || 'localhost:8000';
    const protocol = devServerOptions.protocol || envJson.DEV_SERVER_HOST_PROTOCOL || 'http';

    const proxyTargetURL = `${protocol}://${proxyTargetHost}`;

    return {
        clientLogLevel: 'debug',
        https: protocol === 'https' ? true : false,
        host: devServerHost,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        contentBase: [
            path.join(appDirectory)
        ],
        before: function(app) {
            const hashRegex = /\.[a-zA-Z0-9]{1,}\.js/;
            app.use(function(req, res, next) {
                // remove hash from requests to use the local js
                const appsName = [
                    ...(projectConfig.apps || [])
                ]
                    .find(name => req.url.indexOf('/' + name) !== -1 );
                if (appsName) {
                    req.url = req.url.replace(hashRegex, '.js');
                    req.path = req.path.replace(hashRegex, '.js');
                    req.originalUrl = req.originalUrl.replace(hashRegex, '.js');
                }
                if (req.url.matches(proxyTargetURL)) {
                    req.url = req.url.replace(proxyTargetURL, '');
                    req.path = req.path.replace(proxyTargetURL, '');
                    req.originalUrl = req.originalUrl.replace(proxyTargetURL, '');
                }
                next();
            });
        },
        proxy: [
            {
                context: [
                    '**',
                    '!**/static/mapstore/**',
                    '!**/MapStore2/**',
                    '!**/node_modules/**',
                    '!**/docs/**'
                ],
                target: proxyTargetURL,
                headers: {
                    Host: proxyTargetHost,
                    Referer: `${proxyTargetURL}/`
                }
            },
            {
                context: [
                    '/static/mapstore/ms-translations/**',
                    '/static/mapstore/gn-translations/**',
                    '/docs/**'
                ],
                target: `${protocol}://${devServerHost}:8081`,
                secure: false,
                changeOrigin: true,
                pathRewrite: {
                    '/static/mapstore/ms-translations': '/node_modules/mapstore/web/client/translations',
                    '/static/mapstore/gn-translations': '/static/mapstore/translations'
                }
            }
        ]
    };
};
