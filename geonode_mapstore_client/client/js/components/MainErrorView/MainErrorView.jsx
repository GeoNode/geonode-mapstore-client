/*
* Copyright 2020, GeoSolutions Sas.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree.
*/

import React from 'react';
import FaIcon from '@js/components/FaIcon';
import Message from '@mapstore/framework/components/I18N/Message';

function MainErrorView({
    msgId
}) {
    return (
        <div className="gn-main-event-container">
            <div className="gn-main-event-content">
                <div className="gn-main-event-text">
                    <div className="gn-main-icon">
                        <FaIcon name="exclamation"/>
                    </div>
                    {msgId && <Message msgId={msgId} />}
                </div>
            </div>
        </div>
    );
}

MainErrorView.defaultProps = {
    msgId: ''
};

export default MainErrorView;
