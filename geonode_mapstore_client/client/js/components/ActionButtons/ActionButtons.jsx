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

function ActionButtons({
    options,
    resource,
    buildHrefByTemplate
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
            <Dropdown className="gn-card-options" pullRight id={`gn-card-options-${resource.pk2 || resource.pk}`}>
                <Dropdown.Toggle
                    variant="default"
                    size="sm"
                    noCaret
                >
                    <FaIcon name="ellipsis-v" />
                </Dropdown.Toggle>
                <Dropdown.Menu className={dropdownClassName}>
                    {options.map((opt) => {
                        if (opt.type === 'plugin') {
                            const { Component } = opt;
                            return <Component key={opt.action} resource={resource}/>;
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
    resource: PropTypes.object,
    buildHrefByTemplate: PropTypes.func
};

ActionButtons.defaultProps = {
    options: [],
    resource: {},
    buildHrefByTemplate: () => {}
};

export default ActionButtons;
