import os
import json

from geoserver.catalog import FailedRequestError
from geonode.geoserver.helpers import gs_catalog
from geonode.layers.models import Dataset


def set_default_style_to_open_in_visual_mode(instance, **kwargs):
    if isinstance(instance, Dataset):
        style = gs_catalog.get_style(instance.name, workspace=instance.workspace) or \
            gs_catalog.get_style(isinstance.name)
        if style:
            headers = {
                "Content-type": "application/json",
                "Accept": "application/json"
            }
            data = {
                "style": {
                    "metadata": {
                        "msForceVisual": "true"
                    }
                }
            }
            body_href = os.path.splitext(style.body_href)[0] + '.json'

            resp = gs_catalog.http_request(body_href, method='put', data=json.dumps(data), headers=headers)
            if resp.status_code not in (200, 201, 202):
                raise FailedRequestError('Failed to update style {} : {}, {}'.format(style.name, resp.status_code, resp.text))
