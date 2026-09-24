/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Dropzone from 'react-dropzone';
import { Glyphicon } from 'react-bootstrap';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import moment from 'moment';

import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import Text from '@mapstore/framework/components/layout/Text';
import Message from '@mapstore/framework/components/I18N/Message';
import HTML from '@mapstore/framework/components/I18N/HTML';
import Button from '@mapstore/framework/components/layout/Button';
import Loader from '@mapstore/framework/components/misc/Loader';
import Spinner from '@mapstore/framework/components/layout/Spinner';
import InputControl from '@mapstore/framework/components/catalog/resources/InputControl';

import { uploadAsset, deleteAsset, getAssetsByPk } from '@js/api/geonode/v2';
import { getFileNameParts } from '@js/utils/FileUtils';
import useIsMounted from '@js/hooks/useIsMounted';
import {
    getMaxParallelUploads,
    getMaxAllowedSizeByResourceType,
    getSupportedDocumentTypes
} from '@js/utils/UploadUtils';

// Make safe call, handling partial success and errors
const safe = (promise) => {
    return promise
        .then(result => ({ status: "fulfilled", value: result }))
        .catch(error => ({ status: "rejected", reason: error }));
};

// Normalize an asset entry returned by GET /resources/<pk>/asset
// into the shape used by this component: { id, title, created, deletable, linkUrl, downloadUrl }
const parseAsset = (asset = {}) => ({
    id: asset.id,
    title: asset.title ?? '',
    created: asset.created,
    deletable: !!asset.deletable,
    linkUrl: get(asset, 'urls.link'),
    downloadUrl: get(asset, 'urls.download_url')
});

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
            files.map((file) => safe(uploadAsset(resourcePk, file)))
        )
            .then((results) => {
                const successfulUploads = results.filter(({ status }) => status === "fulfilled");
                const rejectedUploads = results.filter(({ status }) => status === "rejected");
                const isPartialSuccess = !isEmpty(successfulUploads) && !isEmpty(rejectedUploads);

                // Handle rejected assets & partial success
                if (!isEmpty(rejectedUploads)) {
                    onNotify({
                        title: 'gnviewer.assetUpload',
                        message: `gnviewer.${isPartialSuccess
                            ? 'assetUploadPartialErrorMessage'
                            : 'assetUploadErrorMessage'}`
                    }, isPartialSuccess ? 'warning' : 'error');
                }
                // Handle successful assets
                if (!isEmpty(successfulUploads)) {
                    onAssetsUploaded();
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
    editing: canEdit,
    resource,
    onNotify
}) => {
    const isMounted = useIsMounted();
    const [uploading, setUploading] = useState(false);
    const [assets, setAssets] = useState([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [deletingAsset, setDeletingAsset] = useState(null);

    const fetchAssets = useCallback(() => {
        if (!resource?.pk) {
            return;
        }
        setLoadingAssets(true);
        getAssetsByPk(resource.pk)
            .then((response) => {
                isMounted(() => {
                    setAssets((response ?? []).map(parseAsset));
                    setLoadError(false);
                });
            })
            .catch(() => {
                isMounted(() => setLoadError(true));
            })
            .finally(() => {
                isMounted(() => setLoadingAssets(false));
            });
    }, [resource?.pk]);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    const handleDeleteAsset = useCallback((assetId) => {
        if (!resource?.pk || deletingAsset !== null) return;

        setDeletingAsset(assetId);
        deleteAsset(resource.pk, assetId)
            .then(() => {
                setAssets((prevAssets) => prevAssets.filter(asset => asset.id !== assetId));
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
    }, [onNotify, resource?.pk, deletingAsset]);

    const allowUpload = canEdit && resource?.pk;

    const filteredAssets = filterText.trim()
        ? assets.filter(asset =>
            (asset.title || '').toLowerCase().includes(filterText.trim().toLowerCase()))
        : assets;

    return (
        <FlexBox column gap="md" className="gn-details-assets _padding-tb-md">
            {uploading && <div className="gn-details-assets-loading">
                <Loader size={150} />
            </div>}
            {allowUpload && <FlexBox>
                <AssetUploadWidget
                    uploading={uploading}
                    setUploading={setUploading}
                    onNotify={onNotify}
                    resourcePk={resource.pk}
                    onAssetsUploaded={fetchAssets}
                />
            </FlexBox>}
            <FlexBox centerChildrenVertically gap="sm" className="gn-details-assets-filter">
                <InputControl
                    placeholder="gnviewer.filterAssets"
                    value={filterText}
                    debounceTime={300}
                    onChange={(value) => setFilterText(value)}
                />
                {filterText && <Button onClick={() => setFilterText('')}>
                    <Glyphicon glyph="remove" />
                </Button>}
                {loadingAssets && <Spinner />}
            </FlexBox>
            <FlexBox column className="gn-details-assets-list">
                {loadError ? (
                    <FlexBox column centerChildrenVertically className="gn-details-assets-empty">
                        <Text fontSize="sm" strong>
                            <Message msgId="gnviewer.assetsLoadError" />
                        </Text>
                    </FlexBox>
                ) : isEmpty(filteredAssets) ? (
                    <FlexBox column centerChildrenVertically className="gn-details-assets-empty">
                        <Text fontSize="sm" strong>
                            <Message msgId={filterText ? 'gnviewer.noFilteredAssets' : 'gnviewer.noAssets'} />
                        </Text>
                    </FlexBox>
                ) : (
                    <Text fontSize="sm">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th><Message msgId="gnviewer.name" /></th>
                                    <th><Message msgId="gnviewer.date" /></th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssets.map((asset) => {
                                    const isDeleting = deletingAsset === asset.id;
                                    const showDelete = canEdit && asset.deletable && asset.id;

                                    return (
                                        <tr key={asset.id} className="gn-details-assets-item">
                                            <td>
                                                <FlexBox gap="sm" centerChildrenVertically>
                                                    <Glyphicon glyph="file" />
                                                    {asset.linkUrl ? <a href={asset.linkUrl}>{asset.title}</a> : asset.title}
                                                </FlexBox>
                                            </td>
                                            <td className="gn-details-assets-date">
                                                {asset.created ? moment(asset.created).format('DD/MM/YYYY') : null}
                                            </td>
                                            <td className="gn-details-assets-actions">
                                                {asset.downloadUrl && <Button
                                                    size="sm"
                                                    href={asset.downloadUrl}
                                                    download
                                                    className="gn-details-assets-download"
                                                >
                                                    <Glyphicon glyph="download" />
                                                </Button>}
                                                <Button
                                                    size="sm"
                                                    onClick={() => showDelete && handleDeleteAsset(asset.id)}
                                                    disabled={isDeleting || deletingAsset !== null || !showDelete}
                                                    style={{ visibility: showDelete ? 'visible' : 'hidden' }}
                                                    className="gn-details-assets-delete"
                                                >
                                                    {isDeleting
                                                        ? <Loader className="gn-details-assets-delete-loader" size={12} />
                                                        : <Glyphicon glyph="trash" />}
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </Text>
                )}
            </FlexBox>
        </FlexBox>
    );
};

export default DetailsAssets;
