const path = require('path');
const fs = require('fs');

const CLIENT_ROOT = path.join(__dirname, '..');

let envConfig = {};
try {
    if (fs.existsSync(path.join(CLIENT_ROOT, '.env'))) {
        envConfig = require('dotenv').config().parsed || {};
    }
} catch (e) {
    envConfig = {};
}

const env = (key, fallback) => envConfig[key] || process.env[key] || fallback;

const STATIC_PREFIX = '/static/mapstore';

const PUBLIC_PATH = `${STATIC_PREFIX}/dist/`;

const BUNDLES = [
    'gn-catalogue',
    'gn-components',
    'gn-dashboard',
    'gn-document',
    'gn-geostory',
    'gn-map'
];

const createDevServer = () => {

    const protocol = env('DEV_SERVER_PROTOCOL', 'http');
    const devServerHost = env('DEV_SERVER_HOSTNAME', 'localhost');
    const devServerPort = env('DEV_SERVER_PORT', '8081');
    const proxyTargetHost = env('DEV_TARGET_GEONODE_HOST', 'localhost:8000');
    // the target can speak a different protocol than the dev server: a remote
    // instance is https while localhost stays http, and forcing the two to
    // match would mean a self signed certificate in front of every session
    const targetProtocol = env('DEV_TARGET_PROTOCOL', protocol);
    // Django answers 400 DisallowedHost to a Host it does not know, and the
    // address the proxy dials is not always one of them: a container reached by
    // ip and port still has to be addressed as the site believes it is called.
    const targetHostHeader = env('DEV_TARGET_HOST_HEADER', proxyTargetHost);
    const standalone = env('DEV_STANDALONE', 'false') === 'true';

    const proxyTargetURL = `${targetProtocol}://${proxyTargetHost}`;
    const devServerURL = `${protocol}://${devServerHost}:${devServerPort}`;

    // In standalone mode nothing is forwarded to GeoNode: index.html and the app
    // static files are served locally, so the client runs with no backend at all.
    const geonodeProxy = standalone ? [] : [
        {
            context: [
                '**',
                `!${PUBLIC_PATH}**`,
                '!/static/mapstore/configs/**',
                '!/static/mapstore/dist/**',
                '!/static/mapstore/gn-translations/**',
                '!/static/mapstore/img/**',
                '!/static/mapstore/ms-translations/**',
                '!/static/mapstore/symbols/**',
                '!/static/mapstore/version.txt',
                '!**/MapStore2/**',
                '!**/node_modules/**',
                '!**/docs/**',
                '!/ws/**'
            ],
            target: proxyTargetURL,
            secure: false,
            changeOrigin: true,
            // the session cookie is what makes the login survive the next call,
            // and it arrives scoped to the target: without these two rewrites
            // the browser drops it and every request after the login is
            // anonymous again. The domain is cleared so it belongs to
            // localhost, and `Secure` is stripped because a cookie marked
            // secure never travels over the plain http of the dev server.
            cookieDomainRewrite: '',
            on: {
                proxyReq: (proxyReq, req) => {
                    proxyReq.path = req.originalUrl;
                },
                proxyRes: (proxyRes) => {
                    const cookies = proxyRes.headers['set-cookie'];
                    if (cookies) {
                        proxyRes.headers['set-cookie'] = cookies.map((cookie) => cookie
                            .replace(/;\s*Secure/gi, '')
                            .replace(/;\s*SameSite=None/gi, '; SameSite=Lax'));
                    }
                }
            },
            headers: {
                // Django compares Origin with the host the site believes it
                // has, so these three have to agree with each other and not
                // with the address the proxy happens to dial: an Origin of
                // `http://172.18.0.5:8000` against a Host of `localhost` fails
                // every unsafe request with "Origin checking failed", which is
                // the logout button doing nothing.
                Host: targetHostHeader,
                Referer: `${targetProtocol}://${targetHostHeader}/`,
                Origin: `${targetProtocol}://${targetHostHeader}`
            }
        }
    ];

    return {
        historyApiFallback: standalone ? { index: '/index.html' } : false,
        devMiddleware: { publicPath: PUBLIC_PATH },
        host: devServerHost,
        port: Number(devServerPort),
        server: protocol === 'https' ? 'https' : 'http',
        hot: true,
        client: {
            logging: 'log',
            overlay: { errors: true, warnings: false }
        },
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        setupMiddlewares: (middlewares, devServer) => {
            const hashRegex = /\.[a-zA-Z0-9]{8,}\.js/;
            devServer.app.use((req, _res, next) => {
                if (BUNDLES.some((name) => req.url.indexOf(name) !== -1)) {
                    req.url = req.url.replace(hashRegex, '.js');
                    req.originalUrl = req.originalUrl.replace(hashRegex, '.js');
                }
                if (req.url.indexOf(proxyTargetURL) !== -1) {
                    req.url = req.url.replace(proxyTargetURL, '');
                    req.originalUrl = req.originalUrl.replace(proxyTargetURL, '');
                }
                next();
            });
            return middlewares;
        },
        proxy: [
            ...geonodeProxy,
            {
                context: [
                    '/static/mapstore/ms-translations/**',
                    '/docs/**',
                    '/static/mapstore/dist/js/web-ifc/**'
                ],
                target: devServerURL,
                secure: false,
                changeOrigin: true,
                pathRewrite: {
                    '/static/mapstore/ms-translations': '/node_modules/mapstore/web/client/translations',
                    '/static/mapstore/dist/js/web-ifc': '/node_modules/web-ifc'
                }
            }
        ],
        "static": [{
            directory: CLIENT_ROOT,
            watch: {
                ignored: [
                    '**/web/target/**',
                    '**/logs/**',
                    '**/*.log',
                    '**/node_modules/**',
                    '**/.git/**'
                ]
            }
        }, {
            directory: path.join(CLIENT_ROOT, '..', 'static', 'mapstore'),
            publicPath: STATIC_PREFIX,
            watch: false
        }]
    };
};

module.exports = createDevServer;
module.exports.STATIC_PREFIX = STATIC_PREFIX;
module.exports.PUBLIC_PATH = PUBLIC_PATH;
