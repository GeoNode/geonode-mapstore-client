
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
        expect(metadataRoute.shouldNotRequestResources).toEqual(true);
        expect(datasetSubtypeRoute.path).toEqual(['/dataset/:subtype/:pk']);
        expect(datasetSubtypeRoute.name).toEqual('dataset_viewer');
        expect(datasetSubtypeRoute.shouldNotRequestResources).toEqual(true);
        expect(datasetRoute.path).toEqual(['/dataset/:pk']);
        expect(datasetRoute.name).toEqual('dataset_viewer');
        expect(datasetRoute.shouldNotRequestResources).toEqual(true);
        expect(datasetEditDataRoute.path).toEqual(['/dataset/:pk/edit/data']);
        expect(datasetEditDataRoute.name).toEqual('dataset_edit_data_viewer');
        expect(datasetEditDataRoute.shouldNotRequestResources).toEqual(true);
        expect(datasetEditLayerSettingsRoute.path).toEqual(['/dataset/:pk/edit/settings']);
        expect(datasetEditLayerSettingsRoute.name).toEqual('dataset_edit_layer_settings');
        expect(datasetEditLayerSettingsRoute.shouldNotRequestResources).toEqual(true);
        expect(mapRoute.path).toEqual([ '/map/:pk' ]);
        expect(mapRoute.name).toEqual('map_viewer');
        expect(mapRoute.shouldNotRequestResources).toEqual(true);
        expect(geoStoryRoute.path).toEqual(['/geostory/:pk']);
        expect(geoStoryRoute.name).toEqual('geostory_viewer');
        expect(geoStoryRoute.shouldNotRequestResources).toEqual(true);
        expect(documentRoute.path).toEqual(['/document/:pk']);
        expect(documentRoute.name).toEqual('document_viewer');
        expect(documentRoute.shouldNotRequestResources).toEqual(true);
        expect(dashboardRoute.path).toEqual(['/dashboard/:pk']);
        expect(dashboardRoute.name).toEqual('dashboard_viewer');
        expect(dashboardRoute.shouldNotRequestResources).toEqual(true);
        expect(mapViewerMapRoute.path).toEqual(['/viewer/:pk/map/:mapPk']);
        expect(mapViewerMapRoute.name).toEqual('viewer');
        expect(mapViewerMapRoute.shouldNotRequestResources).toEqual(true);
        expect(mapViewerRoute.path).toEqual(['/viewer/:pk']);
        expect(mapViewerRoute.name).toEqual('viewer');
        expect(mapViewerRoute.shouldNotRequestResources).toEqual(true);
        expect(catalogueRoute.path).toEqual([
            '/',
            '/search/',
            '/search/filter',
            '/detail/:pk',
            '/detail/:ctype/:pk',
            '/:page'
        ]);
        expect(catalogueRoute.name).toEqual('catalogue');
        expect(uploadDatasetRoute.path).toEqual(['/upload/dataset']);
        expect(uploadDatasetRoute.name).toEqual('upload_dataset');
        expect(uploadDatasetRoute.shouldNotRequestResources).toEqual(true);
        expect(uploadDocumentRoute.path).toEqual(['/upload/document']);
        expect(uploadDocumentRoute.name).toEqual('upload_document');
        expect(uploadDocumentRoute.shouldNotRequestResources).toEqual(true);
    });
});
