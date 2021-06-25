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

from __future__ import absolute_import, unicode_literals

from urllib import parse
from six import string_types

try:
    import json
except ImportError:
    from django.utils import simplejson as json

import logging
import traceback

from ..utils import (
    GoogleZoom,
    get_wfs_endpoint,
    get_valid_number,
    to_json)
from ..settings import (
    MAP_BASELAYERS,
    CATALOGUE_SERVICES,
    CATALOGUE_SELECTED_SERVICE)

from ..converters import BaseMapStore2ConfigConverter

from django.contrib.gis.geos import Polygon
from django.contrib.gis.gdal import SpatialReference, CoordTransform
from django.core.serializers.json import DjangoJSONEncoder
from django.conf import settings


logger = logging.getLogger(__name__)

unsafe_chars = {
    '&': '\\u0026',
    '<': '\\u003c',
    '>': '\\u003e',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029'
}

# {layer_param_key: default_value}
"""
 ref. 
https://github.com/geosolutions-it/MapStore2/blob/master/web/client/utils/LayersUtils.js#L485-L541
"""
LAYER_PARAMS = {
    'version': None,
    'visibility': True,
    'singleTile': False,
    'selected': False,
    'hidden': False,
    'handleClickOnLayer': False,
    'wrapDateLine': False,
    'hideLoading': False,
    'useForElevation': False,
    'fixed': False,
    'opacity': 1.0,
    'transparent': True,
    'tiled': True,
    'title': '',
    'name': '',
    'description': '',
    'store': '',
    'group': '',
    'format': "image/png",
    'tileSize': None,
    'maxZoom': None,
    'maxNativeZoom': None,
    'maxResolution': None,
    'minResolution': None,
    'disableResolutionLimits': None,
    'dimensions': None,
    'search': None,
    'style': None,
    'styles': None,
    'styleName': None,
    'availableStyles': None,
    'layerFilter': None,
    'thumbURL': None,
    'allowedSRS': None,
    'matrixIds': None,
    'tileMatrixSet': None,
    'requestEncoding': None,
    'queryable': None,
    'catalogURL': None,
    'capabilitiesURL': None,
    'origin': None,
    'thematic': None,
    'tooltipOptions': None,
    'tooltipPlacement': None,
    'legendOptions': None,
    'extraParams': None
}

