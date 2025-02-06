import axios from '@mapstore/framework/libs/ajax';
import isEmpty from "lodash/isEmpty";
import trim from 'lodash/trim';
/**
* @module utils/FileUtils
*/

/**
* Generates a blob path for a resource
* @param {string} downloadURL remote path to a resource
* @param {string} type type of the file to be converted to default application/json
* @return {string} Object url to view resource in browser
*/
export const getFileFromDownload = (downloadURL, type = 'application/pdf') => {
    const resolve = (data) => {
        const file = new Blob([data], {type});
        const fileURL = URL.createObjectURL(file);
        return fileURL;
    };
    // try a direct request
    return fetch(downloadURL)
        .then(res => res.blob())
        .then((data) => resolve(data))
        // if it fails try to use proxy
        .catch(() =>
            axios.get(downloadURL, {
                responseType: 'blob'
            })
                .then(({ data }) => {
                    return resolve(data);
                })
        );
};


// Default Supported resources for MediaViewer
export const imageExtensions = ['jpg', 'jpeg', 'png'];
export const videoExtensions = ['mp4', 'mpg', 'avi', 'm4v', 'mp2', '3gp', 'flv', 'vdo', 'afl', 'mpga', 'webm'];
export const audioExtensions = ['mp3', 'wav', 'ogg'];
export const gltfExtensions = ['glb', 'gltf'];
export const ifcExtensions = ['ifc'];
export const spreedsheetExtensions = ['csv', 'xls', 'xlsx'];

/**
* check if a resource extension is supported for display in the media viewer
* @param {string} extension extension of the resource accessed on resource.extenstion
* @return {string} pdf image video unsupported
*/
export const determineResourceType = extension => {
    if (extension === 'pdf') return 'pdf';
    if (imageExtensions.includes(extension)) return 'image';
    if (videoExtensions.includes(extension)) return 'video';
    if (gltfExtensions.includes(extension)) return 'gltf';
    if (ifcExtensions.includes(extension)) return 'ifc';
    if (ifcExtensions.includes(extension)) return 'ifc';
    if (audioExtensions.includes(extension)) return 'video';
    if (spreedsheetExtensions.includes(extension)) return 'excel';
    return 'unsupported';
};

export const getFileNameParts = (file) => {
    const { name } = file;
    const nameParts = name.split('.');
    const ext = nameParts[nameParts.length - 1];
    const baseName = [...nameParts].splice(0, nameParts.length - 1).join('.');
    return { ext: ext.toLowerCase(), baseName };
};

/**
 * Get file type from file.
 * In cases where the file type is application/json (which happens when file was originally .geojson converted to .json)
 * We return json as file type
 */
export const getFileType = (file) => {
    const { type } = file;
    if (type === 'application/json') {
        return 'json';
    }
    return type;
};

/**
 * Get file name and extension parts from the valid url string
 * @param {string} url
 * @return {Object} name and extension object
 */
export const getFileNameAndExtensionFromUrl = (url) => {
    let fileName = '';
    let ext = '';
    if (isEmpty(url)) {
        return { fileName, ext };
    }
    const parts = url?.split('?')?.[0]?.split('#')?.[0]?.split('/');
    const parsedName = parts?.pop();
    const period = parsedName?.lastIndexOf('.');
    const hasExtension = period !== -1;
    fileName = hasExtension ? parsedName.substring(0, period) : parsedName;
    ext = hasExtension ? parsedName.substring(period + 1) : "";
    return { fileName, ext: !isEmpty(ext) ? "." + ext : ext };
};
/**
 * Get file name from Content-Disposition header
 * @param {string} contentDisposition
 * @return {string}
 */
export const getFilenameFromContentDispositionHeader = (contentDisposition) => {
    if ((contentDisposition || '').includes('attachment')) {
        // regex from https://stackoverflow.com/a/23054920
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition) || [];
        return trim(trim(matches?.[1] || '', '"'), "'");
    }
    return '';
};

/**
 * Identify the delimiter used in a CSV string
 * Based on https://github.com/Inist-CNRS/node-csv-string
 * @param {string} input
 * @returns {string} delimiter
 */
export const detectCSVDelimiter = (input) => {
    const separators = [',', ';', '|', '\t'];
    const idx = separators
        .map((separator) => input.indexOf(separator))
        .reduce((prev, cur) =>
            prev === -1 || (cur !== -1 && cur < prev) ? cur : prev
        );
    return input[idx] || ',';
};

export const parseCSVToArray = (response) => {
    if (isEmpty(response)) return [];
    const delimiter = detectCSVDelimiter(response);
    return response?.split('\n')?.map(row => row?.split(delimiter)) ?? [];
};
