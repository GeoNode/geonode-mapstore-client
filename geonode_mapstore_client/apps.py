# -*- coding: utf-8 -*-
#########################################################################
#
# Copyright 2015-2018, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################
import os
from django.apps import AppConfig as BaseAppConfig
from django.views.generic import TemplateView

def run_setup_hooks(*args, **kwargs):
    from geonode.urls import urlpatterns
    from django.conf import settings
    from django.conf.urls import url, include

    LOCAL_ROOT = os.path.abspath(os.path.dirname(__file__))
    settings.TEMPLATES[0]["DIRS"].insert(0, os.path.join(LOCAL_ROOT, "templates"))

    urlpatterns += [
        url(r'^mapstore/', include('mapstore2_adapter.urls')),
        url(r'^', include('mapstore2_adapter.geoapps.geostories.api.urls')),
        url(r'^', include('mapstore2_adapter.geoapps.dashboards.api.urls')),
        url(r'^viewer/', TemplateView.as_view(template_name='geonode-mapstore-client/viewer.html')),
    ]


class AppConfig(BaseAppConfig):

    name = "geonode_mapstore_client"
    label = "geonode_mapstore_client"

    def ready(self):
        run_setup_hooks()
        super(AppConfig, self).ready()
