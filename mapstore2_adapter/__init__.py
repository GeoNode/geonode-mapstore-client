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


class DjangoMapstore2AdapterBaseException(Exception):
    """Base class for exceptions in this module."""
    pass


default_app_config = "mapstore2_adapter.apps.AppConfig"
