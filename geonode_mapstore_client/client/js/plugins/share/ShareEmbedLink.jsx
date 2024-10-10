/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState } from 'react';
import { Checkbox } from 'react-bootstrap';
import SharePageLink from './SharePageLink';
import Message from '@mapstore/framework/components/I18N/Message';

function ShareEmbedLink({
    embedUrl,
    label
}) {
    const [includeFullscreen, setIncludeFullscreen] = useState(false);
    const getEmbedSnippet = () => {
        return [
            '<iframe',
            includeFullscreen ? 'allow="fullscreen"' : '',
            'width="560"',
            'height="315"',
            `src="${embedUrl}${includeFullscreen ? '?allowFullscreen=true' : ''}"`,
            'frameborder="0"',
            '></iframe>'
        ].filter(value => value).join(' ');
    };
    return (
        <SharePageLink value={getEmbedSnippet()} label={label} >
            <Checkbox checked={includeFullscreen} onChange={(event) => setIncludeFullscreen(!!event.target.checked )}>
                <Message msgId="gnviewer.includeFullscreen" />
            </Checkbox>
        </SharePageLink>
    );
}

export default ShareEmbedLink;
