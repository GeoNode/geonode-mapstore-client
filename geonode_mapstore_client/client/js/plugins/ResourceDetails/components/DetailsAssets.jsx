/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useRef, useCallback } from 'react';
import Dropzone from 'react-dropzone';
import { Glyphicon } from 'react-bootstrap';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import Text from '@mapstore/framework/components/layout/Text';
import Message from '@mapstore/framework/components/I18N/Message';
import HTML from '@mapstore/framework/components/I18N/HTML';
import Button from '@mapstore/framework/components/layout/Button';
import Loader from '@mapstore/framework/components/misc/Loader';

import { uploadAsset, deleteAsset } from '@js/api/geonode/v2';
import { ASSETS, getEndpointUrl } from '@js/api/geonode/v2/constants';
import { getFileNameParts } from '@js/utils/FileUtils';
import {
    getMaxParallelUploads,
    getMaxAllowedSizeByResourceType,
    getSupportedDocumentTypes
} from '@js/utils/UploadUtils';

// Get asset download and link URLs
const getAssetUrls = (assetData = {}) => {
    const { asset_id: assetId, link_id: linkId } = assetData;
    const baseUrl = getEndpointUrl(ASSETS);
    return {
        downloadUrl: assetId ? `${baseUrl}/${assetId}/download` : null,
        linkUrl: linkId ? `${baseUrl}/${linkId}/link` : null
    };
};

// Make safe call, handling partial success and errors
const safe = (promise) => {
    return promise
        .then(result => ({ status: "fulfilled", value: result }))
        .catch(error => ({ status: "rejected", reason: error }));
};

// Extract asset ID from download URL
const extractAssetIdFromUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const match = url.match(/\/assets\/(\d+)\//);
    return match ? parseInt(match[1], 10) : null;
};

const AssetUploadWidget = ({
    resourcePk,
    uploading,
    setUploading,
    onAssetsUploaded,
    onNotify
}) => {
    const dropzoneRef = useRef();

    const allowedDocumentTypes = getSupportedDocumentTypes();
    const maxParallelUploads = getMaxParallelUploads() || 5; // default to 5
    const maxAllowedSize = getMaxAllowedSizeByResourceType() || 100; // default to 100MB

    const validateFiles = useCallback((files) => {
        // Check parallel upload limit
        if (maxParallelUploads && files.length > maxParallelUploads) {
            onNotify({
                title: 'gnviewer.assetUpload',
                message: 'gnviewer.parallelUploadLimit',
                values: { limit: maxParallelUploads }
            }, 'warning');
            return false;
        }

        // Check file size limits
        const isExceedingLimit = files.some(file => {
            const fileSizeMB = file.size / (1024 * 1024);
            return fileSizeMB > maxAllowedSize;
        });

        if (isExceedingLimit) {
            onNotify({
                title: 'gnviewer.assetUpload',
                message: 'gnviewer.exceedingFileMsg',
                values: { limit: maxAllowedSize}
            }, 'warning');
            return false;
        }

        return true;
    }, [maxParallelUploads, maxAllowedSize]);

    const handleFileUpload = useCallback((files) => {
        setUploading(true);

        // Make safe the uploadAsset call, handling partial success and errors
        Promise.all(
            files.map((file) =>
                safe(uploadAsset(resourcePk, file)
                    .then((asset) =>
                        ({...getAssetUrls(asset), title: file.name})
                    ))
            ))
            .then((assets) => {
                let successfulAssets = [];
                let rejectedAssets = [];
                assets.forEach(({ status, value, reason }) =>
                    status === "fulfilled"
                        ? successfulAssets.push(value)
                        : rejectedAssets.push(reason)
                );
                const isPartialSuccess = !isEmpty(successfulAssets) && !isEmpty(rejectedAssets);

                // Handle rejected assets & partial success
                if (!isEmpty(rejectedAssets)) {
                    onNotify({
                        title: 'gnviewer.assetUpload',
                        message: `gnviewer.${isPartialSuccess
                            ? 'assetUploadPartialErrorMessage'
                            : 'assetUploadErrorMessage'}`
                    }, isPartialSuccess ? 'warning' : 'error');
                }
                // Handle successful assets
                if (!isEmpty(successfulAssets)) {
                    onAssetsUploaded(successfulAssets);
                    if (!isPartialSuccess) {
                        onNotify({
                            title: 'gnviewer.assetUpload',
                            message: 'gnviewer.assetUploadSuccessMessage'
                        }, 'success');
                    }
                }
            })
            .finally(() => {
                setUploading(false);
            });
    }, [resourcePk, onNotify, onAssetsUploaded]);

    const handleDrop = (acceptedFiles, fileRejections) => {

        // Handle rejected files (unsupported formats)
        if (!isEmpty(fileRejections)) {
            let unsupportedFormats = [];
            fileRejections.forEach(file => {
                const {ext = ""} = getFileNameParts(file);
                unsupportedFormats.push(ext);
            });
            onNotify({
                title: 'gnviewer.assetUpload',
                message: 'gnviewer.assetUploadUnsupportedFormatError',
                values: { ext: unsupportedFormats.join(', ') }
            }, 'error');
            return;
        }

        // Handle accepted files & validate files before upload
        // to check if the files are supported and within the size limits
        if (!isEmpty(acceptedFiles) && validateFiles(acceptedFiles)) {
            handleFileUpload(acceptedFiles);
        }
    };

    return (
        <div className="gn-details-assets-upload">
            <Dropzone
                ref={dropzoneRef}
                onDrop={handleDrop}
                accept={allowedDocumentTypes.length > 0
                    ? allowedDocumentTypes.map(ext => `.${ext}`).join(',')
                    : undefined
                }
                multiple
                disabled={uploading}
                className="gn-upload-dropzone"
                activeClassName="gn-dropzone-active"
                rejectClassName="gn-dropzone-reject"
            >
                <div className={`gn-upload-area ${uploading ? 'gn-upload-area-disabled' : ''}`}>
                    <Glyphicon glyph="upload" className="gn-upload-area-icon" />
                    <div>
                        <HTML msgId="gnviewer.dragDropAsset" />
                    </div>
                    <Button className="gn-assets-upload-button" size="sm" disabled={uploading}>
                        <Message msgId="gnviewer.browseFile" />
                    </Button>
                    <div className="gn-upload-area-supported-file-types">
                        <Message msgId="gnviewer.supportedFileTypes" />: {allowedDocumentTypes.join(', ')}
                    </div>
                </div>
            </Dropzone>
        </div>
    );
};

