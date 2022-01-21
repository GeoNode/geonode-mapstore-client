import axios from '@mapstore/framework/libs/ajax';

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
    return axios.get(downloadURL, {
        responseType: 'blob'
    }).then(({data}) => {
        const file = new Blob([data], {type});
        const fileURL = URL.createObjectURL(file);
        return fileURL;
    });
};


// Default Supported resources for MediaViewer
export const imageExtensions = ['jpg', 'jpeg', 'png'];
export const videoExtensions = ['mp4', 'mpg', 'avi', 'm4v', 'mp2', '3gp', 'flv', 'vdo', 'afl', 'mpga', 'webm'];
export const gltfExtensions = ['glb', 'gltf'];
export const pcdExtensions = ['pcd'];

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
    return 'unsupported';
};
