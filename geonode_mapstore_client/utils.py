import os
import json

from geoserver.catalog import FailedRequestError
from geonode.geoserver.helpers import gs_catalog
from geonode.layers.models import Dataset


def set_default_style_to_open_in_visual_mode(instance, **kwargs):
    if isinstance(instance, Dataset):
        style = gs_catalog.get_style(
            instance.name, workspace=instance.workspace
        ) or gs_catalog.get_style(instance.name)
        if style:
            headers = {"Content-type": "application/json", "Accept": "application/json"}
            data = {"style": {"metadata": {"msForceVisual": "true"}}}
            body_href = os.path.splitext(style.body_href)[0] + ".json"

            resp = gs_catalog.http_request(
                body_href, method="put", data=json.dumps(data), headers=headers
            )
            if resp.status_code not in (200, 201, 202):
                raise FailedRequestError(
                    "Failed to update style {} : {}, {}".format(
                        style.name, resp.status_code, resp.text
                    )
                )

def get_page_filter_form(group_filter_form = None):
    if group_filter_form is None:
        group_filter_form = []

    page_filter_form = [
        {
            "type": "search"
        },
        {
            "type": "group",
            "labelId": "gnhome.customFiltersTitle",
            "items": [
                {
                    "id": "my-resources",
                    "labelId": "gnhome.myResources",
                    "type": "filter",
                    "disableIf": "{!state('user')}"
                },
                {
                    "id": "favorite",
                    "labelId": "gnhome.favorites",
                    "type": "filter",
                    "disableIf": "{!state('user')}"
                },
                {
                    "id": "featured",
                    "labelId": "gnhome.featuredList",
                    "type": "filter"
                },
                {
                    "id": "unpublished",
                    "labelId": "gnhome.unpublished",
                    "type": "filter",
                    "disableIf": "{!state('user')}"
                },
                {
                    "id": "pending-approval",
                    "labelId": "gnhome.pendingApproval",
                    "type": "filter",
                    "disableIf": "{!state('user')}"
                },
                *group_filter_form,
            ]
        },
        {
            "type": "divider",
            "disableIf": "{!state('user')}"
        },
        {
            "type": "select",
            "facet": "category"
        },
        {
            "type": "select",
            "facet": "keyword"
        },
        {
            "type": "select",
            "facet": "place"
        },
        {
            "type": "select",
            "facet": "user"
        },
        {
            "type": "select",
            "facet": "group"
        },
        {
            "type": "accordion",
            "style": "facet",
            "facet": "thesaurus"
        },
        {
            "type": "date-range",
            "filterKey": "date",
            "labelId": "gnviewer.dateFilter"
        },
        {
            "labelId": "gnviewer.extent",
            "type": "extent"
        }
    ]
    return page_filter_form

def get_default_resource_page_config():
    DEFAULT_PAGE_FILTER_FORM = get_page_filter_form()
    page_resource_config = {
        "maps": {
            "titleId": "gnhome.map",
            "defaultQuery": {
                "f": "map"
            },
            "menuItems": [
                {
                    "labelId": "gnhome.new",
                    "disableIf": "{(state('settings') && state('settings').isMobile) || !(state('user') && state('user').perms && state('user').perms.includes('add_resource'))}",
                    "type": "button",
                    "variant": "primary",
                    "value": "map",
                    "href": "{context.getCataloguePath('/catalogue/#/map/new')}"
                }
            ],
            "filterFormFields" : DEFAULT_PAGE_FILTER_FORM
        },
        "datasets": {
            "titleId": "gnhome.dataset",
            "defaultQuery": {
                "f": "dataset"
            },
            "menuItems": [
                {
                    "labelId": "gnhome.new",
                    "disableIf": "{(state('settings') && state('settings').isMobile) || !(state('user') && state('user').perms && state('user').perms.includes('add_resource'))}",
                    "type": "dropdown",
                    "noCaret": True,
                    "variant": "primary",
                    "items": [
                        {
                            "labelId": "gnhome.uploadDataset",
                            "value": "layer",
                            "type": "link",
                            "href": "{context.getCataloguePath('/catalogue/#/upload/dataset')}"
                        },
                        {
                            "labelId": "gnhome.createDataset",
                            "value": "layer",
                            "type": "link",
                            "href": "/createlayer/",
                            "disableIf": "{(state('settings') && state('settings').createLayer) ? false : true}"
                        },
                        {
                            "labelId": "gnhome.remoteServices",
                            "value": "remote",
                            "type": "link",
                            "href": "/services/?limit=5"
                        }
                    ]
                }
            ],
            "filterFormFields": get_page_filter_form([
                {
                    "id": "remote",
                    "labelId": "gnhome.remote",
                    "type": "filter"
                },
                {
                    "id": "store-vector",
                    "labelId": "gnhome.vector",
                    "type": "filter"
                },
                {
                    "id": "store-raster",
                    "labelId": "gnhome.raster",
                    "type": "filter"
                },
                {
                    "id": "store-time-series",
                    "labelId": "gnhome.timeSeries",
                    "type": "filter"
                },
                {
                    "id": "3dtiles",
                    "labelId": "gnhome.3dtiles",
                    "type": "filter"
                }
            ])
        },
        "documents": {
            "titleId": "gnhome.document",
            "defaultQuery": {
                "f": "document"
            },
            "menuItems": [
                {
                    "labelId": "gnhome.new",
                    "disableIf": "{(state('settings') && state('settings').isMobile) || !(state('user') && state('user').perms && state('user').perms.includes('add_resource'))}",
                    "type": "button",
                    "variant": "primary",
                    "value": "document",
                    "href": "{context.getCataloguePath('/catalogue/#/upload/document')}"
                }
            ],
            "filterFormFields": get_page_filter_form([
                {
                    "id": "remote",
                    "labelId": "gnhome.remote",
                    "type": "filter"
                }
            ])
        },
        "dashboards": {
            "titleId": "gnhome.dashboard",
            "defaultQuery": {
                "f": "dashboard"
            },
            "menuItems": [
                {
                    "labelId": "gnhome.new",
                    "disableIf": "{(state('settings') && state('settings').isMobile) || !(state('user') && state('user').perms && state('user').perms.includes('add_resource'))}",
                    "type": "button",
                    "variant": "primary",
                    "value": "dashboard",
                    "href": "{context.getCataloguePath('/catalogue/#/dashboard/new')}"
                }
            ],
            "filterFormFields": DEFAULT_PAGE_FILTER_FORM
        },
        "geostories": {
            "titleId": "gnhome.geostory",
            "defaultQuery": {
                "f": "geostory"
            },
            "menuItems": [
                {
                    "labelId": "gnhome.new",
                    "disableIf": "{(state('settings') && state('settings').isMobile) || !(state('user') && state('user').perms && state('user').perms.includes('add_resource'))}",
                    "type": "button",
                    "variant": "primary",
                    "value": "geostory",
                    "href": "{context.getCataloguePath('/catalogue/#/geostory/new')}"
                }
            ],
            "filterFormFields": DEFAULT_PAGE_FILTER_FORM
        }
    }
    return page_resource_config