const DetailsAssets = ({
    fields,
    editing: canEdit,
    resource,
    onNotify,
    onChange
}) => {
    const [loading, setLoading] = useState(false);
    const [deletingAsset, setDeletingAsset] = useState(null);

    const getValidFields = (_fields) => {
        return (_fields ?? []).filter(field => !field?._showEmptyState);
    };

    const onAssetsUploaded = useCallback((assets) => {
        // Create the asset entry in the format expected by the resource
        const newAssets = assets.map(asset => {
            return {
                url: asset.linkUrl,
                extras: {
                    type: 'asset',
                    deletable: true,
                    content: {
                        title: asset.title,
                        download_url: asset.downloadUrl
                    }
                }
            };
        });

        // Update the resource with the new asset
        const updatedAssets = [...newAssets, ...getValidFields(fields)];
        onChange({ assets: updatedAssets });
    }, [fields, onChange]);

    const handleDeleteAsset = useCallback((assetId, assetIndex) => {
        if (!resource?.pk || deletingAsset !== null) return;

        setDeletingAsset(assetIndex);
        deleteAsset(resource.pk, assetId)
            .then(() => {
                let updatedAssets = getValidFields(fields)
                    .filter((_, index) => index !== assetIndex);
                // add empty state flag to show assets section if no assets are left
                updatedAssets = updatedAssets.length ? updatedAssets : [{_showEmptyState: true}];
                onChange({ assets: updatedAssets });
                onNotify({
                    title: 'gnviewer.assetDelete',
                    message: 'gnviewer.assetDeleteSuccessMessage'
                }, 'success');
            })
            .catch((error) => {
                onNotify({
                    title: 'gnviewer.assetDelete',
                    message: get(error, 'data.detail',
                        get(error, 'originalError.message',
                            'gnviewer.assetDeleteErrorMessage'))
                }, 'error');
            })
            .finally(() => {
                setDeletingAsset(null);
            });
    }, [fields, onChange, resource.pk, deletingAsset]);

    const allowUpload = canEdit && resource?.pk;

    return (
        <FlexBox column gap="md" className="gn-details-assets _padding-tb-md">
            {loading && <div className="gn-details-assets-loading">
                <Loader size={150} />
            </div> }
            <FlexBox column className={`gn-details-assets-list ${!allowUpload ? 'full-height' : ''}`}>
                {fields.map((field, idx) => {
                    if (field?._showEmptyState) {
                        return (
                            <FlexBox
                                key={idx}
                                column
                                centerChildrenVertically
                                className="gn-details-assets-empty"
                            >
                                <Text fontSize="sm" strong>
                                    <Message msgId="gnviewer.noAssets" />
                                </Text>
                            </FlexBox>
                        );
                    }
                    const asset = get(field, 'extras.content', {});
                    const isDeletable = get(field, 'extras.deletable', false);
                    const assetId = extractAssetIdFromUrl(asset.download_url);
                    const isDeleting = deletingAsset === idx;
                    const showDelete = canEdit && isDeletable && assetId;

                    return (
                        <FlexBox
                            gap="sm"
                            centerChildrenVertically
                            component={Text}
                            key={idx}
                            fontSize="sm"
                            classNames={["gn-details-assets-item", "_row"]}
                        >
                            <FlexBox gap="sm" centerChildrenVertically>
                                <Glyphicon glyph="file" />
                                {asset.download_url ? <a
                                    download
                                    href={asset.download_url}
                                >
                                    {asset.title}{' '}<Glyphicon glyph="download" />
                                </a> : asset.title}
                            </FlexBox>
                            <Button
                                size="sm"
                                onClick={() => showDelete && handleDeleteAsset(assetId, idx)}
                                disabled={isDeleting || !!deletingAsset || !showDelete}
                                style={{ visibility: showDelete ? 'visible' : 'hidden' }}
                                className={`gn-details-assets-delete`}
                            >
                                {isDeleting
                                    ? <Loader className="gn-details-assets-delete-loader" size={12} />
                                    : <Glyphicon glyph="trash" />}
                            </Button>
                        </FlexBox>
                    );
                })}
            </FlexBox>
            {allowUpload && <FlexBox>
                <AssetUploadWidget
                    uploading={loading}
                    setUploading={setLoading}
                    onNotify={onNotify}
                    resourcePk={resource.pk}
                    onAssetsUploaded={onAssetsUploaded}
                />
            </FlexBox>}
        </FlexBox>
    );
};

export default DetailsAssets;
