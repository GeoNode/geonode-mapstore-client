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

from django.views.generic import TemplateView
from django.utils.translation import ugettext_lazy as _
from django.apps import apps, AppConfig as BaseAppConfig


def run_setup_hooks(*args, **kwargs):
    from geonode.urls import urlpatterns
    from django.conf import settings
    from django.conf.urls import url, include
    from geonode.api.urls import router
    from geonode.security.permissions import (
        VIEW_PERMISSIONS,
        OWNER_PERMISSIONS
    )
    from geonode.groups.conf import settings as groups_settings

    LOCAL_ROOT = os.path.abspath(os.path.dirname(__file__))
    settings.TEMPLATES[0]["DIRS"].insert(0, os.path.join(LOCAL_ROOT, "templates"))

    allowed_perms = {
        "anonymous": VIEW_PERMISSIONS,
        "default": OWNER_PERMISSIONS,
        groups_settings.REGISTERED_MEMBERS_GROUP_NAME: OWNER_PERMISSIONS
    }
    setattr(settings, "CLIENT_APP_LIST", ["geostory", "dashboard"])
    setattr(settings, "CLIENT_APP_ALLOWED_PERMS_LIST", [{"geostory": allowed_perms}, {"dashboard": allowed_perms}])
    setattr(settings, "CLIENT_APP_COMPACT_PERM_LABELS", {
            "geostory": {
                "none": _("None"),
                "view": _("View"),
                "download": _("Download"),
                "edit": _("Edit"),
                "manage": _("Manage"),
                "owner": _("Owner")
            },
            "dashboard": {
                "none": _("None"),
                "view": _("View"),
                "download": _("Download"),
                "edit": _("Edit"),
                "manage": _("Manage"),
                "owner": _("Owner")
            }
        }
    )

    try:
        settings.TEMPLATES[0]['OPTIONS']['context_processors'] += [
            'geonode_mapstore_client.context_processors.resource_urls', ]
    except Exception:
        pass

    urlpatterns += [
        url(r'^catalogue/', TemplateView.as_view(template_name='geonode-mapstore-client/catalogue.html')),
        # required, otherwise will raise no-lookup errors to be analysed
        url(r'^api/v2/', include(router.urls)),
    ]

    # adding default format for metadata schema validation
    settings.EXTRA_METADATA_SCHEMA = {
        **settings.EXTRA_METADATA_SCHEMA,
        **{
            "geostory": settings.DEFAULT_EXTRA_METADATA_SCHEMA,
            "dashboard": settings.DEFAULT_EXTRA_METADATA_SCHEMA 
        }
    }

def connect_geoserver_style_visual_mode_signal():
    from geonode.geoserver.signals import geoserver_automatic_default_style_set
    from geonode_mapstore_client.utils import set_default_style_to_open_in_visual_mode

    geoserver_automatic_default_style_set.connect(set_default_style_to_open_in_visual_mode)

class AppConfig(BaseAppConfig):

    name = "geonode_mapstore_client"
    label = "geonode_mapstore_client"

    def ready(self):

        if not apps.ready:
            run_setup_hooks()
            connect_geoserver_style_visual_mode_signal()
        super(AppConfig, self).ready()
