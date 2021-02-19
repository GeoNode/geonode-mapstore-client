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
from django.apps import AppConfig as BaseAppConfig
from django.utils.translation import ugettext_lazy as _


class AppConfig(BaseAppConfig):

    name = "mapstore2_adapter"
    label = "mapstore2_adapter"
    verbose_name = _("Django MapStore2 Adapter")

    def ready(self):
        """Finalize setup"""
        # run_setup_hooks()
        super(AppConfig, self).ready()
