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

from geonode.upload.utils import get_max_upload_size, get_max_upload_parallelism_limit
from geonode.utils import get_supported_datasets_file_types

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
        'CREATE_LAYER': getattr(settings, "CREATE_LAYER", False),
        'DEFAULT_MAP_CENTER_X': getattr(settings, "DEFAULT_MAP_CENTER_X", 0),
        'DEFAULT_MAP_CENTER_Y': getattr(settings, "DEFAULT_MAP_CENTER_Y", 0),
        'DEFAULT_MAP_CRS': getattr(settings, "DEFAULT_MAP_CRS", 'EPSG:3857'),
        'DEFAULT_MAP_ZOOM': getattr(settings, "DEFAULT_MAP_ZOOM", 0),
        'DEFAULT_TILE_SIZE': getattr(settings, "DEFAULT_TILE_SIZE", 512),
        'DATASET_MAX_UPLOAD_SIZE': get_max_upload_size("dataset_upload_size"),
        'DOCUMENT_MAX_UPLOAD_SIZE': get_max_upload_size("document_upload_size"),
        'DEFAULT_LAYER_FORMAT': getattr(settings, "DEFAULT_LAYER_FORMAT", 'image/png'),
        'MAX_PARALLEL_UPLOADS': get_max_upload_parallelism_limit("default_max_parallel_uploads"),
        'ALLOWED_DOCUMENT_TYPES': getattr(settings, "ALLOWED_DOCUMENT_TYPES", []),
        'LANGUAGES': getattr(settings, "LANGUAGES", []),
        'TRANSLATIONS_PATH': getattr(settings, "MAPSTORE_TRANSLATIONS_PATH", ['/static/mapstore/ms-translations', '/static/mapstore/gn-translations']),
        'PROJECTION_DEFS': getattr(settings, "MAPSTORE_PROJECTION_DEFS", []),
        'PLUGINS_CONFIG_PATCH_RULES': getattr(settings, "MAPSTORE_PLUGINS_CONFIG_PATCH_RULES", []),
        'EXTENSIONS_FOLDER_PATH': getattr(settings, "MAPSTORE_EXTENSIONS_FOLDER_PATH", '/static/mapstore/extensions/'),
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
                        False),
        'SUPPORTED_DATASET_FILE_TYPES': get_supported_datasets_file_types()
    }
    return defaults
