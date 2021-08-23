const rimraf = require('rimraf');
const childProcess = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const message = require('@mapstore/project/scripts/utils/message');
const info = require('@mapstore/project/scripts/utils/info');
const { commit, version, name } = info();

const appDirectory = fs.realpathSync(process.cwd());
const staticPath = '../static/mapstore';
const distDirectory = 'dist';
rimraf.sync(path.resolve(appDirectory, staticPath));
message.title('cleaned static/mapstore/ directory');
fs.moveSync(path.resolve(appDirectory, distDirectory, 'static', 'mapstore'), path.resolve(appDirectory, staticPath), { overwrite: true });
fs.moveSync(path.resolve(appDirectory, distDirectory, 'ms-translations'), path.resolve(appDirectory, staticPath, 'ms-translations'), { overwrite: true });
fs.moveSync(path.resolve(appDirectory, distDirectory), path.resolve(appDirectory, staticPath, distDirectory), { overwrite: true });
fs.renameSync(path.resolve(appDirectory, staticPath, 'translations'), path.resolve(appDirectory, staticPath + 'gn-translations'));
fs.writeFileSync(path.resolve(appDirectory, 'version.txt'), `${name}-v${version}-${commit}`);
fs.writeFileSync(path.resolve(appDirectory, staticPath, 'version.txt'), `${name}-v${version}-${commit}`);
message.title(`updated version -> version ${version} - commit ${commit}`);

const packageJSONPath = './package.json';
const rootPackageJSONPath = '../../package.json';

// copy dependencies to root package

const packageJSON = require(packageJSONPath);
const rootPackageJSON = require(rootPackageJSONPath);

const mapStoreCommit = childProcess
    .execSync('git rev-parse @:./MapStore2')
    .toString().trim();

const mapStorePackage = `git+https://github.com/geosolutions-it/MapStore2.git#${mapStoreCommit}`;

rootPackageJSON.dependencies = JSON.parse(JSON.stringify(packageJSON.dependencies));
rootPackageJSON.dependencies.mapstore = mapStorePackage;

fs.writeFileSync(rootPackageJSONPath, JSON.stringify(rootPackageJSON, null, 2), 'utf8');
