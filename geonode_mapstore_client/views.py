
from django.shortcuts import render
from django.utils.translation.trans_real import get_language_from_request
from dateutil import parser

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

def resource_type_catalog(request, resource_type):
    # TODO: improve mapping method maybe externalize it and improve it
    resource_type_map = {
        'datasets': 'dataset',
        'documents': 'document',
        'maps': 'map',
        'dashboards': 'dashboard',
        'geostories': 'geostory'
    }
    return render(request, "geonode-mapstore-client/resource_type_catalog.html", context={ "title": resource_type, "resource_type": resource_type_map.get(resource_type) })
