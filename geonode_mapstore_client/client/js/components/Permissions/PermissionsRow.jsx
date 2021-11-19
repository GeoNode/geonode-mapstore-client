/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import FaIcon from '@js/components/FaIcon/FaIcon';
import Message from '@mapstore/framework/components/I18N/Message';

function PermissionsRow({
    type,
    name,
    options,
    hideOptions,
    hideIcon,
    permissions,
    avatar,
    children,
    clearable,
    onChange
}) {

    return (
        <div
            className="gn-share-permissions-row"
        >
            {(!hideIcon && (type || avatar)) && <div className="gn-share-permissions-icon">
                {avatar
                    ? <img src={avatar}/>
                    : <FaIcon name={type} />}
            </div>}
            <div className="gn-share-permissions-name">{name}</div>
            <div className="gn-share-permissions-tools">
                {children}
            </div>
            {!hideOptions && <div className="gn-share-permissions-options">
                <Select
                    clearable={clearable}
                    options={options.map(({ value, labelId }) => ({ value, label: <Message msgId={labelId} /> }))}
                    value={permissions}
                    onChange={(option) => onChange({ permissions: option?.value || '' })}
                />
            </div>}
        </div>
    );
}

PermissionsRow.propTypes = {
    options: PropTypes.array,
    clearable: PropTypes.bool,
    onChange: PropTypes.func
};

PermissionsRow.defaultProps = {
    options: [
        {
            value: 'view',
            labelId: 'gnviewer.viewPermission'
        },
        {
            value: 'download',
            labelId: 'gnviewer.downloadPermission'
        },
        {
            value: 'edit',
            labelId: 'gnviewer.editPermission'
        },
        {
            value: 'manage',
            labelId: 'gnviewer.managePermission'
        }
    ],
    clearable: false,
    onChange: () => { }
};

export default PermissionsRow;
