/*
* Copyright 2022, GeoSolutions Sas.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree.
*/

import React from 'react';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';

function MetadataPreview({
    url
}) {
    return (
        <FlexBox column centerChildren classNames={['gn-metadata-preview', '_corner-tl', '_absolute', '_fill']}>
            <iframe
                frameBorder="0"
                key={url}
                src={url}
                style={{
                    width: '100%',
                    height: '100%'
                }} />
        </FlexBox>
    );
}

MetadataPreview.defaultProps = {
    url: ''
};

export default MetadataPreview;
