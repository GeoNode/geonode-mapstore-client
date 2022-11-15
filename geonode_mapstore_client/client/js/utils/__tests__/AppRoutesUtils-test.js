
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
            SEARCH: 'SearchRoute',
            DETAIL: 'DetailRoute',
            DATASET_UPLOAD: 'UploadDatasetRoute',
            DOCUMENT_UPLOAD: 'UploadDocumentRoute',
            HOME: 'HomeRoute'
        });
    });

    it('test home route', () => {
        const homeRoute = routeUtils.HOME_ROUTES[0];
        expect(homeRoute.path).toEqual(['/']);
        expect(homeRoute.name).toEqual('homepage');
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
        const catalogueRoutes = routeUtils.CATALOGUE_ROUTES;
        expect(catalogueRoutes[0].path).toEqual(['/dataset/:pk']);
        expect(catalogueRoutes[0].name).toEqual('dataset_viewer');
        expect(catalogueRoutes[0].shouldNotRequestResources).toEqual(true);
        expect(catalogueRoutes[1].path).toEqual(['/dataset/:pk/edit/data']);
        expect(catalogueRoutes[1].name).toEqual('dataset_edit_data_viewer');
        expect(catalogueRoutes[1].shouldNotRequestResources).toEqual(true);
        expect(catalogueRoutes[2].path).toEqual(['/dataset/:pk/edit/style']);
        expect(catalogueRoutes[2].name).toEqual('dataset_edit_style_viewer');
        expect(catalogueRoutes[2].shouldNotRequestResources).toEqual(true);
        expect(catalogueRoutes[3].path).toEqual([ '/map/:pk' ]);
        expect(catalogueRoutes[3].name).toEqual('map_viewer');
        expect(catalogueRoutes[3].shouldNotRequestResources).toEqual(true);
        expect(catalogueRoutes[4].path).toEqual(['/geostory/:pk']);
        expect(catalogueRoutes[4].name).toEqual('geostory_viewer');
        expect(catalogueRoutes[4].shouldNotRequestResources).toEqual(true);
        expect(catalogueRoutes[5].path).toEqual(['/document/:pk']);
        expect(catalogueRoutes[5].name).toEqual('document_viewer');
        expect(catalogueRoutes[5].shouldNotRequestResources).toEqual(true);
        expect(catalogueRoutes[6].path).toEqual(['/dashboard/:pk']);
        expect(catalogueRoutes[6].name).toEqual('dashboard_viewer');
        expect(catalogueRoutes[6].shouldNotRequestResources).toEqual(true);
        expect(catalogueRoutes[7].path).toEqual([
            '/',
            '/search/',
            '/search/filter'
        ]);
        expect(catalogueRoutes[7].name).toEqual('resources');
        expect(catalogueRoutes[8].path).toEqual([
            '/detail/:pk',
            '/detail/:ctype/:pk'
        ]);
        expect(catalogueRoutes[8].name).toEqual('detail');
        expect(catalogueRoutes[9].path).toEqual(['/upload/dataset']);
        expect(catalogueRoutes[9].name).toEqual('upload_dataset');
        expect(catalogueRoutes[9].shouldNotRequestResources).toEqual(true);
        expect(catalogueRoutes[10].path).toEqual(['/upload/document']);
        expect(catalogueRoutes[10].name).toEqual('upload_document');
        expect(catalogueRoutes[10].shouldNotRequestResources).toEqual(true);
    });
});
