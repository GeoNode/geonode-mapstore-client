const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const UNUSED_OUTPUT_DIRECTORIES = [
    'bootstrap',
    'react-nouislider',
    'web-ifc',
    'MapStore2',
    'node_modules'
];

class CleanupPlugin {

    constructor(directories = UNUSED_OUTPUT_DIRECTORIES) {
        this.directories = directories;
    }

    apply(compiler) {
        compiler.hooks.afterEmit.tap('CleanupPlugin', (compilation) => {
            const outputPath = compilation.getPath(compiler.outputPath);

            // Move web-ifc from outputPath to outputPath/js/web-ifc
            const webIfcSrc = path.join(outputPath, 'web-ifc');
            const webIfcDest = path.join(outputPath, 'js', 'web-ifc');
            if (fs.existsSync(webIfcSrc)) {
                fs.rmSync(webIfcDest, { recursive: true, force: true });
                fs.mkdirSync(path.dirname(webIfcDest), { recursive: true });
                fs.renameSync(webIfcSrc, webIfcDest);
            }

            // Remove unused directories
            this.directories.forEach((directory) => {
                const dirPath = path.join(outputPath, directory);
                if (fs.existsSync(dirPath)) {
                    fs.rmSync(dirPath, { recursive: true, force: true });
                }
            });

            // Update version.txt in client and static/mapstore
            const clientRoot = path.join(__dirname, '..');
            const staticPath = path.join(clientRoot, '..', 'static', 'mapstore');
            try {
                const packageJSON = require(path.join(clientRoot, 'package.json'));
                let commit = '';
                try {
                    commit = childProcess.execSync('git rev-parse HEAD').toString().trim();
                } catch (e) {
                    commit = '';
                }
                const versionString = `${packageJSON.name}-v${packageJSON.version}-${commit}`;
                fs.writeFileSync(path.resolve(clientRoot, 'version.txt'), versionString);
                fs.writeFileSync(path.resolve(staticPath, 'version.txt'), versionString);
            } catch (e) {
                console.error('Error updating version.txt:', e);
            }
        });
    }
}

module.exports = CleanupPlugin;
module.exports.UNUSED_OUTPUT_DIRECTORIES = UNUSED_OUTPUT_DIRECTORIES;
