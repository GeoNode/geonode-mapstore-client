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
    if settings.LOCKDOWN_GEONODE:
        request = extract_user_from_headers(request)
        return get_auth_token(request.user) or None