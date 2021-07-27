/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect } from 'react';
import Thumbnail from '@mapstore/framework/components/misc/Thumbnail';
import FaIcon from '@js/components/FaIcon';
import Message from '@mapstore/framework/components/I18N/Message';

const ThumbnailEditable = ({
    defaultImage,
    onEdit = () => {}
}) => {

    const [thumbnail, setThumbnail] =  useState();
    useEffect(() => {
        setThumbnail(defaultImage);

    }, [ ]);

    return (
        <>
            <Thumbnail
                thumbnail={thumbnail}
                onUpdate={(data) => {
                    setThumbnail(data);
                    onEdit(data);
                }}
                message={<Message msgId="gnviewer.uploadImage"/>}
            />
            <div className={`icon-image-preview`} >
                <FaIcon name="upload" />
            </div>
        </>
    );
};

export default ThumbnailEditable;
