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

try:
    import json
except ImportError:
    from django.utils import simplejson as json

from geonode.client.hooksets import BaseHookSet
from mapstore2_adapter.plugins.geonode import GeoNodeMapStore2ConfigConverter

ms2_config_converter = GeoNodeMapStore2ConfigConverter()


def resource_list_url(resource_type):
    return '/catalogue/#/search/?filter{resource_type.in}' + '={}'.format(resource_type)

def resource_detail_url(resource_type, resource_id):
    return '/catalogue/#/{}/{}'.format(resource_type, resource_id)


class MapStoreHookSet(BaseHookSet):

    def get_request(self, context):
        if context and 'request' in context:
            return context['request']
        return None

    def get_user(self, request):
        user = {}
        if request and request.user:
            _u = request.user
            user["name"] = _u.username
            user["id"] = _u.id
            user["role"] = [group.name for group in _u.groups.all()]
            if _u.is_superuser:
                user["role"] = "ADMIN"
            if _u.is_authenticated:
                user["enabled"] = True
        return json.dumps(user)

    def get_access_token(self, request):
        if request and 'access_token' in request.session:
            return request.session['access_token']
        return None

    # return if we are editing a layer or creating a new map
    def isEditDataset(self, context):
        if context:
            req = self.get_request(context)
            if req.GET.get("layer") and req.GET.get("subtype"):
                return True
        return False

    def isViewDataset(self, context):
        if context:
            req = self.get_request(context)
            if req.GET.get("layer") and req.GET.get("view"):
                return True
        return False

    def initialize_context(self, context, callback):
        if context:
            request = self.get_request(context)
            context['USER'] = self.get_user(request)
            context['ACCESS_TOKEN'] = self.get_access_token(request)
            config = context['viewer'] if 'viewer' in context else None
            if not config:
                if 'config' in context and context['config']:
                    config = context['config']
                else:
                    try:
                        if len(context.dicts) > 0:
                            for ctx in context.dicts:
                                if 'preview' in ctx and (
                                    ctx['preview'] in (
                                        'mapstore', 'mapstore2', 'ms2') and
                                        'config' in ctx):
                                    config = ctx['config']
                    except Exception:
                        pass
            ms2_config = {}
            if config:
                try:
                    ms2_config = callback(config, request)
                except Exception:
                    ms2_config = '{}'
                    import traceback
                    traceback.print_exc()
            context['ms2_config'] = ms2_config

    # Layers
    def dataset_detail_template(self, context=None):
        self.initialize_context(
            context,
            callback=ms2_config_converter.convert)
        return 'geonode-mapstore-client/legacy/dataset_detail.html'

    def dataset_new_template(self, context=None):
        self.initialize_context(
            context,
            callback=ms2_config_converter.convert)
        return 'geonode-mapstore-client/legacy/dataset_detail.html'

    def dataset_view_template(self, context=None):
        self.initialize_context(
            context,
            callback=ms2_config_converter.convert)
        return 'geonode-mapstore-client/legacy/dataset_detail.html'

    # -- Not implemented yet
    # def dataset_edit_template(self, context=None):
    #    self.initialize_context(
    #        context,
    #        callback=ms2_config_converter.convert)
    #    return 'geonode-mapstore-client/legacy/map_new.html'

    def dataset_update_template(self, context=None):
        self.initialize_context(
            context,
            callback=ms2_config_converter.convert)
        return 'geonode-mapstore-client/legacy/dataset_detail.html'

    def dataset_embed_template(self, context=None):
        self.initialize_context(
            context,
            callback=ms2_config_converter.convert)
        return 'geonode-mapstore-client/dataset_embed.html'

    def dataset_download_template(self, context=None):
        self.initialize_context(
            context,
            callback=ms2_config_converter.convert)
        return 'geonode-mapstore-client/legacy/dataset_detail.html'

    def dataset_style_edit_template(self, context=None):
        self.initialize_context(
            context,
            callback=ms2_config_converter.convert)
        return 'geonode-mapstore-client/legacy/dataset_style_edit.html'

    def dataset_list_url(self):
        return resource_list_url('dataset')

    def dataset_detail_url(self, resource):
        return resource_detail_url('dataset', resource.id)

    # Maps
    def map_detail_template(self, context=None):
        self.initialize_context(
            context,
            callback=ms2_config_converter.convert)
        return 'geonode-mapstore-client/legacy/map_detail.html'

    def map_new_template(self, context=None):
        self.initialize_context(
            context,
            callback=ms2_config_converter.convert)
        if self.isEditDataset(context):
            return 'geonode-mapstore-client/legacy/dataset_data_edit.html'
        elif self.isViewDataset(context):
            return 'geonode-mapstore-client/legacy/dataset_view.html'
        else:
            return 'geonode-mapstore-client/legacy/map_new.html'

    def map_view_template(self, context=None):
        self.initialize_context(
            context,
            callback=ms2_config_converter.convert)
        return 'geonode-mapstore-client/legacy/map_view.html'

    def map_edit_template(self, context=None):
        self.initialize_context(
            context,
            callback=ms2_config_converter.convert)
        return 'geonode-mapstore-client/legacy/map_edit.html'

    def map_embed_template(self, context=None):
        self.initialize_context(
            context,
            callback=ms2_config_converter.convert)
        return 'geonode-mapstore-client/map_embed.html'

    def map_list_url(self):
        return resource_list_url('map')

    def map_detail_url(self, resource):
        return resource_detail_url('map', resource.id)

    # def map_download_template(self, context=None):
    #    self.initialize_context(
    #        context,
    #        callback=ms2_config_converter.convert)
    #    return 'geonode-mapstore-client/legacy/map_view.html'

    # Documents
    def document_list_url(self):
        return resource_list_url('document')

    def document_detail_url(self, resource):
        return resource_detail_url('document', resource.id)

    # GeoApps
    def geoapp_list_template(self, context=None):
        self.initialize_context(
            context,
            callback=ms2_config_converter.convert)
        return 'geonode-mapstore-client/legacy/app_list.html'

    def geoapp_new_template(self, context=None):
        self.initialize_context(
            context,
            callback=ms2_config_converter.convert)
        return 'geonode-mapstore-client/legacy/app_new.html'

    def geoapp_view_template(self, context=None):
        self.initialize_context(
            context,
            callback=ms2_config_converter.convert)
        return 'geonode-mapstore-client/legacy/app_view.html'

    def geoapp_edit_template(self, context=None):
        self.initialize_context(
            context,
            callback=ms2_config_converter.convert)
        return 'geonode-mapstore-client/legacy/app_edit.html'

    def geoapp_update_template(self, context=None):
        self.initialize_context(
            context,
            callback=ms2_config_converter.convert)
        return 'geonode-mapstore-client/legacy/app_update.html'

    def geoapp_embed_template(self, context=None):
        self.initialize_context(
            context,
            callback=ms2_config_converter.convert)
        if context['appType'] == 'dashboard':
            return 'geonode-mapstore-client/dashboard_embed.html'
        if context['appType'] == 'geostory':
            return 'geonode-mapstore-client/geostory_embed.html'
        return 'geonode-mapstore-client/legacy/app_embed.html'

    def geoapp_download_template(self, context=None):
        self.initialize_context(
            context,
            callback=ms2_config_converter.convert)
        return 'geonode-mapstore-client/legacy/app_download.html'

    def geoapp_list_url(self):
        return resource_list_url('geostory')

    def geoapp_detail_url(self, resource):
        return resource_detail_url(resource.resource_type, resource.id)

    # Map Persisting
    def viewer_json(self, conf, context=None):
        context['viewer'] = conf
        self.initialize_context(
            context,
            callback=ms2_config_converter.viewer_json)
        return context['ms2_config']

    def update_from_viewer(self, conf, context=None):
        conf = self.viewer_json(conf, context=context)
        context['config'] = conf
        return 'geonode-mapstore-client/legacy/edit_map.html'

    def metadata_update_redirect(self, url):
        url = url.replace('/metadata', '')
        resource_identifier = url.split('/')[-1]
        resource_type = url.split('/')[-2]
        resource_type = resource_type[0:len(resource_type) - 1]
        return resource_detail_url(resource_type, resource_identifier)
