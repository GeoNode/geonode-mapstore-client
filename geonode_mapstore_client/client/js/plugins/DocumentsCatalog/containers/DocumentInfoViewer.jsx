/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import MediaViewer from '@js/components/MediaViewer';
import Text from '@mapstore/framework/components/layout/Text';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';

const DocumentInfoViewer = (resource) => {
    return (<FlexBox className="gn-document-info-viewer" column gap="sm">
        <Text fontSize="md">{resource?.title}</Text>
        <MediaViewer resource={resource} />
    </FlexBox>);
};

export default DocumentInfoViewer;
