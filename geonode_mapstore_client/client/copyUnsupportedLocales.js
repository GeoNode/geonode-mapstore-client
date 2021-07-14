// copyfile.js
const fs = require('fs');

// destination will be created or overwritten by default.

const unsupportedTranslationsPath = "./static/mapstore/unsupported_translations/";
const mapStoreTranslationPath = "./node_modules/mapstore/web/client/translations/";
const files = fs.readdirSync(unsupportedTranslationsPath);


files.forEach((file) => {
    fs.copyFile(`${unsupportedTranslationsPath}${file}`, `${mapStoreTranslationPath}${file}`, (err) => {
        if (err) throw err;
        console.log(`File ${file} from ${unsupportedTranslationsPath} was copied to destination ${mapStoreTranslationPath}`);
    });
});


