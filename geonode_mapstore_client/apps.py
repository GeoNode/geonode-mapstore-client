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
from django.utils.translation import gettext_lazy as _
from django.apps import apps, AppConfig as BaseAppConfig
from . import views

def run_setup_hooks(*args, **kwargs):
    from geonode.urls import urlpatterns
    from django.conf import settings
    from django.conf.urls import include
    from django.urls import re_path
    from geonode.api.urls import router
    from geonode.security.permissions import VIEW_PERMISSIONS, OWNER_PERMISSIONS
    from geonode.groups.conf import settings as groups_settings

    LOCAL_ROOT = os.path.abspath(os.path.dirname(__file__))
    settings.TEMPLATES[0]["DIRS"].insert(0, os.path.join(LOCAL_ROOT, "templates"))

    allowed_perms = {
        "anonymous": VIEW_PERMISSIONS,
        "default": OWNER_PERMISSIONS,
        groups_settings.REGISTERED_MEMBERS_GROUP_NAME: OWNER_PERMISSIONS,
    }
    setattr(settings, "CLIENT_APP_LIST", ["geostory", "dashboard", "mapviewer"])
    setattr(
        settings,
        "CLIENT_APP_ALLOWED_PERMS_LIST",
        [{"geostory": allowed_perms}, {"dashboard": allowed_perms}, {"mapviewer": allowed_perms}],
    )
    setattr(
        settings,
        "CLIENT_APP_COMPACT_PERM_LABELS",
        {
            "geostory": {
                "none": _("None"),
                "view": _("View"),
                "download": _("Download"),
                "edit": _("Edit"),
                "manage": _("Manage"),
                "owner": _("Owner"),
            },
            "dashboard": {
                "none": _("None"),
                "view": _("View"),
                "download": _("Download"),
                "edit": _("Edit"),
                "manage": _("Manage"),
                "owner": _("Owner"),
            },
            "mapviewer": {
                "none": _("None"),
                "view": _("View"),
                "download": _("Download"),
                "edit": _("Edit"),
                "manage": _("Manage"),
                "owner": _("Owner"),
            },
        },
    )

    try:
        settings.TEMPLATES[0]["OPTIONS"]["context_processors"] += [
            "geonode_mapstore_client.context_processors.resource_urls",
        ]
    except Exception:
        pass

    urlpatterns += [
        re_path(
            r"^catalogue/",
            TemplateView.as_view(
                template_name="geonode-mapstore-client/catalogue.html"
            ),
        ),
        re_path(r"^metadata/(?P<pk>[^/]*)$", views.metadata, name='metadata'),
        re_path(r"^metadata/(?P<pk>[^/]*)/embed$", views.metadata_embed, name='metadata'),
        # required, otherwise will raise no-lookup errors to be analysed
        re_path(r"^api/v2/", include(router.urls)),
    ]

    # adding default format for metadata schema validation
    settings.EXTRA_METADATA_SCHEMA = {
        **settings.EXTRA_METADATA_SCHEMA,
        **{
            "geostory": settings.DEFAULT_EXTRA_METADATA_SCHEMA,
            "dashboard": settings.DEFAULT_EXTRA_METADATA_SCHEMA,
            "mapviewer": settings.DEFAULT_EXTRA_METADATA_SCHEMA,
        },
    }

    settings.CACHES["search_services"] = {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "TIMEOUT": 300,
        "OPTIONS": {"MAX_ENTRIES": 10000},
    }
    settings.REST_API_PRESETS["catalog_list"] = {
        "exclude[]": ["*"],
        "include[]": [
            "advertised",
            "detail_url",
            "is_approved",
            "is_copyable",
            "is_published",
            "owner",
            "perms",
            "pk",
            "raw_abstract",
            "resource_type",
            "subtype",
            "title",
            "executions",
            "thumbnail_url"
        ],
    }
    settings.REST_API_PRESETS["dataset_list"] = {
        "exclude[]": ["*"],
        "include[]": [
            "advertised",
            "detail_url",
            "owner",
            "perms",
            "pk",
            "raw_abstract",
            "resource_type",
            "subtype",
            "title",
            "data",
            "executions",
            "thumbnail_url",
            "alternate",
            "links",
            "featureinfo_custom_template",
            "has_time",
            "default_style",
            "ptype",
            "extent",
            "is_approved",
            "is_published"
        ],
    }
    settings.REST_API_PRESETS["map_list"] = {
        "exclude[]": ["*"],
        "include[]": [
            "advertised",
            "detail_url",
            "data",
            "is_approved",
            "is_copyable",
            "is_published",
            "owner",
            "perms",
            "pk",
            "raw_abstract",
            "resource_type",
            "subtype",
            "title",
            "executions",
            "thumbnail_url"
        ],
    }
    settings.REST_API_PRESETS["document_list"] = {
        "exclude[]": ["*"],
        "include[]": [
            "pk",
            "raw_abstract",
            "resource_type",
            "subtype",
            "title",
            "data",
            "executions",
            "thumbnail_url",
            "alternate",
            "attribution",
            "href"
        ],
    }
    settings.REST_API_PRESETS["viewer_common"] = {
        "exclude[]": ["*"],
        "include[]": [
            "abstract",
            "advertised",
            "alternate",
            "attribution",
            "category",
            "created",
            "date",
            "date_type",
            "detail_url",
            "download_urls",
            "embed_url",
            "executions",
            "extent",
            "favorite",
            "group",
            "is_approved",
            "is_copyable",
            "is_published",
            "keywords",
            "language",
            "last_updated",
            "linked_resources",
            "links",
            "owner",
            "perms",
            "pk",
            "poc",
            "raw_abstract",
            "regions",
            "resource_type",
            "sourcetype",
            "subtype",
            "supplemental_information",
            "temporal_extent_end",
            "temporal_extent_start",
            "thumbnail_url",
            "title",
            "uuid",
            "metadata_uploaded_preserve",
            "featured"
        ],
    }
    settings.REST_API_PRESETS["map_viewer"] = {
        "include[]": [
            "data",
            "maplayers"
        ]
    }
    settings.REST_API_PRESETS["document_viewer"] = {
        "include[]": [
            "href",
            "extension"
        ]
    }
    settings.REST_API_PRESETS["dataset_viewer"] = {
        "include[]": [
            "featureinfo_custom_template",            
            "dataset_ows_url",
            "default_style",
            "ptype",
            "store",
            "has_time",
            "attribute_set",
            "data"
        ]
    }
    settings.PROXY_ALLOWED_PARAMS_NEEDLES += (
        "request=getfeatureinfo",
        "request=getcapabilities",
        "request=getmap",
    )
    settings.PROXY_ALLOWED_PATH_NEEDLES += (
        "tileset.json",
        "glb",
        "ifc",
        "tms",
        "wmts",
        "wms",
        "wfs",
        "ows",
        "wps",
        "b3dm",
        "i3dm",
        "pnts",
    )

    GEONODE_CATALOGUE_SERVICE = getattr(settings, "GEONODE_CATALOGUE_SERVICE", None)
    MAPSTORE_DASHBOARD_CATALOGUE_SERVICES = {}
    MAPSTORE_DASHBOARD_CATALOGUE_SELECTED_SERVICE = ""

    if GEONODE_CATALOGUE_SERVICE:
        MAPSTORE_DASHBOARD_CATALOGUE_SERVICES[list(list(GEONODE_CATALOGUE_SERVICE.keys()))[0]] = GEONODE_CATALOGUE_SERVICE[
            list(list(GEONODE_CATALOGUE_SERVICE.keys()))[0]
        ]  # noqa
        MAPSTORE_DASHBOARD_CATALOGUE_SELECTED_SERVICE = list(list(GEONODE_CATALOGUE_SERVICE.keys()))[0]

    setattr(settings, "MAPSTORE_DASHBOARD_CATALOGUE_SELECTED_SERVICE", MAPSTORE_DASHBOARD_CATALOGUE_SELECTED_SERVICE)
    setattr(settings, "MAPSTORE_DASHBOARD_CATALOGUE_SERVICES", MAPSTORE_DASHBOARD_CATALOGUE_SERVICES)


def connect_geoserver_style_visual_mode_signal():
    from geonode.geoserver.signals import geoserver_automatic_default_style_set
    from geonode_mapstore_client.utils import set_default_style_to_open_in_visual_mode

    geoserver_automatic_default_style_set.connect(
        set_default_style_to_open_in_visual_mode
    )


class AppConfig(BaseAppConfig):
    name = "geonode_mapstore_client"
    label = "geonode_mapstore_client"
    verbose_name = "Mapstore Client"

    def ready(self):
        if not apps.ready:
            run_setup_hooks()
            connect_geoserver_style_visual_mode_signal()
        super(AppConfig, self).ready()
