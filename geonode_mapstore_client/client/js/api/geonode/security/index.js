/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from '@mapstore/framework/libs/ajax';
import WKT from 'ol/format/WKT';
import GeoJSON from 'ol/format/GeoJSON';
import uuid from 'uuid';

const wktFormat = new WKT();
const geoJSONFormat = new GeoJSON();

function geoJSONToWKT(collection) {
    try {
        const { features } = collection;
        const multiPolygon = features.reduce((newMultiPolygon, feature) => {
            if (feature?.geometry?.type === 'Polygon') {
                newMultiPolygon.geometry.coordinates.push(
                    feature.geometry.coordinates
                );
            }
            return newMultiPolygon;
        }, {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'MultiPolygon',
                coordinates: []
            }
        });
        const geoJSONObj = geoJSONFormat.readFeatures(multiPolygon);
        return wktFormat.writeFeatures(geoJSONObj);
    } catch (e) {
        return {};
    }
}

function wktToGeoJSON(wkt) {
    try {
        const wktObj = wktFormat.readFeatures(wkt);
        const collection = JSON.parse(geoJSONFormat.writeFeatures(wktObj));
        const feature = collection?.features?.[0];
        const features = (feature?.geometry?.coordinates || [])
            .map((coordinates) => {
                const id = uuid();
                return {
                    type: 'Feature',
                    properties: { id },
                    id,
                    geometry: {
                        type: 'Polygon',
                        coordinates
                    }
                };
            });
        return { type: 'FeatureCollection', features };
    } catch (e) {
        return { type: 'FeatureCollection', features: [] };
    }
}

export const getGeoLimits = (resourceId, id, type = 'user') => {
    return axios.get(`/security/geolimits/${resourceId}?${type}_id=${id}`)
        .then(({ data }) => wktToGeoJSON(data));
};

export const updateGeoLimits = (resourceId, id, type = 'user', collection) => {
    const wkt = geoJSONToWKT(collection);
    return axios.post(`/security/geolimits/${resourceId}?${type}_id=${id}`, wkt)
        .then(({ data }) => data);
};

export const deleteGeoLimits = (resourceId, id, type = 'user') => {
    return axios.delete(`/security/geolimits/${resourceId}?${type}_id=${id}`)
        .then(({ data }) => data);
};
