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
from django.apps import apps, AppConfig as BaseAppConfig
from django.views.generic import TemplateView

def run_setup_hooks(*args, **kwargs):
    from geonode.urls import urlpatterns
    from django.conf import settings
    from django.conf.urls import url, include
    from geonode.api.urls import router

    LOCAL_ROOT = os.path.abspath(os.path.dirname(__file__))
    settings.TEMPLATES[0]["DIRS"].insert(0, os.path.join(LOCAL_ROOT, "templates"))

    setattr(settings, "MAPSTORE_CLIENT_APP_LIST", ['geostory', "dashboard"])

    urlpatterns += [
        url(r'^mapstore/', include('mapstore2_adapter.urls')),
        url(r'^catalogue/', TemplateView.as_view(template_name='geonode-mapstore-client/catalogue.html')),
        # required, otherwise will raise no-lookup errors to be analysed
        url(r'^api/v2/', include(router.urls)),
    ]


class AppConfig(BaseAppConfig):

    name = "geonode_mapstore_client"
    label = "geonode_mapstore_client"

    def ready(self):
        if not apps.ready:
            run_setup_hooks()
        super(AppConfig, self).ready()
