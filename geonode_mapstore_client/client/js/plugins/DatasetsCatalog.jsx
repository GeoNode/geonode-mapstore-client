/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { connect } from 'react-redux';
import { FormControl as FormControlRB, Glyphicon } from 'react-bootstrap';
import { createSelector } from 'reselect';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@js/components/Button';
import ResourceCard from '@js/components/ResourceCard';
import useInfiniteScroll from '@js/hooks/useInfiniteScroll';
import { getDatasets } from '@js/api/geonode/v2';
import FaIcon from '@js/components/FaIcon/FaIcon';
import Spinner from '@js/components/Spinner';
import { resourceToLayerConfig } from '@js/utils/ResourceUtils';
import { addLayer } from '@mapstore/framework/actions/layers';
import { zoomToExtent } from '@mapstore/framework/actions/map';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import Loader from '@mapstore/framework/components/misc/Loader';
import withDebounceOnCallback from '@mapstore/framework/components/misc/enhancers/withDebounceOnCallback';
import { mapLayoutValuesSelector } from '@mapstore/framework/selectors/maplayout';
import localizedProps from '@mapstore/framework/components/misc/enhancers/localizedProps';
const FormControl = localizedProps('placeholder')(FormControlRB);

function InputControl({ onChange, value, ...props }) {
    return <FormControl {...props} value={value} onChange={event => onChange(event.target.value)}/>;
}

const InputControlWithDebounce = withDebounceOnCallback('onChange', 'value')(InputControl);
function DatasetsCatalog({
    request,
    responseToEntries,
    pageSize,
    style,
    placeholderId,
    onAdd,
    onClose,
    onZoomTo
}) {

    const scrollContainer = useRef();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [isNextPageAvailable, setIsNextPageAvailable] = useState(false);
    const [q, setQ] = useState('');
    const isMounted = useRef();

    useInfiniteScroll({
        scrollContainer: scrollContainer.current,
        shouldScroll: () => !loading && isNextPageAvailable,
        onLoad: () => {
            setPage(page + 1);
        }
    });

    const updateRequest = useRef();
    updateRequest.current = (options) => {
        if (!loading && request) {
            if (scrollContainer.current) {
                scrollContainer.current.scrollTop = 0;
            }
            setLoading(true);
            request({
                q,
                page: options.page,
                pageSize
            })
                .then((response) => {
                    if (isMounted.current) {
                        const newEntries = responseToEntries(response);
                        setIsNextPageAvailable(response.isNextPageAvailable);
                        setEntries(options.page === 1 ? newEntries : [...entries, ...newEntries]);
                        setLoading(false);
                    }
                })
                .catch(() => {
                    if (isMounted.current) {
                        setLoading(false);
                    }
                });
        }
    };

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (page > 1) {
            updateRequest.current({ page });
        }
    }, [page]);

    useEffect(() => {
        setPage(1);
        updateRequest.current({ page: 1 });
    }, [q]);

    function handleSelectResource(entry) {
        const layer = resourceToLayerConfig(entry);
        onAdd(layer);
        const { minx, miny, maxx, maxy } = layer?.bbox?.bounds || {};
        const extent = layer?.bbox?.bounds && [ minx, miny, maxx, maxy ];
        if (extent) {
            onZoomTo(extent, layer?.bbox?.crs);
        }
    }

    return (<div
        className="gn-datasets-catalog"
        style={style}
    >
        <div className="gn-datasets-catalog-head">
            <div className="gn-datasets-catalog-title"><Message msgId="gnviewer.datasetsCatalogTitle"/></div>
            <Button className="square-button" onClick={() => onClose()}>
                <Glyphicon glyph="1-close"/>
            </Button>
        </div>
        <div className="gn-datasets-catalog-filter">
            <InputControlWithDebounce
                placeholder={placeholderId}
                value={q}
                debounceTime={300}
                onChange={(value) => setQ(value)}
            />
            {(q && !loading) && <Button onClick={() => setQ('')}>
                <FaIcon name="times"/>
            </Button>}
            {loading && <Spinner />}
        </div>
        <div
            ref={scrollContainer}
            className="gn-datasets-catalog-body"
        >
            <ul className="gn-datasets-catalog-list" >
                {entries.map((entry) => {
                    return (
                        <li key={entry.pk}>
                            <ResourceCard
                                data={entry}
                                readOnly
                                layoutCardsStyle="list"
                                onClick={() => handleSelectResource(entry)}
                            />
                        </li>
                    );
                })}
                {(entries.length === 0 && !loading) &&
                    <div className="gn-datasets-catalog-alert">
                        <Message msgId="gnviewer.datasetsCatalogEntriesNoResults" />
                    </div>
                }
            </ul>
            {loading && <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Loader size={70}/>
            </div>}
        </div>
    </div>);
}

DatasetsCatalog.propTypes = {
    request: PropTypes.func,
    responseToEntries: PropTypes.func,
    pageSize: PropTypes.number,
    onAdd: PropTypes.func,
    placeholderId: PropTypes.string,
    onClose: PropTypes.func,
    onZoomTo: PropTypes.func
};

DatasetsCatalog.defaultProps = {
    request: getDatasets,
    responseToEntries: res => res.resources,
    pageSize: 10,
    onAdd: () => {},
    placeholderId: 'gnviewer.datasetsCatalogFilterPlaceholder',
    onZoomTo: () => {},
    onClose: () => {}
};

function DatasetsCatalogPlugin({ enabled, ...props}) {
    return enabled ? <DatasetsCatalog {...props} /> : null;
}

const ConnectedDatasetsCatalogPlugin = connect(
    createSelector([
        state => mapLayoutValuesSelector(state, { height: true }),
        state => state?.controls?.datasetsCatalog?.enabled
    ], (style, enabled) => ({
        style,
        enabled
    })), {
        onAdd: addLayer,
        onClose: setControlProperty.bind(null, 'datasetsCatalog', 'enabled', false),
        onZoomTo: zoomToExtent
    }
)(DatasetsCatalogPlugin);

const DatasetsCatalogButton = ({
    onClick,
    size
}) => {

    const handleClickButton = () => {
        onClick();
    };

    return (
        <Button
            size={size}
            onClick={handleClickButton}
        >
            <Message msgId="gnviewer.addLayer"/>
        </Button>
    );
};

const ConnectedDatasetsCatalogButton = connect(
    createSelector([], () => ({})),
    {
        onClick: setControlProperty.bind(null, 'datasetsCatalog', 'enabled', true)
    }
)((DatasetsCatalogButton));

export default createPlugin('DatasetsCatalog', {
    component: ConnectedDatasetsCatalogPlugin,
    containers: {
        ActionNavbar: {
            name: 'DatasetsCatalog',
            Component: ConnectedDatasetsCatalogButton
        }
    },
    epics: {},
    reducers: {}
});
