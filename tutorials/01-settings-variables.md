
The geonode project provides a settings.py file where it is possible to override some variables supported by the geonode-mapstore-client 

name | description | default value
--- | --- | ---
MAPSTORE_BASELAYERS | list of base layer used in map and dataset viewers | []
MAPSTORE_BASELAYERS_SOURCES | this object defines tilematrix sets for wmts base layers | {}
MAPSTORE_CATALOGUE_SERVICES | catalog services available in the map viewer (keys are service names, values are service config objects with `type`, `url`, `title`, and optional `autoload`) | `{"GeoNode": {"type": "geonode", "url": SITEURL, "autoload": true, "title": "GeoNode"}}`
MAPSTORE_CATALOGUE_SELECTED_SERVICE | key of the catalog service selected by default in the map viewer | `"GeoNode"`
MAPSTORE_DASHBOARD_CATALOGUE_SERVICES | catalog services available in the dashboard viewer (same structure as `MAPSTORE_CATALOGUE_SERVICES`) | same as `MAPSTORE_CATALOGUE_SERVICES` default
MAPSTORE_DASHBOARD_CATALOGUE_SELECTED_SERVICE | key of the catalog service selected by default in the dashboard viewer | `"GeoNode"`
CREATE_LAYER | enables the create layer feature in the map viewer toolbar | False
DEFAULT_MAP_CENTER_X | initial x center position of new map | 0
DEFAULT_MAP_CENTER_Y | initial y center position of new map | 0
DEFAULT_MAP_CRS | crs used by the map and dataset viewers | EPSG:3857
DEFAULT_MAP_ZOOM | initial zoom of new map | 0
DEFAULT_TILE_SIZE | tiles size used by map and dataset viewers by default | 512
DEFAULT_LAYER_FORMAT | tiles format used by map and dataset viewers by default | 'image/png'
THUMBNAIL_SIZE | default size of resource thumbnails | `{"width": 500, "height": 200}`
MAPSTORE_TRANSLATIONS_PATH | list of paths where the client looks for translation files | `["/static/mapstore/ms-translations", "/static/mapstore/gn-translations"]`
MAPSTORE_PROJECTION_DEFS | list of custom projection definitions to register in the client | []
MAPSTORE_PROJECTION_DEFS_ENDPOINT | base URL of a GeoServer instance. Enables the remote projection search feature | SITEURL + '/geoserver' (embedded GeoServer)
CHECK_SESSION_INTERVAL | interval in milliseconds to check if the user session is logged (0 for disable the polling) | 900000 (15 minutes)

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
