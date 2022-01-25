/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseMap from '@mapstore/framework/components/map/BaseMap';
import mapTypeHOC from '@mapstore/framework/components/map/enhancers/mapType';
import LocalDrawSupport from '@mapstore/framework/components/geostory/common/map/LocalDrawSupport';
import FitBounds from '@mapstore/framework/components/geostory/common/map/FitBounds';
import Button from '@js/components/Button';
import FaIcon from '@js/components/FaIcon';
import Spinner from '@js/components/Spinner';
import { getExtent } from '@js/utils/CoordinatesUtils';

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
                    <FaIcon name="pencil"/>
                </Button>
                <Button disabled={draw} onClick={handleRemove}>
                    <FaIcon name="trash"/>
                </Button>
                {children}
                <Button disabled={draw} onClick={handleRefresh}>
                    <FaIcon name="refresh"/>
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

export default GeoLimits;
