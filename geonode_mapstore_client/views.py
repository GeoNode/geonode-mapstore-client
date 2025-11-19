import os
import json
from rest_framework.views import APIView
from django.shortcuts import render
from django.http import Http404
from django.utils.translation.trans_real import get_language_from_request
from dateutil import parser
from django.conf import settings
from django.templatetags.static import static
from rest_framework.response import Response
from django.core.cache import cache


def _parse_value(value, schema):
    schema_type = schema.get('type')
    format = schema.get('format')
    if schema_type == 'string' and format in ['date-time']:
        if type(value) == str:
            return parser.parse(value)
        return value
    if schema_type == 'string':
        if 'oneOf' in schema:
            for option in schema.get('oneOf'):
                if option.get('const') == value:
                    return option.get('title')
    return value

def _parse_schema_instance(instance, schema):
    schema_type = schema.get('type')
    metadata = {}
    metadata['schema'] = schema
    if schema_type == 'object':
        metadata['value'] = {}
        for key in instance:
            property_schema = None
            if key in schema.get('properties'):
                property_schema = schema.get('properties')[key]
            if instance[key] and property_schema:
                metadata['value'][key] = _parse_schema_instance(instance[key], property_schema)
        return metadata
    if schema_type == 'array':
        metadata['value'] = []
        for entry in instance:
            if schema.get('items'):
                metadata['value'].append(
                    _parse_schema_instance(entry, schema.get('items'))
                )
        return metadata
    metadata['value'] = _parse_value(instance, schema)
    return metadata

def metadata(request, pk, template="geonode-mapstore-client/metadata.html"):

    from geonode.base.models import ResourceBase
    from geonode.metadata.manager import metadata_manager

    lang = get_language_from_request(request)[:2]
    schema = metadata_manager.get_schema(lang)
    resource = ResourceBase.objects.get(pk=pk)
    schema_instance = metadata_manager.build_schema_instance(resource)

    full_metadata = _parse_schema_instance(schema_instance, schema)
    metadata = full_metadata['value']
    metadata_groups = {}

    for key in metadata:
        if key != 'extraErrors':
            property = metadata[key]
            ui_options = property.get('ui:options', {})
            group = 'General'
            if ui_options.get('geonode-ui:group'):
                group = ui_options.get('geonode-ui:group')
            if group not in metadata_groups:
                metadata_groups[group] = { }
            metadata_groups[group][key] = property

    return render(request, template, context={ "resource": resource, "metadata_groups": metadata_groups })

def metadata_embed(request, pk):
    return metadata(request, pk, template="geonode-mapstore-client/metadata_embed.html")



class ExtensionsView(APIView):
    permission_classes = []

    def get(self, request, *args, **kwargs):
        from geonode_mapstore_client.models import Extension
        from geonode_mapstore_client.utils import (
            MAPSTORE_EXTENSIONS_CACHE_KEY,
            MAPSTORE_EXTENSION_CACHE_TIMEOUT,
        )

        cached_data = cache.get(MAPSTORE_EXTENSIONS_CACHE_KEY)
        if cached_data:
            return Response(cached_data)

        final_extensions = {}
        legacy_file_path = os.path.join(
            settings.STATIC_ROOT, "mapstore", "extensions", "index.json"
        )

        try:
            with open(legacy_file_path, "r") as f:
                final_extensions = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            pass

        active_extensions = Extension.objects.filter(active=True)
        dynamic_extensions = {}
        for ext in active_extensions:
            dynamic_extensions[ext.name] = {
                "bundle": f"{ext.name}/index.js",
                "translations": f"{ext.name}/translations",
                "assets": f"{ext.name}/assets",
            }

        final_extensions.update(dynamic_extensions)

        cache.set(
            MAPSTORE_EXTENSIONS_CACHE_KEY,
            final_extensions,
            timeout=MAPSTORE_EXTENSION_CACHE_TIMEOUT,
        )

        return Response(final_extensions)


class PluginsConfigView(APIView):
    permission_classes = []

    def get(self, request, *args, **kwargs):
        from geonode_mapstore_client.models import Extension
        from geonode_mapstore_client.utils import (
            MAPSTORE_PLUGINS_CACHE_KEY,
            MAPSTORE_EXTENSION_CACHE_TIMEOUT,
        )

        cached_data = cache.get(MAPSTORE_PLUGINS_CACHE_KEY)
        if cached_data:
            return Response(cached_data)

        base_config_path = os.path.join(
            settings.STATIC_ROOT, "mapstore", "configs", "pluginsConfig.json"
        )

        config_data = {"plugins": []}

        try:
            with open(base_config_path, "r") as f:
                config_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            pass

        plugins = config_data.get("plugins", [])
        existing_plugin_names = {p.get("name") for p in plugins if isinstance(p, dict)}

        map_extensions = Extension.objects.filter(active=True, is_map_extension=True)

        for ext in map_extensions:
            if ext.name not in existing_plugin_names:
                plugins.append({
                    "name": ext.name,
                    "bundle": f"{ext.name}/index.js",
                    "translations": f"{ext.name}/translations",
                    "assets": f"{ext.name}/assets",
                })

        cache.set(
            MAPSTORE_PLUGINS_CACHE_KEY,
            config_data,
            timeout=MAPSTORE_EXTENSION_CACHE_TIMEOUT,
        )

        return Response({"plugins": plugins})
