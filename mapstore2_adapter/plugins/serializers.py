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

from __future__ import absolute_import

from ..api.models import (MapStoreData,
                          MapStoreAttribute)

from rest_framework.exceptions import APIException

import json
import base64
import logging
import traceback
from django.http import Http404
try:
    from urllib.parse import urlparse, parse_qs
except ImportError:
    from urlparse import urlparse, parse_qs
from geonode.layers.models import Layer
from geonode.base.bbox_utils import BBOXHelper

is_analytics_enabled = False
try:
    from geonode.monitoring.models import EventType
    from geonode.monitoring import register_event
    is_analytics_enabled = True
except ImportError:
    pass


logger = logging.getLogger(__name__)


class GeoNodeSerializer(object):

    @classmethod
    def update_data(cls, serializer, data):
        if data:
            _data, created = MapStoreData.objects.get_or_create(
                resource=serializer.instance)
            _data.resource = serializer.instance
            _data.blob = data
            _data.save()
            serializer.validated_data['data'] = _data

    @classmethod
    def update_attributes(cls, serializer, attributes):
        _attributes = []
        for _a in attributes:
            attribute, created = MapStoreAttribute.objects.get_or_create(
                name=_a['name'],
                resource=serializer.instance)
            attribute.resource = serializer.instance
            attribute.name = _a['name']
            attribute.type = _a['type']
            attribute.label = _a['label']
            if 'value' in _a:
                attribute.value = base64.b64encode(_a['value'].encode('utf8'))
            attribute.save()
            _attributes.append(attribute)
        serializer.validated_data['attributes'] = _attributes

    def get_queryset(self, caller, queryset):
        allowed_map_ids = []
        for _q in queryset:
            mapid = _q.id
            try:
                from geonode.maps.views import (_resolve_map,
                                                _PERMISSION_MSG_VIEW)
                map_obj = _resolve_map(
                    caller.request,
                    str(mapid),
                    'base.view_resourcebase',
                    _PERMISSION_MSG_VIEW)
                if map_obj:
                    allowed_map_ids.append(mapid)
            except Exception:
                tb = traceback.format_exc()
                logger.debug(tb)

        queryset = queryset.filter(id__in=allowed_map_ids)
        return queryset

    def get_geonode_map(self, caller, serializer):
        from geonode.maps.views import _PERMISSION_MSG_SAVE
        try:
            from geonode.maps.views import _resolve_map
            if 'id' in serializer.validated_data:
                mapid = serializer.validated_data['id']
                map_obj = _resolve_map(
                    caller.request,
                    str(mapid),
                    'base.change_resourcebase',
                    _PERMISSION_MSG_SAVE)
                return map_obj
        except Exception:
            tb = traceback.format_exc()
            logger.debug(tb)
            raise APIException(_PERMISSION_MSG_SAVE)

    def set_geonode_map(self, caller, serializer, map_obj=None, data=None, attributes=None):

        def decode_base64(data):
            """Decode base64, padding being optional.

            :param data: Base64 data as an ASCII byte string
            :returns: The decoded byte string.

            """
            _thumbnail_format = 'png'
            _invalid_padding = data.find(';base64,')
            if _invalid_padding:
                _thumbnail_format = data[data.find('image/') + len('image/'):_invalid_padding]
                data = data[_invalid_padding + len(';base64,'):]
            missing_padding = len(data) % 4
            if missing_padding != 0:
                data += b'=' * (4 - missing_padding)
            return (base64.b64decode(data), _thumbnail_format)

        _map_name = None
        _map_title = None
        _map_abstract = None
        _map_thumbnail = None
        _map_thumbnail_format = 'png'
        if attributes:
            for _a in attributes:
                if _a['name'] == 'name' and 'value' in _a:
                    _map_name = _a['value']
                if _a['name'] == 'title' and 'value' in _a:
                    _map_title = _a['value']
                if _a['name'] == 'abstract' and 'value' in _a:
                    _map_abstract = _a['value']
                if 'thumb' in _a['name'] and 'value' in _a:
                    try:
                        (_map_thumbnail, _map_thumbnail_format) = decode_base64(_a['value'])
                    except Exception:
                        if _a['value']:
                            _map_thumbnail = _a['value']
                            _map_thumbnail_format = 'link'
        elif map_obj:
            _map_title = map_obj.title
            _map_abstract = map_obj.abstract

        _map_name = _map_name or None
        if not _map_name and 'name' in serializer.validated_data:
            _map_name = serializer.validated_data['name']
        _map_title = _map_title or _map_name
        _map_abstract = _map_abstract or ""
        if data:
            try:
                _map_conf = dict(data)
                _map_conf["about"] = {
                    "name": _map_name,
                    "title": _map_title,
                    "abstract": _map_abstract}
                _map_conf['sources'] = {}
                from geonode.layers.views import layer_detail
                _map_obj = data.pop('map', None)
                if _map_obj:
                    _map_bbox = []
                    for _lyr in _map_obj['layers']:
                        _lyr_context = {}
                        _lyr_store = _lyr['store'] if 'store' in _lyr else None
                        if not _lyr_store:
                            try:
                                _url = urlparse(_lyr['catalogURL'])
                                _lyr_store = Layer.objects.get(
                                    uuid=parse_qs(_url.query)['id'][0]).store
                            except Exception:
                                try:
                                    _lyr_store = Layer.objects.get(
                                        alternate=_lyr['name'],
                                        remote_service__base_url=_lyr['url']).store
                                except Exception:
                                    _lyr_store = None

                        _lyr_name = "%s:%s" % (_lyr_store, _lyr['name']) if _lyr_store else _lyr['name']
                        try:
                            # Retrieve the Layer Params back from GeoNode
                            _gn_layer = layer_detail(
                                caller.request,
                                _lyr_name)
                            if _gn_layer and _gn_layer.context_data:
                                _context_data = json.loads(_gn_layer.context_data['viewer'])
                                for _gn_layer_ctx in _context_data['map']['layers']:
                                    if 'name' in _gn_layer_ctx and _gn_layer_ctx['name'] == _lyr['name']:
                                        _lyr['store'] = _lyr_store
                                        if 'style' in _lyr:
                                            _lyr_context['style'] = _lyr['style']
                                        _lyr_context = _gn_layer_ctx
                                        _src_idx = _lyr_context['source']
                                        _map_conf['sources'][_src_idx] = _context_data['sources'][_src_idx]
                        except Http404:
                            tb = traceback.format_exc()
                            logger.debug(tb)
                        except Exception:
                            raise
                        # Store ms2 layer idq
                        if "id" in _lyr and _lyr["id"]:
                            _lyr['extraParams'] = {"msId": _lyr["id"]}

                        # Store the Capabilities Document into the Layer Params of GeoNode
                        if _lyr_context:
                            if 'ftInfoTemplate' in _lyr_context:
                                _lyr['ftInfoTemplate'] = _lyr_context['ftInfoTemplate']
                            if 'getFeatureInfo' in _lyr_context:
                                _lyr['getFeatureInfo'] = _lyr_context['getFeatureInfo']
                            if 'capability' in _lyr_context:
                                _lyr['capability'] = _lyr_context['capability']
                                if 'bbox' in _lyr_context['capability']:
                                    _lyr_bbox = _lyr_context['capability']['bbox']
                                    if _map_obj['projection'] in _lyr_bbox:
                                        x0 = _lyr_bbox[_map_obj['projection']]['bbox'][0]
                                        x1 = _lyr_bbox[_map_obj['projection']]['bbox'][2]
                                        y0 = _lyr_bbox[_map_obj['projection']]['bbox'][1]
                                        y1 = _lyr_bbox[_map_obj['projection']]['bbox'][3]

                                        if len(_map_bbox) == 0:
                                            _map_bbox = [x0, x1, y0, y1]
                                        else:
                                            from geonode.utils import bbox_to_wkt
                                            from django.contrib.gis.geos import GEOSGeometry

                                            _l_wkt = bbox_to_wkt(x0, x1, y0, y1,
                                                                 srid=_map_obj['projection'])
                                            _m_wkt = bbox_to_wkt(_map_bbox[0], _map_bbox[2],
                                                                 _map_bbox[1], _map_bbox[3],
                                                                 srid=_map_obj['projection'])
                                            _map_srid = int(_map_obj['projection'][5:])
                                            _l_poly = GEOSGeometry(_l_wkt, srid=_map_srid)
                                            _m_poly = GEOSGeometry(_m_wkt, srid=_map_srid).union(_l_poly)
                                            _map_bbox = _m_poly.extent

                            if 'source' in _lyr_context:
                                _source = _map_conf['sources'][_lyr_context['source']]
                                if 'remote' in _source and _source['remote'] is True:
                                    _lyr['source'] = _lyr_context['source']
                        elif 'source' in _lyr:
                            _map_conf['sources'][_lyr['source']] = {}
                    event_type = None
                    if is_analytics_enabled:
                        event_type = EventType.EVENT_CHANGE

                    if not map_obj:
                        # Update Map BBox
                        if 'bbox' not in _map_obj and (not _map_bbox or len(_map_bbox) != 4):
                            _map_bbox = _map_obj['maxExtent']
                            # Must be in the form : [x0, x1, y0, y1]
                            _map_obj['bbox'] = [_map_bbox[0], _map_bbox[1],
                                                _map_bbox[2], _map_bbox[3]]
                        # Create a new GeoNode Map
                        from geonode.maps.models import Map
                        map_obj = Map(
                            title=_map_title,
                            owner=caller.request.user,
                            center_x=_map_obj['center']['x'],
                            center_y=_map_obj['center']['y'],
                            projection=_map_obj['projection'],
                            zoom=_map_obj['zoom'],
                            srid=_map_obj['projection'])
                        if 'bbox' in _map_obj:
                            if hasattr(map_obj, 'bbox_polygon'):
                                map_obj.bbox_polygon = BBOXHelper.from_xy(_map_obj['bbox']).as_polygon()
                            else:
                                map_obj.bbox_x0 = _map_obj['bbox'][0]
                                map_obj.bbox_y0 = _map_obj['bbox'][1]
                                map_obj.bbox_x1 = _map_obj['bbox'][2]
                                map_obj.bbox_y1 = _map_obj['bbox'][3]
                        map_obj.save()

                        if is_analytics_enabled:
                            event_type = EventType.EVENT_CREATE

                    # Update GeoNode Map
                    _map_conf['map'] = _map_obj
                    map_obj.update_from_viewer(
                        _map_conf,
                        context={'config': _map_conf})

                    if is_analytics_enabled:
                        register_event(caller.request, event_type, map_obj)

                    # Dumps thumbnail from MapStore2 Interface
                    if _map_thumbnail:
                        if _map_thumbnail_format == 'link':
                            map_obj.thumbnail_url = _map_thumbnail
                        else:
                            _map_thumbnail_filename = "map-%s-thumb.%s" % (map_obj.uuid, _map_thumbnail_format)
                            map_obj.save_thumbnail(_map_thumbnail_filename, _map_thumbnail)

                    serializer.validated_data['id'] = map_obj.id
                    serializer.save(user=caller.request.user)
            except Exception as e:
                tb = traceback.format_exc()
                logger.error(tb)
                raise APIException(e)
        else:
            raise APIException("Map Configuration (data) is Mandatory!")

    def perform_create(self, caller, serializer):
        _data = None
        _attributes = None

        try:
            _data = serializer.validated_data['data'].copy()
            serializer.validated_data.pop('data')
        except Exception as e:
            logger.exception(e)
            raise APIException("Map Configuration (data) is Mandatory!")

        try:
            _attributes = serializer.validated_data['attributes'].copy()
            serializer.validated_data.pop('attributes')
        except Exception as e:
            logger.exception(e)
            raise APIException("Map Metadata (attributes) are Mandatory!")

        map_obj = self.get_geonode_map(caller, serializer)
        self.set_geonode_map(caller, serializer, map_obj, _data.copy(), _attributes.copy())

        if _data:
            # Save JSON blob
            GeoNodeSerializer.update_data(serializer, _data.copy())

        if _attributes:
            # Sabe Attributes
            GeoNodeSerializer.update_attributes(serializer, _attributes.copy())

        return serializer.save()

    def perform_update(self, caller, serializer):
        map_obj = self.get_geonode_map(caller, serializer)

        _data = None
        _attributes = None

        if 'data' in serializer.validated_data:
            _data = serializer.validated_data['data'].copy()
            serializer.validated_data.pop('data')

            # Save JSON blob
            GeoNodeSerializer.update_data(serializer, _data.copy())

        if 'attributes' in serializer.validated_data:
            _attributes = serializer.validated_data['attributes'].copy()
            serializer.validated_data.pop('attributes')

            # Sabe Attributes
            GeoNodeSerializer.update_attributes(serializer, _attributes.copy())

        self.set_geonode_map(caller, serializer, map_obj, _data, _attributes)

        return serializer.save()
