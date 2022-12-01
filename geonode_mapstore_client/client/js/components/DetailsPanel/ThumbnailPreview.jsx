/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect } from 'react';
import FaIcon from '@js/components/FaIcon';

function ThumbnailPreview({
    src,
    style,
    icon,
    ...props
}) {

    const [loading, setLoading] = useState();

    useEffect(() => {
        if (src && !loading) {
            setLoading(true);
        }
    }, [src]);

    return (
        <>
            {!src
                ? <div
                    className="card-img-placeholder"
                    style={{ ...style }}>
                    <FaIcon name={icon} />
                </div>
                : <img
                    {...props}
                    src={src}
                    onLoad={() => setLoading(false)}
                    onError={() => setLoading(false)}
                    style={{
                        ...style,
                        ...(loading && {
                            backgroundColor: 'transparent'
                        })
                    }}
                />
            }
        </>
    );
}

export default ThumbnailPreview;
