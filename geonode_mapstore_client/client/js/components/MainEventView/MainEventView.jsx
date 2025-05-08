/*
* Copyright 2020, GeoSolutions Sas.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree.
*/

import React from 'react';
import Message from '@mapstore/framework/components/I18N/Message';
import Icon from '@mapstore/framework/plugins/ResourcesCatalog/components/Icon';

function MainEventView({
    msgId,
    icon
}) {
    return (
        <div className="gn-main-event-container">
            <div className="gn-main-event-content">
                <div className="gn-main-event-text">
                    <div className="gn-main-icon">
                        <Icon glyph={icon} />
                    </div>
                    {msgId && <Message msgId={msgId} />}
                </div>
            </div>
        </div>
    );
}

MainEventView.defaultProps = {
    msgId: '',
    icon: 'exclamation'
};

export default MainEventView;
