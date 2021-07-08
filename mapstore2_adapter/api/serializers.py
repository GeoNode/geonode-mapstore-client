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

from django.contrib.auth import get_user_model
from rest_framework import serializers

import re
import six
import json
import base64
import logging

logger = logging.getLogger(__name__)


class JSONSerializerField(serializers.Field):
    """ Serializer for JSONField -- required to make field writable"""
    id = serializers.ReadOnlyField()

    def to_internal_value(self, data):
        return data

    def to_representation(self, value):
        data = value.blob if value and hasattr(value, 'blob') else value
        if isinstance(data, six.string_types):
            return json.loads(data)
        return data


class JSONArraySerializerField(serializers.Field):
    """ Serializer for JSONField -- required to make field writable"""
    id = serializers.ReadOnlyField()

    def to_internal_value(self, data):
        return data

    def to_representation(self, value):
        if value:
            attributes = []
            for _a in list(value.all()):
                data = ''
                if re.match(r'b\'(.*)\'', _a.value):
                    data = re.match(r'b\'(.*)\'', _a.value).groups()[0]
                attributes.append({
                    "name": _a.name,
                    "type": _a.type,
                    "label": _a.label,
                    "value": base64.b64decode(data).decode('utf8')
                })
        else:
            attributes = []
        return attributes


class MapLayersJSONArraySerializerField(serializers.Field):

    def to_internal_value(self, data):
        return data

    def to_representation(self, value):
        if value:
            from geonode.maps.models import Map
            from geonode.maps.api.serializers import MapLayerSerializer
            map = Map.objects.get(id=value)
            return MapLayerSerializer(embed=True, many=True).to_representation(map.layers)


class UserSerializer(serializers.HyperlinkedModelSerializer):

    class Meta:
        model = get_user_model()
        fields = ('url', 'username', 'email', 'is_staff', 'is_active', 'is_superuser',)

