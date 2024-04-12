const rimraf = require('rimraf');
const fs = require('fs-extra');
const path = require('path');
const message = require('@mapstore/project/scripts/utils/message');
const info = require('@mapstore/project/scripts/utils/info');
const { commit, version, name } = info();

const appDirectory = fs.realpathSync(process.cwd());
const staticPath = '../static/mapstore';
const distDirectory = 'dist';

// remove unused compiled directories
['bootstrap', 'ms-configs'].forEach(directoryName => {
    const directoryPath = path.resolve(appDirectory, distDirectory, directoryName);
    rimraf.sync(directoryPath);
    message.title(`removed ${directoryPath}`);
});

// copy compiled files
fs.moveSync(path.resolve(appDirectory, distDirectory, 'web-ifc'), path.resolve(appDirectory, distDirectory, 'js', 'web-ifc'));
message.title('copy ifc files in dist folder');
fs.moveSync(path.resolve(appDirectory, distDirectory, 'ms-translations'), path.resolve(appDirectory, staticPath, 'ms-translations'), { overwrite: true });
message.title('copy ms-translations from MapStore Core');
fs.moveSync(path.resolve(appDirectory, distDirectory), path.resolve(appDirectory, staticPath, distDirectory), { overwrite: true });
message.title('copy dist folder to static/mapstore directory');


// create new version file
const versionString = `${name}-v${version}-${commit}`;
fs.writeFileSync(path.resolve(appDirectory, 'version.txt'), versionString);
fs.writeFileSync(path.resolve(appDirectory, staticPath, 'version.txt'), versionString);
message.title(`updated version -> version ${version} - commit ${commit}`);
