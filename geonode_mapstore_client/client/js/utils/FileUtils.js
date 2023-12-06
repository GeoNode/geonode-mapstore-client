import axios from '@mapstore/framework/libs/ajax';
import isEmpty from "lodash/isEmpty";

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
export const gltfExtensions = ['glb', 'gltf'];
export const pcdExtensions = ['pcd'];
export const ifcExtensions = ['ifc'];

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
    if (pcdExtensions.includes(extension)) return 'pcd';
    if (ifcExtensions.includes(extension)) return 'ifc';
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
    const parsedName = url?.split('?')?.[0]?.split('#')?.[0]?.split('/')?.pop();
    const period = parsedName?.lastIndexOf('.');
    fileName = period !== -1 ? parsedName.substring(0, period) : parsedName;
    ext = period !== -1 ? parsedName.substring(period + 1) : "";
    return { fileName, ext: !isEmpty(ext) ? "." + ext : ext };
};
