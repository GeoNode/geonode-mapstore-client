import os
import logging
import json

from django import template
from django.conf import settings
from django.contrib.staticfiles.finders import find

logger = logging.getLogger(__name__)
register = template.Library()

@register.simple_tag
def get_local_config():
    local_config_path = 'mapstore/configs/localConfig.json'
    if settings.DEBUG:
        file_path = find(local_config_path)
    else:
        file_path = os.path.join(
            settings.STATIC_ROOT,
            local_config_path
        )
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            print(file_path)
        return data
    except Exception as e:
        logger.error(e)
        return {}
