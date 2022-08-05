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
import { getResourceTypesInfo } from '@js/utils/ResourceUtils';

const Scene3DViewer = lazy(() => import('@js/components/MediaViewer/Scene3DViewer'));

function UnsupportedViewer() {
    return (
        <MainEventView msgId={'gnhome.noPreview'} icon="file" />
    );
}

const mediaMap = {
    image: MediaComponent,
    video: MediaComponent,
    pdf: PdfViewer,
    gltf: Scene3DViewer,
    pcd: Scene3DViewer,
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
        canPreviewed
    } = resource && (mediaTypes[resource.subtype] || mediaTypes[resource.resource_type]) || {};
    const viewResource = resource?.pk && canPreviewed && canPreviewed(resource);

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
                thumbnail={resource.thumbnail_url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADICAIAAABZHvsFAAAACXBIWXMAAC4jAAAuIwF4pT92AAABiklEQVR42u3SAQ0AAAjDMMC/5+MAAaSVsKyTFHwxEmBoMDQYGgyNocHQYGgwNBgaQ4OhwdBgaDA0hgZDg6HB0GBoDA2GBkODocHQGBoMDYYGQ4OhMTQYGgwNhgZDY2gwNBgaDI2hwdBgaDA0GBpDg6HB0GBoMDSGBkODocHQYGgMDYYGQ4OhwdAYGgwNhgZDg6ExNBgaDA2GBkNjaDA0GBoMDYbG0GBoMDQYGkODocHQYGgwNIYGQ4OhwdBgaAwNhgZDg6HB0BgaDA2GBkODoTE0GBoMDYYGQ2NoMDQYGgwNhsbQYGgwNBgaQ4OhwdBgaDA0hgZDg6HB0GBoDA2GBkODocHQGBoMDYYGQ4OhMTQYGgwNhgZDY2gwNBgaDA2GxtBgaDA0GBoMjaHB0GBoMDSGBkODocHQYGgMDYYGQ4OhwdAYGgwNhgZDg6ExNBgaDA2GBkNjaDA0GBoMDYbG0GBoMDQYGgyNocHQYGgwNIYGQ4OhwdBgaAwNhgZDg6HB0BgaDA2GBkPDbQH4OQSN0W8qegAAAABJRU5ErkJggg=='}
                src={resource.href}
            />
        </Suspense>);
    }
    return (<MainEventView msgId={'gnhome.permissionsMissing'}/>);
};

export default Media;
