/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect, useRef } from 'react';
import Thumbnail from '@mapstore/framework/components/misc/Thumbnail';
import FaIcon from '@js/components/FaIcon';
import Button from '@js/components/Button';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import Message from '@mapstore/framework/components/I18N/Message';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
const ButtonWithToolTip = tooltip(Button);


const ThumbnailEditable = ({
    defaultImage,
    onEdit = () => {}
}) => {
    const thumbnailRef = useRef(null);
    const [thumbnail, setThumbnail] =  useState();
    useEffect(() => {
        setThumbnail(defaultImage);

    }, [defaultImage]);

    const { defaultThumbnailSize } = getConfigProp('geoNodeSettings');
    const { height = 200, width = 240 } = defaultThumbnailSize;

    const handleDialaogWindowUpload = () => {
        thumbnailRef?.current?.nextElementSibling.click();
    };

    return (
        <>
            <Thumbnail
                ref={thumbnailRef}
                thumbnail={thumbnail}
                onUpdate={(data) => {
                    setThumbnail(data);
                    onEdit(data);
                }}
                thumbnailOptions={{
                    contain: false,
                    width,
                    height,
                    type: 'image/png'
                }}
            />
            <ButtonWithToolTip
                variant="default"
                className="upload-thumbnail"
                onClick={ () => handleDialaogWindowUpload()}
                tooltip={  <Message msgId="gnviewer.uploadImage"/>  }
                tooltipPosition={"top"}
            >
                <FaIcon name="upload" />
            </ButtonWithToolTip>
        </>
    );
};

export default ThumbnailEditable;
