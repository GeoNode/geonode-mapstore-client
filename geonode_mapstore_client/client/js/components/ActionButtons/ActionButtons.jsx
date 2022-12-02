/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import Dropdown from '@js/components/Dropdown';
import Message from '@mapstore/framework/components/I18N/Message';
import FaIcon from '@js/components/FaIcon';
import { canCopyResource } from '@js/utils/ResourceUtils';

// this is a workaround based on the current structure of actions in card options
// new version will centralize this logic inside the correspondent plugins
const checkAction = {
    'delete': (resource) => !!resource?.perms?.includes('delete_resourcebase'),
    // we assume tha the add_resource check has been checked in parent elements
    'copy': (resource) => canCopyResource(resource, { perms: ['add_resource'] }),
    'download': (resource) => !!(resource?.download_url && resource?.perms?.includes('download_resourcebase'))
};
function ActionButtons({
    options,
    actions,
    onAction,
    resource,
    buildHrefByTemplate,
    onDownload
}) {

    const containerNode = useRef();
    const dropdownClassName = 'gn-card-dropdown';
    const dropdownNode = containerNode?.current?.querySelector(`.${dropdownClassName}`);
    const isDropdownEmpty = (dropdownNode?.children?.length || 0) === 0;

    return (
        <div
            ref={containerNode}
            className="gn-resource-action-buttons"
            onClick={event => event.stopPropagation()}
            style={isDropdownEmpty ? { display: 'none' } : {}}
        >
            <Dropdown className="gn-card-options" pullRight>
                <Dropdown.Toggle
                    id={`gn-card-options-${resource.pk2 || resource.pk}`}
                    variant="default"
                    size="sm"
                    noCaret
                >
                    <FaIcon name="ellipsis-v" />
                </Dropdown.Toggle>
                <Dropdown.Menu className={dropdownClassName}>
                    {options.map((opt) => {
                        if ((opt.type === 'button' && actions[opt.action]) || opt.action === 'download') {
                            const checkFunc = checkAction[opt.action];
                            return (!checkFunc || checkFunc(resource))
                                ? (<Dropdown.Item
                                    key={opt.action}
                                    onClick={() =>
                                        opt.action !== 'download' ? onAction(actions[opt.action], [
                                            resource
                                        ]) : onDownload(resource)
                                    }
                                >
                                    <FaIcon name={opt.icon} />{' '}
                                    <Message msgId={opt.labelId} />
                                </Dropdown.Item>)
                                : null;
                        }

                        return (
                            <Dropdown.Item
                                key={opt.href}
                                href={buildHrefByTemplate(resource, opt.href)}
                            >
                                <FaIcon name={opt.icon} />{' '}
                                <Message msgId={opt.labelId} />
                            </Dropdown.Item>
                        );
                    })}
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
}

ActionButtons.propTypes = {
    options: PropTypes.array,
    actions: PropTypes.object,
    onAction: PropTypes.func,
    resource: PropTypes.object,
    buildHrefByTemplate: PropTypes.func
};

ActionButtons.defaultProps = {
    options: [],
    actions: {},
    resource: {},
    onAction: () => {},
    buildHrefByTemplate: () => {}
};

export default ActionButtons;
