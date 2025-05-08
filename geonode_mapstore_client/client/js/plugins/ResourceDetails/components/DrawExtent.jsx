/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { useEffect } from 'react';
import VectorSource from "ol/source/Vector";
import Draw, { createBox } from "ol/interaction/Draw";
import { Select, Translate } from "ol/interaction";
import PropTypes from 'prop-types';
import { Fill, Stroke, Style } from "ol/style";
import { click, shiftKeyOnly, singleClick } from "ol/events/condition";
import { reprojectBbox } from '@mapstore/framework/utils/CoordinatesUtils';

const fill = new Fill({ color: "rgba(255, 170, 1, 0.1)" });
const stroke = (color) => new Stroke({ color, width: 2 });
const STYLE = {
    FEATURE: new Style({ fill, stroke: stroke("#ffaa01") }),
    SELECT: new Style({ fill, stroke: stroke("white") })
};

const drawInteraction = new Draw({
    condition: (event) => click(event) && shiftKeyOnly(event),
    source: new VectorSource({wrapX: false}),
    type: 'Circle',
    geometryFunction: createBox(),
    style: STYLE.FEATURE
});
const getFeatureExtent = (evt) => {
    let geometry;
    if (evt.type === 'drawend') {
        const feature = evt.feature.clone();
        geometry = feature.getGeometry();
    } else {
        const features = evt.features.getArray();
        geometry = features.find(ft => ft.getGeometry().getType() === "Polygon")?.getGeometry() || {};
    }
    return geometry.getCoordinates ? geometry.getExtent() : null;
};

const DrawExtext = ({map, onSetExtent, translateInteraction = true} = {}) => {
    useEffect(() => {
        let draw;
        let select;
        let translate;
        if (map) {
            const projection = map.getView().getProjection().getCode();
            draw = drawInteraction;
            draw.on('drawend', (evt) => {
                const extent = getFeatureExtent(evt);
                if (extent) {
                    onSetExtent(reprojectBbox(extent, projection, 'EPSG:4326'));
                }
            });
            map.on('pointermove', function(e) {
                const hasFeature = map.hasFeatureAtPixel(e.pixel);
                map.getViewport().style.cursor = hasFeature && !e.dragging ? 'pointer' : '';
            });
            map.addInteraction(draw);

            if (translateInteraction) {
                select = new Select({
                    multi: true,
                    condition: (event) => singleClick(event)
                });
                select.on('select', function(evt) {
                    evt.selected.forEach(function(ft) {
                        if (ft.getGeometry().getType() === "Polygon") {
                            ft.setStyle(STYLE.SELECT);
                        }
                    });
                    evt.deselected.forEach(function(ft) {
                        if (ft.getGeometry().getType() === "Polygon") {
                            ft.setStyle(STYLE.FEATURE);
                        }
                    });
                });
                translate = new Translate({features: select.getFeatures()});
                translate.on('translateend', (evt) => {
                    const extent = getFeatureExtent(evt);
                    if (extent) {
                        onSetExtent(reprojectBbox(extent, projection, 'EPSG:4326'));
                    }
                    select.getFeatures().clear(); // after translation clear all selected features
                });
                map.addInteraction(select);
                map.addInteraction(translate);
            }
        }
        return () => {
            map.removeInteraction(draw);
            if (translateInteraction) {
                map.removeInteraction(select);
                map.removeInteraction(translate);
            }
        };
    }, []);
    return null;
};

DrawExtext.propTypes = {
    map: PropTypes.object,
    onSetExtent: PropTypes.func,
    translateInteraction: PropTypes.bool
};

DrawExtext.defaultProps = {
    onSetExtent: () => {}
};

export default DrawExtext;