class GeoNodeMapStore2ConfigConverter(BaseMapStore2ConfigConverter):

    def convert(self, viewer, request):
        """
            input: GeoNode JSON Gxp Config
            output: MapStore2 compliant str(config)
        """
        # Initialization
        viewer_obj = viewer
        if isinstance(viewer_obj, str):
            viewer_obj = json.loads(viewer_obj)
        if isinstance(viewer_obj, str):
            viewer_obj = json.loads(viewer_obj)

        map_id = None
        if 'id' in viewer_obj and viewer_obj['id']:
            try:
                map_id = int(viewer_obj['id'])
            except Exception:
                pass

        data = {}
        data['version'] = 2

        # Map Definition
        try:
            # Map Definition
            ms2_map = {}
            ms2_map['projection'] = viewer_obj['map']['projection']
            ms2_map['units'] = viewer_obj['map']['units']
            ms2_map['zoom'] = viewer_obj['map']['zoom'] if viewer_obj['map']['zoom'] > 0 else 2
            ms2_map['maxExtent'] = viewer_obj['map']['maxExtent']
            ms2_map['maxResolution'] = viewer_obj['map']['maxResolution']

            # Backgrouns
            backgrounds = self.getBackgrounds(viewer, MAP_BASELAYERS)
            if backgrounds:
                ms2_map['layers'] = backgrounds
            else:
                ms2_map['layers'] = MAP_BASELAYERS + [
                    # TODO: covnert Viewer Background Layers
                    # Add here more backgrounds e.g.:
                    # {
                    # 	"type": "wms",
                    # 	"url": "https://demo.geo-solutions.it/geoserver/wms",
                    # 	"visibility": True,
                    # 	"opacity": 0.5,
                    # 	"title": "Weather data",
                    # 	"name": "nurc:Arc_Sample",
                    # 	"group": "Meteo",
                    # 	"format": "image/png",
                    # 	"bbox": {
                    # 		"bounds": {
                    # 			"minx": -25.6640625,
                    # 			"miny": 26.194876675795218,
                    # 			"maxx": 48.1640625,
                    # 			"maxy": 56.80087831233043
                    # 		},
                    # 		"crs": "EPSG:4326"
                    # 	}
                    # }, ...
                ]

            if settings.BING_API_KEY:
                ms2_map['bingApiKey'] = settings.BING_API_KEY

            # Security Info
            info = {}
            info['canDelete'] = False
            info['canEdit'] = False
            info['description'] = viewer_obj['about']['abstract']
            info['id'] = map_id
            info['name'] = viewer_obj['about']['title']
            ms2_map['info'] = info

            # Overlays
            overlays, selected = self.get_overlays(viewer, request=request)
            if selected and 'name' in selected and selected['name'] and not map_id:
                # We are generating a Layer Details View
                center, zoom = self.get_center_and_zoom(viewer_obj['map'], selected)
                ms2_map['center'] = center
                ms2_map['zoom'] = zoom

                try:
                    # - extract from GeoNode guardian
                    from geonode.layers.views import (_resolve_layer,
                                                      _PERMISSION_MSG_MODIFY,
                                                      _PERMISSION_MSG_DELETE)
                    if _resolve_layer(request,
                                      selected['name'],
                                      'base.change_resourcebase',
                                      _PERMISSION_MSG_MODIFY
                                      ).user_can(request.user, 'base.change_resourcebase'):
                        info['canEdit'] = True

                    if _resolve_layer(request,
                                      selected['name'],
                                      'base.delete_resourcebase',
                                      _PERMISSION_MSG_DELETE
                                      ).user_can(request.user, 'base.delete_resourcebase'):
                        info['canDelete'] = True
                except Exception:
                    tb = traceback.format_exc()
                    logger.debug(tb)
            else:
                # We are getting the configuration of a Map
                # On GeoNode model the Map Center is always saved in 4326
                _x = get_valid_number(viewer_obj['map']['center'][0])
                _y = get_valid_number(viewer_obj['map']['center'][1])
                _crs = 'EPSG:4326'
                if _x > 360.0 or _x < -360.0:
                    _crs = viewer_obj['map']['projection']
                ms2_map['center'] = {
                    'x': _x,
                    'y': _y,
                    'crs': _crs
                }
                try:
                    # - extract from GeoNode guardian
                    from geonode.maps.views import (_resolve_map,
                                                    _PERMISSION_MSG_SAVE,
                                                    _PERMISSION_MSG_DELETE)
                    if _resolve_map(request,
                                    str(map_id),
                                    'base.change_resourcebase',
                                    _PERMISSION_MSG_SAVE
                                    ).user_can(request.user, 'base.change_resourcebase'):
                        info['canEdit'] = True

                    if _resolve_map(request,
                                    str(map_id),
                                    'base.delete_resourcebase',
                                    _PERMISSION_MSG_DELETE
                                    ).user_can(request.user, 'base.delete_resourcebase'):
                        info['canDelete'] = True
                except Exception:
                    tb = traceback.format_exc()
                    logger.debug(tb)

            for overlay in overlays:
                if 'name' in overlay and overlay['name']:
                    ms2_map['layers'].append(overlay)

            data['map'] = ms2_map
        except Exception:
            # traceback.print_exc()
            tb = traceback.format_exc()
            logger.debug(tb)

        # Additional Configurations
        if map_id:
            from mapstore2_adapter import fixup_map
            from mapstore2_adapter.api.models import MapStoreResource
            try:
                fixup_map(map_id)
                ms2_resource = MapStoreResource.objects.get(id=map_id)
                ms2_map_data = ms2_resource.data.blob
                if isinstance(ms2_map_data, string_types):
                    ms2_map_data = json.loads(ms2_map_data)
                if 'map' in ms2_map_data:
                    for _k, _v in ms2_map_data['map'].items():
                        if _k not in data['map']:
                            data['map'][_k] = ms2_map_data['map'][_k]
                    del ms2_map_data['map']
                data.update(ms2_map_data)
            except Exception:
                # traceback.print_exc()
                tb = traceback.format_exc()
                logger.debug(tb)

        # Default Catalogue Services Definition
        try:
            ms2_catalogue = {}
            ms2_catalogue['selectedService'] = CATALOGUE_SELECTED_SERVICE
            ms2_catalogue['services'] = CATALOGUE_SERVICES
            data['catalogServices'] = ms2_catalogue
        except Exception:
            # traceback.print_exc()
            tb = traceback.format_exc()
            logger.debug(tb)

        json_str = json.dumps(data, cls=DjangoJSONEncoder, sort_keys=True)
        for (c, d) in unsafe_chars.items():
            json_str = json_str.replace(c, d)

        return json_str

    def getBackgrounds(self, viewer, defaults):
        import copy
        backgrounds = copy.deepcopy(defaults)
        def_background = None
        for bg in backgrounds:
            if bg['visibility']:
                def_background = bg
                break
        try:
            viewer_obj = json.loads(viewer)
            layers = viewer_obj['map']['layers']
            for bg in backgrounds:
                bg['visibility'] = False
            any_visible = False
            for layer in layers:
                if 'group' in layer and layer['group'] == "background" and layer['visibility']:
                    def_local_background = [bg for bg in backgrounds if bg['name'] == layer['name']]
                    def_background = def_local_background[0] if def_local_background else None
                    if def_background:
                        def_background['opacity'] = layer['opacity'] if 'opacity' in layer else 1.0
                        def_background['visibility'] = True
                        any_visible = True
                        break
            if any_visible and def_background:
                for bg in backgrounds:
                    if bg['name'] == def_background['name']:
                        bg['visibility'] = True
                        break
            else:
                backgrounds = copy.deepcopy(defaults)
        except Exception:
            # traceback.print_exc()
            backgrounds = copy.copy(defaults)
            tb = traceback.format_exc()
            logger.debug(tb)
        return backgrounds

    def get_overlays(self, viewer, request=None):
        overlays = []
        selected = None
        try:
            viewer_obj = json.loads(viewer)
            layers = viewer_obj['map']['layers']
            sources = viewer_obj['sources']

            for layer in layers:
                if 'group' not in layer or layer['group'] != "background":
                    source = sources[layer['source']]
                    overlay = {}
                    if 'url' in source:
                        if 'ptype' not in source or source['ptype'] != 'gxp_arcrestsource': 
                            overlay['type'] = "wms" 
                            overlay['tileSize'] = getattr(settings, "DEFAULT_TILE_SIZE", 512)
                        else:
                            overlay['type'] = "arcgis"
                        _p_url = parse.urlparse(source['url'])
                        if _p_url.query:
                            overlay['params'] = dict(parse.parse_qsl(_p_url.query))
                        overlay['url'] = source['url']
                        overlay['bbox'] = {}

                        for _key, _default in LAYER_PARAMS.items():
                            if _key in layer:
                                overlay[_key] = layer[_key]
                            elif _default:
                                overlay[_key] = _default

                        if 'capability' in layer:
                            capa = layer['capability']
                            if 'store' in capa:
                                overlay['store'] = capa['store']
                            if 'styles' in capa:
                                overlay['styles'] = capa['styles']
                            if 'style' in capa:
                                overlay['style'] = capa['style']
                            if 'abstract' in capa:
                                overlay['abstract'] = capa['abstract']
                            if 'attribution' in capa:
                                overlay['attribution'] = capa['attribution']
                            if 'keywords' in capa:
                                overlay['keywords'] = capa['keywords']
                            if 'dimensions' in capa and capa['dimensions']:
                                overlay['dimensions'] = self.get_layer_dimensions(dimensions=capa['dimensions'])
                            if 'storeType' in capa and capa['storeType'] == 'dataStore':
                                overlay['search'] = {
                                    "url": get_wfs_endpoint(request),
                                    "type": "wfs"
                                }
                            if 'llbbox' in capa:
                                bbox = capa['llbbox']
                                # Must be in the form xmin, ymin, xmax, ymax
                                llbbox = [
                                    get_valid_number(bbox[0]),
                                    get_valid_number(bbox[2]),
                                    get_valid_number(bbox[1]),
                                    get_valid_number(bbox[3]),
                                ]
                                overlay['llbbox'] = llbbox
                                overlay['bbox']['bounds'] = {
                                    "minx": llbbox[0],
                                    "miny": llbbox[1],
                                    "maxx": llbbox[2],
                                    "maxy": llbbox[3]
                                }
                                overlay['bbox']['crs'] = 'EPSG:4326'
                            elif 'bbox' in capa:
                                bbox = capa['bbox']
                                if viewer_obj['map']['projection'] in bbox:
                                    proj = viewer_obj['map']['projection']
                                    bbox = capa['bbox'][proj]
                                    overlay['bbox']['bounds'] = {
                                        "minx": get_valid_number(bbox['bbox'][0]),
                                        "miny": get_valid_number(bbox['bbox'][1]),
                                        "maxx": get_valid_number(bbox['bbox'][2]),
                                        "maxy": get_valid_number(bbox['bbox'][3])
                                    }
                                    overlay['bbox']['crs'] = bbox['srs']

                        if 'nativeCrs' in layer:
                            overlay['nativeCrs'] = layer['nativeCrs']
                        else:
                            try:
                                from geonode.layers.models import Layer
                                _gn_layer = Layer.objects.get(
                                    store=overlay['store'],
                                    alternate=overlay['name'])
                                if _gn_layer.srid:
                                    overlay['nativeCrs'] = _gn_layer.srid
                            except Exception:
                                tb = traceback.format_exc()
                                logger.debug(tb)

                        if 'bbox' in layer and not overlay['bbox']:
                            if 'bounds' in layer['bbox']:
                                overlay['bbox'] = layer['bbox']
                            else:
                                overlay['bbox']['bounds'] = {
                                    "minx": get_valid_number(layer['bbox'][0],
                                                             default=layer['bbox'][2],
                                                             complementar=True),
                                    "miny": get_valid_number(layer['bbox'][1],
                                                             default=layer['bbox'][3],
                                                             complementar=True),
                                    "maxx": get_valid_number(layer['bbox'][2],
                                                             default=layer['bbox'][0],
                                                             complementar=True),
                                    "maxy": get_valid_number(layer['bbox'][3],
                                                             default=layer['bbox'][1],
                                                             complementar=True)
                                }
                                overlay['bbox']['crs'] = layer['srs'] if 'srs' in layer else \
                                    viewer_obj['map']['projection']

                        if 'ftInfoTemplate' in layer and layer['ftInfoTemplate']:
                            featureInfo = {'format': 'TEMPLATE'}
                            featureInfo['template'] = layer['ftInfoTemplate']
                            overlay['featureInfo'] = featureInfo
                        elif 'getFeatureInfo' in layer and layer['getFeatureInfo']:
                            if 'fields' in layer['getFeatureInfo'] and layer['getFeatureInfo']['fields'] and \
                                    'propertyNames' in layer['getFeatureInfo'] and \
                                    layer['getFeatureInfo']['propertyNames']:
                                fields = layer['getFeatureInfo']['fields']
                                propertyNames = layer['getFeatureInfo']['propertyNames']
                                displayTypes = layer['getFeatureInfo']['displayTypes'] if 'displayTypes' in layer['getFeatureInfo'] else dict()
                                featureInfo = {'format': 'TEMPLATE'}

                                _template = '<div>'
                                for _field in fields:
                                    _label = propertyNames[_field] if propertyNames[_field] else _field
                                    _template += '<div class="row">'

                                    if _field in displayTypes and displayTypes[_field] == 'type_href':
                                        _template += '<div class="col-xs-6" style="font-weight: bold; word-wrap: break-word;">%s:</div> \
                                            <div class="col-xs-6" style="word-wrap: break-word;"><a href="${properties.%s}" target="_new">${properties.%s}</a></div>' % \
                                            (_label, _field, _field)
                                    elif _field in displayTypes and displayTypes[_field] == 'type_image':
                                        _template += '<div class="col-xs-12" align="center" style="font-weight: bold; word-wrap: break-word;"> \
                                            <a href="${properties.%s}" target="_new"><img width="100%%" height="auto" src="${properties.%s}" title="%s" alt="%s"/></a></div>' % \
                                            (_field, _field, _label, _label)
                                    elif _field in displayTypes and 'type_video' in displayTypes[_field]:
                                        if 'youtube' in displayTypes[_field]:
                                            _template += '<div class="col-xs-12" align="center" style="font-weight: bold; word-wrap: break-word;"> \
                                                <iframe src="${properties.%s}" width="100%%" height="360" frameborder="0" allowfullscreen></iframe></div>' % \
                                                (_field)
                                        else:
                                            _type = "video/%s" % (displayTypes[_field][11:])
                                            _template += '<div class="col-xs-12" align="center" style="font-weight: bold; word-wrap: break-word;"> \
                                                <video width="100%%" height="360" controls><source src="${properties.%s}" type="%s">Your browser does not support the video tag.</video></div>' % \
                                                (_field, _type)
                                    elif _field in displayTypes and displayTypes[_field] == 'type_audio':
                                        _template += '<div class="col-xs-12" align="center" style="font-weight: bold; word-wrap: break-word;"> \
                                            <audio controls><source src="${properties.%s}" type="audio/mpeg">Your browser does not support the audio element.</audio></div>' % \
                                            (_field)
                                    elif _field in displayTypes and displayTypes[_field] == 'type_iframe':
                                        _template += '<div class="col-xs-12" align="center" style="font-weight: bold; word-wrap: break-word;"> \
                                            <iframe src="/proxy/?url=${properties.%s}" width="100%%" height="360" frameborder="0" allowfullscreen></iframe></div>' % \
                                            (_field)
                                    else:
                                        _template += '<div class="col-xs-6" style="font-weight: bold; word-wrap: break-word;">%s:</div> \
                                            <div class="col-xs-6" style="word-wrap: break-word;">${properties.%s}</div>' % \
                                            (propertyNames[_field] if propertyNames[_field] else _field, _field)

                                    _template += '</div>'
                                _template += '</div>'

                                featureInfo['template'] = _template
                                overlay['featureInfo'] = featureInfo
                    elif 'name' in layer and layer['name'] == 'Annotations':
                        overlay = layer

                    # Restore the id of ms2 layer
                    if "extraParams" in layer and "msId" in layer["extraParams"]:
                        overlay["id"] = layer["extraParams"]["msId"]
                    overlays.append(overlay)
                    if not selected or ('selected' in layer and layer['selected']):
                        selected = overlay
        except Exception:
            tb = traceback.format_exc()
            logger.debug(tb)

        return (overlays, selected)

    def get_layer_dimensions(self, dimensions):
        url = getattr(settings, "GEOSERVER_PUBLIC_LOCATION", "")
        if url.endswith('ows'):
            url = url[:-3]
        url += "gwc/service/wmts"
        dim = []
        for attr, value in dimensions.items():
            if attr == "time":
                nVal = {"name": attr, "source": {"type": "multidim-extension", "url": url}}
                dim.append(nVal)
            else:
                value["name"] = attr
                dim.append(value)
        return dim

    def get_center_and_zoom(self, view_map, overlay):
        center = {
            "x": get_valid_number(
                overlay['bbox']['bounds']['minx'] + (
                    overlay['bbox']['bounds']['maxx'] - overlay['bbox']['bounds']['minx']
                ) / 2),
            "y": get_valid_number(
                overlay['bbox']['bounds']['miny'] + (
                    overlay['bbox']['bounds']['maxy'] - overlay['bbox']['bounds']['miny']
                ) / 2),
            "crs": overlay['bbox']['crs']
        }
        zoom = view_map['zoom']
        # max_extent = view_map['maxExtent']
        # map_crs = view_map['projection']
        ov_bbox = [get_valid_number(overlay['bbox']['bounds']['minx']),
                   get_valid_number(overlay['bbox']['bounds']['miny']),
                   get_valid_number(overlay['bbox']['bounds']['maxx']),
                   get_valid_number(overlay['bbox']['bounds']['maxy']), ]
        ov_crs = overlay['bbox']['crs']
        (center_m, zoom_m) = self.project_to_WGS84(ov_bbox, ov_crs, center=None)
        if center_m is not None and zoom_m is not None:
            zoom_m = zoom_m if zoom_m > 0 else 1
            return (center_m, zoom_m)
        else:
            return (center, zoom)

    def project_to_WGS84(self, ov_bbox, ov_crs, center=None):
        try:
            srid = int(ov_crs.split(':')[1])
            srid = 3857 if srid == 900913 else srid
            poly = Polygon((
                (ov_bbox[0], ov_bbox[1]),
                (ov_bbox[0], ov_bbox[3]),
                (ov_bbox[2], ov_bbox[3]),
                (ov_bbox[2], ov_bbox[1]),
                (ov_bbox[0], ov_bbox[1])), srid=srid)
            if srid != 4326:
                gcoord = SpatialReference(4326)
                ycoord = SpatialReference(srid)
                trans = CoordTransform(ycoord, gcoord)
                poly.transform(trans)
            try:
                if not center:
                    center = {
                        "x": get_valid_number(poly.centroid.coords[0]),
                        "y": get_valid_number(poly.centroid.coords[1]),
                        "crs": "EPSG:4326"
                    }
                zoom = GoogleZoom().get_zoom(poly) + 1
            except Exception:
                center = (0, 0)
                zoom = 0
                tb = traceback.format_exc()
                logger.debug(tb)
        except Exception:
            tb = traceback.format_exc()
            logger.debug(tb)

        return (center, zoom)

    def viewer_json(self, viewer, request):
        """
            input: MapStore2 compliant str(config)
            output: GeoNode JSON Gxp Config
        """
        # MapStore uses x0,y0,x1,y1 ordering of bbox coords
        viewer = to_json(viewer)
        if viewer.get('map', None) and viewer['map'].get('bbox', None):
            ms2_bbox = viewer['map'].get('bbox')
            config_bbox = [ms2_bbox[0], ms2_bbox[2], ms2_bbox[1], ms2_bbox[3]]
            viewer['map']['bbox'] = config_bbox
        return viewer
