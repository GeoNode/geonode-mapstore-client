# Change variables in settings.py

The geonode project provides a settings.py file where it is possible to override some variables supported by the geonode-mapstore-client 

name | description | default value
--- | --- | ---
MAPSTORE_BASELAYERS | list of base layer used in map and dataset viewers | []
MAPSTORE_BASELAYERS_SOURCES | this object defines tilematrix sets for wmts base layers | {}
DEFAULT_MAP_CENTER_X | initial x center position of new map | 0
DEFAULT_MAP_CENTER_Y | initial y center position of new map | 0
DEFAULT_MAP_CRS | crs used by the map and dataset viewers | EPSG:3857
DEFAULT_MAP_ZOOM | initial zoom of new map | 0
DEFAULT_TILE_SIZE | tiles size used by map and dataset viewers by default | 512
DEFAULT_LAYER_FORMAT | tiles format used by map and dataset viewers by default | 'image/png'


An example on how to update the `MAPSTORE_BASELAYERS` variable:

```py
MAPSTORE_BASELAYERS = [
    {
        "type": "osm",
        "title": "Open Street Map",
        "name": "mapnik",
        "source": "osm",
        "group": "background",
        "visibility": True
    },
    {
        "source": "ol",
        "group": "background",
        "id": "none",
        "name": "empty",
        "title": "Empty Background",
        "type": "empty",
        "visibility": False,
        "args": ["Empty Background", {"visibility": False}]
    }
]
```
here you can find documentation related to layer types supported by mapstore: https://mapstore.readthedocs.io/en/latest/developer-guide/maps-configuration/#layer-types
