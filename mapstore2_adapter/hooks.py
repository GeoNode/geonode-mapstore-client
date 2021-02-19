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

from .conf import settings
from six import string_types


class HookProxy(object):

    def __getattr__(self, attr):
        if not isinstance(settings.MAPSTORE2_ADAPTER_SERIALIZER, string_types):
            return getattr(settings.MAPSTORE2_ADAPTER_SERIALIZER, attr)
        else:
            import importlib
            cls = settings.MAPSTORE2_ADAPTER_SERIALIZER.split(".")
            module_name, class_name = (".".join(cls[:-1]), cls[-1])
            i = importlib.import_module(module_name)
            hook = getattr(i, class_name)()
            return getattr(hook, attr)


hookset = HookProxy()
