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

import logging

logger = logging.getLogger(__name__)


class BaseMapStore2ConfigConverter(object):

    def convert(self, viewer, request):
        """
            return {
                "version": 2,
                "widgetsConfig": {
                    ...
                }
                "config": {
                    ...
                }
            }
        """
        raise NotImplementedError()

    def get_overlays(self, viewer):
        """
            return (overlays, selected)
        """
        raise NotImplementedError()

    def get_center_and_zoom(self, view_map, overlay):
        """
            return (center_xy, zoom_level)
        """
        raise NotImplementedError()

    def viewer_json(self, viewer, request):
        raise NotImplementedError()
