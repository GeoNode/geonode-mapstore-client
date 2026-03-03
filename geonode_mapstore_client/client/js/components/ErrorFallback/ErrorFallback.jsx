/*
* Copyright 2020, GeoSolutions Sas.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree.
*/

import React from 'react';
import PropTypes from 'prop-types';
import Message from '@mapstore/framework/components/I18N/Message';
import { Button, Glyphicon } from 'react-bootstrap';
/*
customization of error fallback for geonode
*/
function ErrorFallback({
    error
}) {
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
            }}
        >
            <div>
                <h1 title={
                    error.message + '\n' +
                    error.stack
                }><Message msgId="errorPage.title"/></h1>
                <p><Message msgId="errorPage.subtitle"/></p>
                <Button
                    className="square-button"
                    onClick={() => {
                        window.location.reload();
                    }}
                >
                    <Glyphicon
                        glyph="refresh"
                    />
                </Button>
            </div>
        </div>
    );
}

ErrorFallback.propTypes = {
    error: PropTypes.object
};

ErrorFallback.defaultProps = {
    error: {}
};

export default ErrorFallback;
