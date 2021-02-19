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
from django.conf.urls import url, include

urlpatterns = [
    url(r'^', include('mapstore2_adapter.api.urls')),
]
