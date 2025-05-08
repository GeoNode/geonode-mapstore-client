
/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import * as routeUtils from '../AppRoutesUtils';

describe('Test App Routes Utils', () => {

    it('test appRouteComponentTypes', () => {
        const componentTypes = routeUtils.appRouteComponentTypes;

        expect(componentTypes).toEqual({
            VIEWER: 'ViewerRoute',
            CATALOGUE: 'CatalogueRoute',
            DATASET_UPLOAD: 'UploadDatasetRoute',
            DOCUMENT_UPLOAD: 'UploadDocumentRoute',
            COMPONENTS: 'ComponentsRoute',
            MAP_VIEWER: 'MapViewerRoute'
        });
    });

    it('test components route', () => {
        const componentsRoute = routeUtils.COMPONENTS_ROUTES[0];
        expect(componentsRoute.path).toEqual(['/']);
        expect(componentsRoute.name).toEqual('components');
    });

    it('test map route', () => {
        const mapRoute = routeUtils.MAP_ROUTES[0];
        expect(mapRoute.path).toEqual(['/']);
        expect(mapRoute.name).toEqual('map-viewer');
    });

    it('test document route', () => {
        const documentRoute = routeUtils.DOCUMENT_ROUTES[0];
        expect(documentRoute.path).toEqual(['/']);
        expect(documentRoute.name).toEqual('document_embed');
    });

    it('test dashboard route', () => {
        const dashboardRoute = routeUtils.DASHBOARD_ROUTES[0];
        expect(dashboardRoute.path).toEqual(['/']);
        expect(dashboardRoute.name).toEqual('dashboard_embed');
    });

    it('test geostory route', () => {
        const geostoryRoute = routeUtils.GEOSTORY_ROUTES[0];
        expect(geostoryRoute.path).toEqual(['/']);
        expect(geostoryRoute.name).toEqual('geostory');
    });

    it('test catalogue routes', () => {
        const [
            metadataRoute,
            datasetSubtypeRoute,
            datasetRoute,
            datasetEditDataRoute,
            datasetEditLayerSettingsRoute,
            mapRoute,
            geoStoryRoute,
            documentRoute,
            dashboardRoute,
            mapViewerMapRoute,
            mapViewerRoute,
            catalogueRoute,
            uploadDatasetRoute,
            uploadDocumentRoute
        ] = routeUtils.CATALOGUE_ROUTES;
        expect(metadataRoute.path).toEqual(['/metadata/:pk']);
        expect(metadataRoute.name).toEqual('metadata');
        expect(datasetSubtypeRoute.path).toEqual(['/dataset/:subtype/:pk']);
        expect(datasetSubtypeRoute.name).toEqual('dataset_viewer');
        expect(datasetRoute.path).toEqual(['/dataset/:pk']);
        expect(datasetRoute.name).toEqual('dataset_viewer');
        expect(datasetEditDataRoute.path).toEqual(['/dataset/:pk/edit/data']);
        expect(datasetEditDataRoute.name).toEqual('dataset_edit_data_viewer');
        expect(datasetEditLayerSettingsRoute.path).toEqual(['/dataset/:pk/edit/settings']);
        expect(datasetEditLayerSettingsRoute.name).toEqual('dataset_edit_layer_settings');
        expect(mapRoute.path).toEqual([ '/map/:pk' ]);
        expect(mapRoute.name).toEqual('map_viewer');
        expect(geoStoryRoute.path).toEqual(['/geostory/:pk']);
        expect(geoStoryRoute.name).toEqual('geostory_viewer');
        expect(documentRoute.path).toEqual(['/document/:pk']);
        expect(documentRoute.name).toEqual('document_viewer');
        expect(dashboardRoute.path).toEqual(['/dashboard/:pk']);
        expect(dashboardRoute.name).toEqual('dashboard_viewer');
        expect(mapViewerMapRoute.path).toEqual(['/viewer/:pk/map/:mapPk']);
        expect(mapViewerMapRoute.name).toEqual('viewer');
        expect(mapViewerRoute.path).toEqual(['/viewer/:pk']);
        expect(mapViewerRoute.name).toEqual('viewer');
        expect(catalogueRoute.path).toEqual(['/']);
        expect(catalogueRoute.name).toEqual('catalogue');
        expect(uploadDatasetRoute.path).toEqual(['/upload/dataset']);
        expect(uploadDatasetRoute.name).toEqual('upload_dataset');
        expect(uploadDocumentRoute.path).toEqual(['/upload/document']);
        expect(uploadDocumentRoute.name).toEqual('upload_document');
    });
});
