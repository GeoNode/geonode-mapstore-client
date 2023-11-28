import os
import logging

from django import template
from django.conf import settings
from django.contrib.staticfiles.finders import find

logger = logging.getLogger(__name__)
register = template.Library()


@register.simple_tag
def client_version():
    version_path = "mapstore/version.txt"
    if settings.DEBUG:
        file_path = find(version_path)
    else:
        file_path = os.path.join(settings.STATIC_ROOT, version_path)
    try:
        with open(file_path, "r") as f:
            version = f.read()
        return version
    except Exception as e:
        logger.error(e)
        return ""
