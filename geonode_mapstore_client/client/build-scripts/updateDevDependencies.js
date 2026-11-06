const denodeify = require('denodeify');
const fs = require('fs');
const path = require('path');

const writeFile = denodeify(fs.writeFile);

const CLIENT_ROOT = path.join(__dirname, '..');
const PROJECT_PACKAGE = path.join(CLIENT_ROOT, 'package.json');
const FRAMEWORK_PACKAGE = path.join(CLIENT_ROOT, 'MapStore2', 'package.json');

const updateProjectDevDependencies = () => {
    process.stdout.write('Updating devDependencies in package.json...\n');
    const projPackageJSON = require(PROJECT_PACKAGE);
    const ms2PackageJSON = require(FRAMEWORK_PACKAGE);
    const packageJSON = {
        ...projPackageJSON,
        devDependencies: {
            ...projPackageJSON.devDependencies,
            ...ms2PackageJSON.devDependencies
        }
    };
    return writeFile(PROJECT_PACKAGE, JSON.stringify(packageJSON, null, 2) + '\n');
};

updateProjectDevDependencies().then(() => {
    process.stdout.write('devDependencies update OK!\n');
    process.exit();
})
    .catch((err) => {
        process.stdout.write('Error updating devDependencies\n');
        process.stderr.write(err + '\n');
    });
