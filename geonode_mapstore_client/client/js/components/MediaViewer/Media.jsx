/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Suspense, lazy }  from 'react';
import MediaComponent from '@mapstore/framework/components/geostory/media';
import PdfViewer from '@js/components/MediaViewer/PdfViewer';
import { determineResourceType } from '@js/utils/FileUtils';
import Loader from '@mapstore/framework/components/misc/Loader';
import MainEventView from '@js/components/MainEventView';
import { getResourceTypesInfo, getResourceImageSource, isDocumentExternalSource } from '@js/utils/ResourceUtils';
import MetadataPreview from '@js/components/MetadataPreview';

const Scene3DViewer = lazy(() => import('@js/components/MediaViewer/Scene3DViewer'));

function UnsupportedViewer({url = ''}) {
    return (
        <MetadataPreview url={url} />
    );
}

const mediaMap = {
    image: MediaComponent,
    video: MediaComponent,
    pdf: PdfViewer,
    gltf: Scene3DViewer,
    ifc: Scene3DViewer,
    unsupported: UnsupportedViewer
};

const loaderComponent = () => <div className="pdf-loader"><Loader size={70}/></div>;

const mediaDefaultProps = {
    video: {
        mode: "view",
        inView: true,
        fit: 'contain'
    },
    image: {
        fit: "contain",
        enableFullscreen: true,
        loaderComponent
    },
    pdf: {},
    unsupported: {}
};

const Media = ({ resource, ...props }) => {

    const mediaTypes = getResourceTypesInfo();
    const {
        hasPermission, metadataPreviewUrl = () => {}
    } = resource && (mediaTypes[resource.subtype] || mediaTypes[resource.resource_type]) || {};
    const viewResource = resource?.pk && hasPermission && hasPermission(resource);

    if (resource && viewResource) {
        const mediaType = determineResourceType(resource.extension);
        const MediaViewer =  mediaMap[mediaType];
        return (<Suspense fallback={null}>
            <MediaViewer
                mediaType={mediaType}
                {...mediaDefaultProps[mediaType]}
                {...props[mediaType]}
                description={resource.abstract}
                id={resource.pk}
                thumbnail={() => getResourceImageSource(resource?.thumbnail_url)}
                src={resource.href}
                url={resource ? metadataPreviewUrl(resource) : ''}
                isExternalSource={isDocumentExternalSource(resource)}
                bboxPolygon={resource?.ll_bbox_polygon}
            />
        </Suspense>);
    }
    return (<MainEventView msgId={'gnhome.permissionsMissing'}/>);
};

export default Media;
