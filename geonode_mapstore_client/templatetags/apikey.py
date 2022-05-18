# -*- coding: utf-8 -*-
#########################################################################
#
# Copyright 2015-2022, GeoSolutions Sas.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.
#
#########################################################################

import logging
from urllib.parse import urlparse

from django.conf import settings
from geonode.base.auth import extract_user_from_headers, get_auth_token

from django import template

logger = logging.getLogger(__name__)
register = template.Library()


@register.simple_tag()
def generate_proxyurl(_url, request):
    if request:
        apikey = request.GET.get('apikey')
        if apikey:
            pproxyurl = urlparse(_url)
            proxyurl = f'{pproxyurl.path}?apikey={apikey}&{pproxyurl.query}'
            return proxyurl
    return _url


@register.simple_tag()
def retrieve_apikey(request):
    if settings.ENABLE_APIKEY_LOGIN:
        return get_auth_token(request.user) or None
