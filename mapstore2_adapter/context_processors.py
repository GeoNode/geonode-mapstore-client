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
        MAP_BASELAYERS=getattr(settings, "MAPSTORE_BASELAYERS", []),
        CATALOGUE_SERVICES=getattr(settings, "MAPSTORE_CATALOGUE_SERVICES", {}),
        CATALOGUE_SELECTED_SERVICE=getattr(settings, "MAPSTORE_CATALOGUE_SELECTED_SERVICE", None),
    )

    return defaults
