const fs = require('fs');
const DIST_PATH = require('./distPath');

if (fs.existsSync(DIST_PATH)) {
    fs.rmSync(DIST_PATH, { recursive: true, force: true });
}
