import os
import json
import zipfile
from django.core.exceptions import ValidationError
from geoserver.catalog import FailedRequestError
from geonode.geoserver.helpers import gs_catalog
from geonode.layers.models import Dataset
from django.core.cache import cache

MAPSTORE_PLUGINS_CACHE_KEY = "mapstore_plugins_config"
MAPSTORE_EXTENSIONS_CACHE_KEY = "mapstore_extensions_index"
MAPSTORE_EXTENSION_CACHE_TIMEOUT = 60 * 60 * 24 * 1  # 1 day


def set_default_style_to_open_in_visual_mode(instance, **kwargs):
    if isinstance(instance, Dataset):
        style = gs_catalog.get_style(
            instance.name, workspace=instance.workspace
        ) or gs_catalog.get_style(instance.name)
        if style:
            headers = {"Content-type": "application/json", "Accept": "application/json"}
            data = {"style": {"metadata": {"msForceVisual": "true"}}}
            body_href = os.path.splitext(style.body_href)[0] + ".json"

            resp = gs_catalog.http_request(
                body_href, method="put", data=json.dumps(data), headers=headers
            )
            if resp.status_code not in (200, 201, 202):
                raise FailedRequestError(
                    "Failed to update style {} : {}, {}".format(
                        style.name, resp.status_code, resp.text
                    )
                )


def validate_zip_file(file):
    """
    Validates that the uploaded file is a zip and contains the required structure.
    """
    if not zipfile.is_zipfile(file):
        raise ValidationError("File is not a valid zip archive.")

    file.seek(0)
    with zipfile.ZipFile(file, 'r') as zip_ref:
        filenames = zip_ref.namelist()
        required_files = {'index.js', 'index.json'}
        if not required_files.issubset(filenames):
            raise ValidationError("The zip file must contain index.js and index.json at its root.")
    file.seek(0)


def clear_extension_caches():
    """A helper function to clear all MapStore Extension caches."""
    cache.delete(MAPSTORE_EXTENSIONS_CACHE_KEY)
    cache.delete(MAPSTORE_PLUGINS_CACHE_KEY)
    print("MapStore extension caches cleared.")
