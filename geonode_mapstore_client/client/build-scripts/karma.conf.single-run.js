const path = require("path");

const CLIENT_ROOT = path.join(__dirname, '..');
const FRAMEWORK = path.join(CLIENT_ROOT, "MapStore2", "web", "client");
const TEST_FILE = 'build-scripts/tests.webpack.js';

module.exports = function karmaConfig(config) {
    const testConfig = require('../MapStore2/build/testConfig')({
        basePath: CLIENT_ROOT,
        files: [
            TEST_FILE,
            { pattern: './js/test-resources/**/*', included: false }
        ],
        path: [path.join(CLIENT_ROOT, "js"), FRAMEWORK],
        testFile: TEST_FILE,
        singleRun: true,
        alias: {
            "@mapstore/framework": FRAMEWORK,
            "@mapstore/patcher": path.resolve(CLIENT_ROOT, "node_modules", "@mapstore", "patcher"),
            "@mapstore": FRAMEWORK,
            "@js": path.resolve(CLIENT_ROOT, "js")
        }
    });
    config.set(testConfig);
};
