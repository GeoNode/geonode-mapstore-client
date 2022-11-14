/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ResourceTypes } from '@js/utils/ResourceUtils';

export const appRouteComponentTypes = {
    resourceViewer: 'ViewerRoute',
    searchComponent: 'SearchRoute',
    detailComponent: 'DetailRoute',
    datasetUploadComponent: 'UploadDatasetRoute',
    documentUploadComponent: 'UploadDocumentRoute',
    homeComponent: 'Home'
};

export const HOME_ROUTES = [
    {
        name: 'homepage',
        path: '/',
        component: appRouteComponentTypes.homeComponent
    }
];

export const MAP_ROUTES = [
    {
        name: 'map-viewer',
        path: ['/'],
        pageConfig: {
            resourceType: ResourceTypes.MAP
        },
        component: appRouteComponentTypes.resourceViewer
    }
];

export const DASHBOARD_ROUTES = [{
    name: 'dashboard_embed',
    path: [
        '/'
    ],
    pageConfig: {
        resourceType: ResourceTypes.DASHBOARD
    },
    component: appRouteComponentTypes.resourceViewer
}];

export const DOCUMENT_ROUTES = [{
    name: 'document_embed',
    path: [
        '/'
    ],
    pageConfig: {
        resourceType: ResourceTypes.DOCUMENT
    },
    component: appRouteComponentTypes.resourceViewer
}];

export const GEOSTORY_ROUTES = [{
    name: 'geostory',
    path: ['/'],
    pageConfig: {
        resourceType: ResourceTypes.GEOSTORY
    },
    component: appRouteComponentTypes.resourceViewer
}];

export const CATALOGUE_ROUTES = [
    {
        name: 'dataset_viewer',
        path: [
            '/dataset/:pk'
        ],
        pageConfig: {
            resourceType: ResourceTypes.DATASET
        },
        component: appRouteComponentTypes.resourceViewer
    },
    {
        name: 'dataset_edit_data_viewer',
        path: [
            '/dataset/:pk/edit/data'
        ],
        pageConfig: {
            resourceType: ResourceTypes.DATASET
        },
        component: appRouteComponentTypes.resourceViewer
    },
    {
        name: 'dataset_edit_style_viewer',
        path: [
            '/dataset/:pk/edit/style'
        ],
        pageConfig: {
            resourceType: ResourceTypes.DATASET
        },
        component: appRouteComponentTypes.resourceViewer
    },
    {
        name: 'map_viewer',
        path: [
            '/map/:pk'
        ],
        pageConfig: {
            resourceType: ResourceTypes.MAP
        },
        component: appRouteComponentTypes.resourceViewer
    },
    {
        name: 'geostory_viewer',
        path: [
            '/geostory/:pk'
        ],
        pageConfig: {
            resourceType: ResourceTypes.GEOSTORY
        },
        component: appRouteComponentTypes.resourceViewer
    },
    {
        name: 'document_viewer',
        path: [
            '/document/:pk'
        ],
        pageConfig: {
            resourceType: ResourceTypes.DOCUMENT
        },
        component: appRouteComponentTypes.resourceViewer
    },
    {
        name: 'dashboard_viewer',
        path: [
            '/dashboard/:pk'
        ],
        pageConfig: {
            resourceType: ResourceTypes.DASHBOARD
        },
        component: appRouteComponentTypes.resourceViewer
    },
    {
        name: 'resources',
        path: [
            '/',
            '/search/',
            '/search/filter'
        ],
        component: appRouteComponentTypes.searchComponent
    },
    {
        name: 'detail',
        path: [
            '/detail/:pk',
            '/detail/:ctype/:pk'
        ],
        component: appRouteComponentTypes.detailComponent
    },
    {
        name: 'upload_dataset',
        path: ['/upload/dataset'],
        component: appRouteComponentTypes.datasetUploadComponent
    },
    {
        name: 'upload_document',
        path: ['/upload/document'],
        component: appRouteComponentTypes.documentUploadComponent
    }
];
