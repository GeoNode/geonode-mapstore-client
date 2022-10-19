/*
* Copyright 2022, GeoSolutions Sas.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree.
*/

import React from 'react';

function MetadataPreview({
    url
}) {
    return (
        <div className="gn-main-event-container">
            <iframe
                frameBorder="0"
                key={url}
                src={url}
                style={{
                    width: '100%',
                    height: '100%'
                }} />
        </div>
    );
}

MetadataPreview.defaultProps = {
    url: ''
};

export default MetadataPreview;
