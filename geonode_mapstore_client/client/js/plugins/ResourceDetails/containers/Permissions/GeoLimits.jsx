/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { createSelector } from "reselect";

import BaseMap from '@mapstore/framework/components/map/BaseMap';
import mapTypeHOC from '@mapstore/framework/components/map/enhancers/mapType';
import LocalDrawSupport from '@mapstore/framework/components/geostory/common/map/LocalDrawSupport';
import FitBounds from '@mapstore/framework/components/geostory/common/map/FitBounds';
import Button from '@mapstore/framework/components/layout/Button';
import Icon from '@mapstore/framework/plugins/ResourcesCatalog/components/Icon';
import Spinner from '@mapstore/framework/components/layout/Spinner';
import Popover from "@mapstore/framework/components/styleeditor/Popover";
import useIsMounted from "@mapstore/framework/hooks/useIsMounted";
import { mapInfoSelector } from "@mapstore/framework/selectors/map";

import { getExtent } from '@js/utils/CoordinatesUtils';
import { getGeoLimits } from "@js/api/geonode/security";
import { getResourceData, getResourceId } from "@js/selectors/resource";
import { resourceToLayers } from '@js/utils/ResourceUtils';

const Map = mapTypeHOC(BaseMap);
Map.displayName = 'Map';

function GeoLimits({
    projection,
    layers,
    features: featuresProp,
    onChange,
    mapType,
    children,
    onRefresh,
    loading
}) {
    const [selectedFeatures, setSelectedFeatures] = useState([]);
    const [features, setFeatures] = useState(featuresProp);
    const [active, setActive] = useState(false);
    const [draw, setDraw] = useState(false);
    const [extent] = useState(getExtent({ layers, features: featuresProp }));

    useEffect(() => {
        setActive(false);
        setTimeout(() => {
            setActive(true);
        });
    }, [draw]);

    function handleUpdate(newFeatures) {
        setFeatures(newFeatures);
        onChange({ features: newFeatures });
    }

    function handleAdd(newFeature) {
        const newFeatures = [
            ...features,
            {
                ...newFeature,
                id: newFeature.properties.id
            }
        ];
        handleUpdate(newFeatures);
    }

    function handleRemove() {
        const newFeatures = features.filter(({ properties }) => !selectedFeatures.includes(properties.id));
        handleUpdate(newFeatures);
    }

    function handleRefresh() {
        onRefresh();
    }

    return (
        <div
            className="gn-geo-limits"
        >
            <Map
                id="gn-geo-limits-map"
                mapType={mapType}
                map={{
                    registerHooks: false,
                    projection
                }}
                styleMap={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%'
                }}
                eventHandlers={{}}
                layers={[ ...layers, { type: 'vector', id: 'v', features }]}
            >
                <LocalDrawSupport
                    active={active}
                    mapType={mapType}
                    features={features}
                    method="Polygon"
                    onChange={(mapId, newFeatures) => {
                        if (!draw) {
                            handleUpdate((newFeatures || []).map((feature) => ({ ...feature, id: feature.properties.id })));
                        }
                    }}
                    options={draw
                        ? {
                            drawEnabled: true,
                            addClickCallback: false,
                            editEnabled: false,
                            selectEnabled: false,
                            featureProjection: 'EPSG:4326',
                            geodesic: false,
                            stopAfterDrawing: false,
                            transformToFeatureCollection: true,
                            translateEnabled: false,
                            useSelectedStyle: true
                        }
                        : {
                            drawEnabled: false,
                            addClickCallback: false,
                            editEnabled: true,
                            selectEnabled: true,
                            featureProjection: 'EPSG:4326',
                            geodesic: false,
                            stopAfterDrawing: false,
                            transformToFeatureCollection: true,
                            translateEnabled: false,
                            useSelectedStyle: true
                        }}
                    onSelectFeatures={(newFeatures) => {
                        const selectedIds = newFeatures
                            .map(({ selected, id }) => selected ? id : null)
                            .filter(selected => selected !== null);
                        setSelectedFeatures(selectedIds);
                    }}
                    onEndDrawing={(collection) => {
                        handleAdd(collection?.features?.[collection?.features?.length - 1] || {});
                    }}
                />
                <FitBounds
                    mapType={mapType}
                    active
                    geometry={extent}
                    duration={300}
                />
            </Map>
            <div  className="gn-geo-limits-tools">
                <Button variant={draw ? 'primary' : 'default'} onClick={() => setDraw(!draw)}>
                    <Icon glyph="pencil"/>
                </Button>
                <Button disabled={draw} onClick={handleRemove}>
                    <Icon glyph="trash"/>
                </Button>
                {children}
                <Button disabled={draw} onClick={handleRefresh}>
                    <Icon glyph="refresh"/>
                </Button>
            </div>
            {loading && <div className="gn-geo-limits-loader">
                <Spinner />
            </div>}
        </div>
    );
}

GeoLimits.propTypes = {
    projection: PropTypes.string,
    layers: PropTypes.array,
    features: PropTypes.array,
    onChange: PropTypes.func,
    mapType: PropTypes.string
};

GeoLimits.defaultProps = {
    projection: 'EPSG:3857',
    layers: [],
    features: [],
    onChange: () => {},
    mapType: 'openlayers'
};

const ConnectedGeoLimits = connect(
    createSelector(
        [getResourceId, mapInfoSelector, getResourceData],
        (resourceId, mapInfo, resource) => ({
            resourceId: resourceId || mapInfo?.id,
            resource
        })
    )
)(({ entry, onUpdate, resourceId, resource }) => {
    const isMounted = useIsMounted();
    const defaultMap = window.overrideNewMapConfig({ map: { layers: [] } });
    const layers = [
        ...(defaultMap?.map?.layers || []),
        ...resourceToLayers(resource)
    ];

    function handleRequestGeoLimits(_entry) {
        if (!_entry.geoLimitsLoading) {
            onUpdate(_entry.id, { geoLimitsLoading: true }, true);
            getGeoLimits(resourceId, _entry.id, _entry.type)
                .then((collection) => {
                    isMounted(() => {
                        onUpdate(_entry.id, {
                            geoLimitsLoading: false,
                            features: collection.features || [],
                            isGeoLimitsChanged: false
                        });
                    });
                })
                .catch(() => {
                    isMounted(() => {
                        onUpdate(_entry.id, {
                            geoLimitsLoading: false,
                            features: [],
                            isGeoLimitsChanged: false
                        });
                    });
                });
        }
    }

    return (
        <Popover
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
                    onChange={(changes) =>
                        onUpdate(entry.id, { ...changes, isGeoLimitsChanged: true })
                    }
                    onRefresh={handleRequestGeoLimits.bind(null, entry)}
                />
            }
        >
            <Button>
                <Icon glyph="globe" />
            </Button>
        </Popover>
    );
});

export default ConnectedGeoLimits;
