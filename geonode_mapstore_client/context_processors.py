# -*- coding: utf-8 -*-
#########################################################################
#
# Copyright 2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

from django.conf import settings

def resource_urls(request):
    """Global values to pass to templates"""
    defaults = dict(
        GEOAPPS = ['GeoStory', 'GeoDashboard']
    )
    defaults['GEONODE_SETTINGS'] = {
        'MAP_BASELAYERS': getattr(settings, "MAPSTORE_BASELAYERS", []),
        'MAP_BASELAYERS_SOURCES': getattr(settings, "MAPSTORE_BASELAYERS_SOURCES", {}),
        'CATALOGUE_SERVICES': getattr(settings, "MAPSTORE_CATALOGUE_SERVICES", {}),
        'CATALOGUE_SELECTED_SERVICE': getattr(settings, "MAPSTORE_CATALOGUE_SELECTED_SERVICE", None),
        'DEFAULT_MAP_CENTER_X': getattr(settings, "DEFAULT_MAP_CENTER_X", 0),
        'DEFAULT_MAP_CENTER_Y': getattr(settings, "DEFAULT_MAP_CENTER_Y", 0),
        'DEFAULT_MAP_CRS': getattr(settings, "DEFAULT_MAP_CRS", 'EPSG:3857'),
        'DEFAULT_MAP_ZOOM': getattr(settings, "DEFAULT_MAP_ZOOM", 0),
        'DEFAULT_TILE_SIZE': getattr(settings, "DEFAULT_TILE_SIZE", 512),
        'DEFAULT_LAYER_FORMAT': getattr(settings, "DEFAULT_LAYER_FORMAT", 'image/png'),
        'ALLOWED_DOCUMENT_TYPES': getattr(settings, "ALLOWED_DOCUMENT_TYPES", []),
        'LANGUAGES': getattr(settings, "LANGUAGES", []),
        'TIME_ENABLED': getattr(
                settings,
                'UPLOADER',
                dict()).get(
                    'OPTIONS',
                    dict()).get(
                        'TIME_ENABLED',
                        False),
        'MOSAIC_ENABLED': getattr(
                settings,
                'UPLOADER',
                dict()).get(
                    'OPTIONS',
                    dict()).get(
                        'MOSAIC_ENABLED',
                        False)
    }
    return defaults
