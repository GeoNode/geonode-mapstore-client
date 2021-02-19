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

import importlib

from django.conf import settings  # noqa
from django.core.exceptions import ImproperlyConfigured

from appconf import AppConf


def load_path_attr(path):
    i = path.rfind(".")
    module, attr = path[:i], path[i + 1:]
    try:
        mod = importlib.import_module(module)
    except ImportError as e:
        raise ImproperlyConfigured("Error importing {0}: '{1}'".format(module, e))
    try:
        attr = getattr(mod, attr)
    except AttributeError:
        raise ImproperlyConfigured("Module '{0}' does not define a '{1}'".format(module, attr))
    return attr


def is_installed(package):
    try:
        __import__(package)
        return True
    except ImportError:
        return False


class DjangoMapstore2AdapterAppConf(AppConf):

    SERIALIZER = "mapstore2_adapter.plugins.serializers.GeoStoreSerializer"

    def configure_hookset(self, value):
        return load_path_attr(value)()

    class Meta:
        prefix = "mapstore2_adapter"
