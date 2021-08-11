/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect, useRef } from 'react';
import Message from '@mapstore/framework/components/I18N/Message';
import { FormControl as FormControlRB, Nav, NavItem } from 'react-bootstrap';
import Popover from '@mapstore/framework/components/styleeditor/Popover';
import Button from '@js/components/Button';
import AddPermissionsEntriesPanel from './AddPermissionsEntriesPanel';
import PermissionsRow from './PermissionsRow';
import FaIcon from '@js/components/FaIcon/FaIcon';
import GeoLimits from './GeoLimits';
import {
    permissionsListsToCompact,
    permissionsCompactToLists
} from '@js/utils/ResourceUtils';
import localizedProps from '@mapstore/framework/components/misc/enhancers/localizedProps';
import { getGeoLimits } from '@js/api/geonode/security';
import Spinner from '@js/components/Spinner';

const FormControl = localizedProps('placeholder')(FormControlRB);

function Permissions({
    compactPermissions = {},
    layers = [],
    onChange = () => {},
    entriesTabs = [],
    options,
    groupOptions,
    defaultGroupOptions,
    enableGeoLimits,
    requestGeoLimits = getGeoLimits,
    resourceId,
    loading
}) {

    const { entries = [], groups = [] } = permissionsCompactToLists(compactPermissions);
    const [activeTab, setActiveTab] = useState(entriesTabs?.[0]?.id || '');
    const [permissionsEntires, setPermissionsEntires] = useState(entries);
    const [permissionsGroups, setPermissionsGroups] = useState(groups);

    const [order, setOrder] = useState([]);
    const [filter, setFilter] = useState('');

    function handleChange(newValues) {
        onChange(permissionsListsToCompact({
            entries: permissionsEntires,
            groups: permissionsGroups,
            ...newValues
        }));
    }

    function handleUpdateGroup(groupId, properties) {
        const newGroups = permissionsGroups.map(group => {
            if (group.id === groupId) {
                return {
                    ...group,
                    ...properties
                };
            }
            return group;
        });
        setPermissionsGroups(newGroups);
        handleChange({ groups: newGroups });
    }

    function handleAddNewEntry(newEntry) {
        const newEntries = [
            ...permissionsEntires,
            {
                ...newEntry,
                permissions: 'view'
            }
        ];
        setPermissionsEntires(newEntries);
        handleChange({ entries: newEntries });
    }

    function handleRemoveEntry(newEntry) {
        const newEntries = permissionsEntires.filter(entry => entry.id !== newEntry.id);
        setPermissionsEntires(newEntries);
        handleChange({ entries: newEntries });
    }

    function handleUpdateEntry(entryId, properties, noCallback) {
        const newEntries = permissionsEntires.map(entry => {
            if (entry.id === entryId) {
                return {
                    ...entry,
                    ...properties
                };
            }
            return entry;
        });
        setPermissionsEntires(newEntries);
        if (!noCallback) {
            handleChange({ entries: newEntries });
        }
    }

    function sortEntries(key) {
        const direction = !order[1];
        setOrder([key, direction]);
        function sortByKey(a, b) {
            const aProperty = (a[key] || '').toLowerCase();
            const bProperty = (b[key] || '').toLowerCase();
            return direction
                ? (aProperty > bProperty ? 1 : -1)
                : (aProperty > bProperty ? -1 : 1);
        }
        setPermissionsEntires(
            [...permissionsEntires]
                .sort(sortByKey)
        );
        setPermissionsGroups(
            [...permissionsGroups]
                .sort(sortByKey)
        );
    }

    useEffect(() => {
        sortEntries(order[1] || 'name');
    }, []);

    const filteredEntries = permissionsEntires
        .filter((entry) => !filter
            || (entry?.name?.toLowerCase()?.includes(filter?.toLowerCase())
            || entry?.permissions?.toLowerCase()?.includes(filter?.toLowerCase())));

    const isMounted = useRef();
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    function handleRequestGeoLimits(entry) {
        if (!entry.geoLimitsLoading) {
            handleUpdateEntry(entry.id, { geoLimitsLoading: true }, true);
            requestGeoLimits(resourceId, entry.id, entry.type)
                .then((collection) => {
                    if (isMounted.current) {
                        handleUpdateEntry(entry.id, {
                            geoLimitsLoading: false,
                            features: collection.features || [],
                            isGeoLimitsChanged: false
                        });
                    }
                })
                .catch(() => {
                    if (isMounted.current) {
                        handleUpdateEntry(entry.id, {
                            geoLimitsLoading: false,
                            features: [],
                            isGeoLimitsChanged: false
                        });
                    }
                });
        }
    }

    return (
        <div className="gn-share-permissions-container">
            <div className="gn-share-permissions-list-head">
                <Popover
                    placement="bottom"
                    content={
                        <div className="gn-add-permissions-entries-container">
                            <Nav bsStyle="tabs" activeKey={activeTab}>
                                {entriesTabs.map((tab) => {
                                    return (
                                        <NavItem
                                            key={tab.id}
                                            eventKey={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                        >
                                            <Message msgId={tab.labelId} />
                                        </NavItem>
                                    );
                                })}
                            </Nav>
                            <div className="gn-add-permissions-entries-body">
                                {entriesTabs
                                    .filter(tab => tab.id === activeTab)
                                    .map(tab => {
                                        return (
                                            <AddPermissionsEntriesPanel
                                                key={tab.id}
                                                request={(params) => tab.request({
                                                    ...params,
                                                    entries: permissionsEntires,
                                                    groups: permissionsGroups
                                                })}
                                                onAdd={handleAddNewEntry}
                                                onRemove={handleRemoveEntry}
                                                responseToEntries={(response) =>
                                                    tab.responseToEntries({ response, entries: permissionsEntires })
                                                }
                                            />
                                        );
                                    })}
                            </div>
                        </div>
                    }>
                    <Button size="sm">
                        <FaIcon name="plus" />{' '}<Message msgId="gnviewer.addPermissionsEntry"/>
                    </Button>
                </Popover>
                <div className="gn-share-filter">
                    <FormControl
                        placeholder="gnviewer.filterByNameOrPermissions"
                        value={filter}
                        onChange={event => setFilter(event.target.value)}
                    />
                    {filter && <Button onClick={() => setFilter('')}>
                        <FaIcon name="times"/>
                    </Button>}
                </div>
                <div className="gn-share-permissions-head">
                    <div className="gn-share-permissions-row">
                        <div className="gn-share-permissions-name">
                            <Button onClick={sortEntries.bind(null, 'name')}>
                                <Message msgId="gnviewer.permissionsName"/>
                                {order[0] === 'name' && <>{' '}<FaIcon name={order[1] ? 'chevron-up' : 'chevron-down'} /></>}
                            </Button>
                        </div>
                        <div className="gn-share-permissions-options">
                            <Button onClick={sortEntries.bind(null, 'permissions')}>
                                <Message msgId="gnviewer.permissions"/>
                                {order[0] === 'permissions' && <>{' '}<FaIcon name={order[1] ? 'chevron-up' : 'chevron-down'} /></>}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <ul className="gn-share-permissions-list">
                <li className="gn-share-permissions-pinned">
                    {permissionsGroups
                        .map((group) => {
                            return (
                                <PermissionsRow
                                    key={group.id}
                                    {...group}
                                    hideIcon
                                    onChange={handleUpdateGroup.bind(null, group.id)}
                                    name={<strong>{<Message msgId={`gnviewer.${group.name}`} />}</strong>}
                                    options={groupOptions[group.name] || defaultGroupOptions}
                                />
                            );
                        })}
                </li>
                {filteredEntries
                    .map((entry, idx) => {
                        return (
                            <li
                                key={entry.id + '-' + idx}
                            >
                                <PermissionsRow
                                    {...entry}
                                    onChange={handleUpdateEntry.bind(null, entry.id)}
                                    options={options}
                                >
                                    {entry.permissions !== 'owner' &&
                                    <>
                                        {enableGeoLimits && <Popover
                                            placement="left"
                                            onOpen={(open) => {
                                                if (open && !entry.features) {
                                                    handleRequestGeoLimits(entry);
                                                }
                                            }}
                                            content={
                                                <GeoLimits
                                                    key={entry.geoLimitsLoading}
                                                    layers={layers}
                                                    features={entry.features}
                                                    loading={entry.geoLimitsLoading}
                                                    onChange={(changes) => handleUpdateEntry(entry.id, { ...changes, isGeoLimitsChanged: true })}
                                                    onRefresh={handleRequestGeoLimits.bind(null, entry)}
                                                />
                                            }>
                                            <Button>
                                                <FaIcon name="globe" />
                                            </Button>
                                        </Popover>}
                                        <Button onClick={handleRemoveEntry.bind(null, entry)}>
                                            <FaIcon name="trash" />
                                        </Button>
                                    </>}
                                </PermissionsRow>
                            </li>
                        );
                    })}
            </ul>
            {(filteredEntries.length === 0) &&
                <div className="gn-permissions-alert">
                    <Message msgId="gnviewer.permissionsEntriesNoResults" />
                </div>
            }
            {loading && (
                <div className="gn-spinner-container">
                    <Spinner />
                </div>
            )}
        </div>
    );
}

export default Permissions;
