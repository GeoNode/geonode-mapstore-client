# GeoNode MapStore Client [![Build Status](https://travis-ci.org/GeoNode/geonode-mapstore-client.svg?branch=master)](https://travis-ci.org/GeoNode/geonode-mapstore-client) [![Code Climate](https://codeclimate.com/github/GeoNode/geonode-viewer/badges/gpa.svg)](https://codeclimate.com/github/GeoNode/geonode-viewer) [![Test Coverage](https://codecov.io/gh/GeoNode/geonode/branch/master/graph/badge.svg)](https://codecov.io/gh/GeoNode/geonode/branch/master)

MapStore is an Open Source WebGIS framework based on ReactJS and it can be integrated inside GeoNode as maps, layers and apps viewer. GeoNode 

- [Structure of directories](#structure-of-directories)
- [Running in developer mode](#running-in-developer-mode)
- [Add a new plugin](#add-a-new-plugin)
- [Build the client](#build-the-client)
- [Integrating into GeoNode/Django](#integrating-into-geonode/django)

## Structure of directories

The GeoNode MapStore client is structured in 4 main groups:

- [Javascript files](#javascript-files)
- [Themes files](#themes-files)
- [Configurations files](#configurations-files)
- [HTML templates files](#html-templates-files)

```shell
geonode_mapstore_client/
|-- ...
|-- client/
|    |-- ...
|    |-- js/
|    |-- MapStore2/
|    |-- static/
|    |    +-- mapstore/
|    |         |-- ...
|    |         +-- translations/
|    |-- themes/
|    |    |-- ...
|    |    |-- default/
|    |    +-- preview/
|    |-- ...
|    |-- env.json
|    |-- package.json
|    +-- version.txt
|-- static/
|    |-- ...
|    +-- mapstore/
|-- templates/
|    +-- geonode-mapstore-client/
|-- ...
mapstore2_adapter/
|-- ...
|-- api
|    |-- ...
|    |-- serializers.py  # MapStore2 REST APIs
|    |-- ...
|    |-- views.py
|-- geoapps
|    |-- ...
|    |-- geostories
|    |    |-- ...
|    |    |-- api
|    |    |    |-- ...
|    |    |    |-- serializers.py  # MapStore2/GeoStories REST APIs
|    |    |    |-- ...
|    |    |    |-- views.py
|-- plugins
|    |-- ...
|    |-- geonode.py  # Converts GeoNode Maps into MapStore2 ones
|    |-- serializers.py  # Converts MapStore2 maps into a Model (MapStoreResource <--> Map)
```

### Javascript files

The `geonode_mapstore_client/client/js/` folder contains all the javascript and jsx files needed to build the application. This folder is targeted by babel loader so it's possible to use javascript es6 features inside .js and .jsx files.

The naming of folder is following the directories and files naming conventions used inside [MapStore](https://mapstore.readthedocs.io/en/latest/developer-guide/plugins-architecture/). The directories are subdivided by function: actions, api, components, epics, hooks, observables, plugins, reducers, routes, utils, ... while the files should be related to a specific plugin name if they are not generic:

eg. The Save plugin will have plugins/Save.jsx, components/save/*.jsx, utils/SaveUtils.jsx, actions/save.js, reducers/save.js, epics/save.js and so on.

Below the structure of the `geonode_mapstore_client/client/js/` folder:

```shell
geonode_mapstore_client/
|-- ...
|-- client/
|    |-- ...
|    +-- js/
|         |-- ...
|         |-- actions/
|         |-- api/
|         |-- apps/
|         |-- components/
|         |-- epics/
|         |-- hooks/
|         |-- observables/
|         |-- plugins/
|         |-- reducers/
|         |-- routes/
|         |-- selector/
|         +-- utils/
|
|-- ...
```
Some directories and files have special behaviors:

- `geonode_mapstore_client/client/js/apps/`: each file in this folder will be compiled as a new entry point so only .js or .jsx files are allowed. eg. `geonode_mapstore_client/client/js/apps/gn-geostory.js` will become a `gn-geostory.js` file in the dist folder.

### Themes files

The `geonode_mapstore_client/client/themes/` folder contains all the [.less](http://lesscss.org/) files needed to compile the MapStore theme with additional customization. Each theme should be placed inside a folder named as the final expected css file and provide a file `theme.less` as entry point:

eg. `geonode_mapstore_client/client/themes/my-theme/theme.less` will become a `my-theme.css` file in the dist folder.

`geonode-mapstore-client` provides two main style:
- default.css used by the full page map viewer
- preview.css used by the preview map viewer

```shell
geonode_mapstore_client/
|-- ...
|-- client/
|    |-- ...
|    +-- themes/
|         |-- ...
|         |-- default/
|         |    |-- less/
|         |    |-- theme.less
|         |    +-- variables.less
|         +-- preview/
|              |-- less/
|              |-- theme.less
|              +-- variables.less
|-- ...
```
The language used for the styles is [less](http://lesscss.org/) and it's compatible with the [MapStore theme](https://mapstore.readthedocs.io/en/latest/developer-guide/customize-theme/).

**Note**: there is also a new theme called `geonode` but it's a placeholder for the new [.scss](https://sass-lang.com/) style used by the single page application homepage (experimental).

### Configurations files

The MapStore application needs [configurations](https://mapstore.readthedocs.io/en/latest/developer-guide/local-config/) to load the correct plugins or enable/disable/change functionality. The GeoNode/MapStore integration currently supports two approach one for the MapStore js api (map/layer viewer) and one for the new applications such as geostory and home. Future approach will follow the configuration style of the new application and it will try to align also the map/layer view application.

We need to provide two main type of configuration:
 - apps and plugins configurations is centralized in [localConfig.json](geonode_mapstore_client/client/static/mapstore/configs/localConfig.json)
 - translations: both approaches retrieve custom translations for the geonode client from the `geonode_mapstore_client/client/static/translations/` folder

```shell
geonode_mapstore_client/
|-- ...
|-- client/
|    |-- ...
|    |-- static/
|    |    +-- mapstore/
|    |         |-- configs/
|    |         |    |-- ...
|    |         |    |-- localConfig.json
|    |         |-- img/
|    |         +-- translations/
|    |              |-- ...
|    |              |-- data.de-DE.json
|    |              |-- data.en-US.json
|    |              |-- data.es-ES.json
|    |              |-- data.fr-FR.json
|    |              +-- data.it-IT.json
|    |-- ...
|-- static/
|    |-- ...
|    +-- mapstore/ (only compiled files here from client/ folder 'npm run compile')
|-- ...
```

**Important!**: The `geonode_mapstore_client/static/mapstore/` is the directory with all the final files generated after running the `npm run compile` script inside the `geonode_mapstore_client/client/` folder. Every new file needed in the `geonode_mapstore_client/static/mapstore/` must be placed inside the `geonode_mapstore_client/client/static/mapstore/` directory then the `npm run compile` will move all the needed files in the final destination including the statics.

### HTML templates files

The HTML templates represents all the pages where the MapStore client is integrated. Each template has its own configuration based on the resource type layer, map or app, and for a specific purpose view, edit or embed.

There _geonode_config.html template is used as base configuration for other templates.


```
geonode_mapstore_client/
|-- ...
|-- templates/
|    +-- geonode-mapstore-client/
|         |-- ...
|         |-- app/
|         |    |-- ...
|         |    +-- geostory.html
|         |-- _geonode_config.html
|         |-- app_edit.html
|         |-- app_embed.html
|         |-- app_list.html
|         |-- app_new.html
|         |-- app_view.html
|         |-- layer_data_edit.html
|         |-- layer_detail.html
|         |-- layer_embed.html
|         |-- layer_style_edit.html
|         |-- layer_view.html
|         |-- map_detail.html
|         |-- map_edit.html
|         |-- map_embed.html
|         |-- map_new.html
|         +-- map_view.html
|-- ...
```

## Running in developer mode

### Before starting
In order to develop with GeoNode MapStore client we need a running instance of GeoNode. The GeoNode instance could be local or remote. You could follow this tutorial to setup a local instance of GeoNode: https://docs.geonode.org/en/master/install/advanced/ (suggested).

Needed tools:

- git
- node >= v12.18.4
- npm >= 6.14.6

Steps needed for the initial setup, Open a terminal in your workspace directory and follow these steps to setup the repository locally:

- Clone the repository in your workspace:

`git clone --recursive https://github.com/GeoNode/geonode-mapstore-client.git`

- A new `geonode-mapstore-client/` should be available in your workspace.

Note: ensure the `geonode-mapstore-client/geonode_mapstore_client/client/MapStore2` is not empty. If the `geonode-mapstore-client/geonode_mapstore_client/client/MapStore2` is empty run the command `git submodule update` inside the `geonode-mapstore-client/` directory.

- Change directory to the client folder:

`cd geonode-mapstore-client/geonode_mapstore_client/client/`

- Install all package dependencies with the command:

`npm install`

Now all the client dependencies are installed. The command `npm install` should be used every time there is an update in the [package.json](geonode_mapstore_client/client/package.json) or after switching to a different branch. If the package are not installed correctly you can try to run `npm update` before `npm install`.

### Getting Started

The geonode-mapstore-client uses the webpack dev server to proxy requests of a remote or local instance of GeoNode and to replace only the files used by the MapStore client. Once we have a [running instance of GeoNode](#before-starting) and credentials to work on it we can add some environment variables and start the client in development mode.

These steps are based on the assumption that there is a running instance of GeoNode at the url http://localhost:8000/:

- Edit the config property of [package.json](geonode_mapstore_client/client/package.json) if the host or protocol are different from the default targeted instance of GeoNode:

eg.
```js
{
    ...
    "geonode": {
        "devServer": {
            // host in use by the local dev application
            "host": "localhost",
            // if my GeoNode runs on http://localhost:8000/ use
            "proxyTargetHost": "localhost:8080",
            "protocol": "http"
            // if my GeoNode runs on https://my-geonode/ use
            // "host": "my-geonode",
            // "protocol": "https"
        }
    }
    ...
}
```

- Change directory to the client one:

`cd geonode-mapstore-client/geonode_mapstore_client/client/`

- Start the development application locally:

`npm start`

Now open the url `http://localhost:8081/` to work on the client.

Note: if the protocol is set to https you need to open the url `https://localhost:8081/`.

## Build the client

GeoNode uses directly the bundle compiled and committed in the repository so it's important to compile the client and commit it to the repository. We usually follow this approach:
- 1 make all commits with the changes related to improvements/fixes on the client
- 2 then an additional commit that contains the results of the `npm run compile` script and refer to previously committed changes (message `update client bundle`).

The `npm run compile` script perform following changes to the repository:

- 1 it deletes all content of `geonode_mapstore_client/static/mapstore`
- 2 it creates a version.txt file in the `geonode_mapstore_client/client` directory
- 3 it creates the bundle of all js and css entries and copy them to the `geonode_mapstore_client/static/mapstore/dist` folder
- 4 it copies all static contents of `geonode_mapstore_client/client/static/mapstore` to the directory `geonode_mapstore_client/static/mapstore/`
- 5 it updates the root [package.json](package.json)

These is the summary of needed build steps:

- Commit all previous changes on the source code
- Change directory to the client one:

`cd geonode-mapstore-client/geonode_mapstore_client/client/`

- Run lint script

`npm run lint`

- Run all test

`npm run test`

- Compile the client

`npm run compile`

## Customize and extends the client

There are three ways to customize the GeoNode MapStore client: changing the configuration and/or templates, with a new fork/branch or with geonode-project and @mapstore/project.

Useful links for customization of the MapStore client
- [MapStore documentation](https://mapstore.readthedocs.io/)
- [Framework API](https://mapstore.geo-solutions.it/mapstore/docs/api/framework)
- [Plugins](https://mapstore.geo-solutions.it/mapstore/docs/api/plugins)

### Customization via configurations/templates

It's possible to override the localConfig configuration extending the [_geonode_config.html]() template in your geonode project.
The template needs to be located in the `{geonode-project}/{project-name}/templates/geonode-mapstore-client/` folder:

```
geonode-project/
|-- ...
|-- project-name/
|    |-- ...
|    +-- templates/
|         |-- ...
|         +-- geonode-mapstore-client/
|              +-- _geonode_config.html
|-- ...
```
The extended _geonode_config.html template should set the `__GEONODE_CONFIG__.overrideLocalConfig` function and return the modified localConfig.

Some examples:

- override localConfig properties

```html
{% extends 'geonode-mapstore-client/_geonode_config.html' %}
{% block override_local_config %}
<script>
    window.__GEONODE_CONFIG__.overrideLocalConfig = function(localConfig, _) {
        /*
        _ is a subset of lodash and contains following functions
        {
            mergeWith,
            merge,
            isArray,
            isString,
            isObject,
            castArray,
            get
        }
        */
        return _.mergeWith(localConfig, {
            /* 
            ... my custom configuration
            */
        }, function(objValue, srcValue, key) {
            if (_.isArray(objValue)) {
                return srcValue;
            }
            // supportedLocales is an object so it's merged with the default one
            // so to remove the default languages we should take only the supportedLocales from override
            if (key === 'supportedLocales') {
                return srcValue;
            }
        });
    };
</script>
{% endblock %}
```

- enable plugin

```html
{% extends 'geonode-mapstore-client/_geonode_config.html' %}
{% block override_local_config %}
<script>
    window.__GEONODE_CONFIG__.overrideLocalConfig = function(localConfig) {
        /*
        "SearchServicesConfig" has been disabled by default but still available
        inside the list of imported plugin.
        It should be enabled only in the pages that contains the "Search" plugin.
        */
        // map_edit page used for path /maps/{pk}/edit
        localConfig.plugins.map_edit.push({ "name": "SearchServicesConfig" });
        // map_view page used for path /maps/{pk}/view
        localConfig.plugins.map_view.push({ "name": "SearchServicesConfig" });

        return localConfig;
    };
</script>
{% endblock %}
```

### Customization via fork/branch (advanced)

Create a new fork/branch, apply changes, compile the new client then install the specific branch with pip in the requirement.txt of the geonode-project.

Expected version in requirement.txt
```
-e git+https://github.com/GeoNode/geonode-mapstore-client.git@{commit}#egg=django_geonode_mapstore_client
```

## Integrating into GeoNode/Django

### WARNING: 

- **Deprecated** `django-mapstore-adapter`; this library has been now merged into `django-geonode-mapstore-client`
- You don't have to change anything on your `settings.py` but you will have to **remove** `django-mapstore-adapter` from `requirements.txt` and `setup.cfg`

### Setup

- Execute `pip install django-geonode-mapstore-client --upgrade`

### GeoNode settings update
Update your `GeoNode` > `settings.py` as follows:

```python
# -- START Client Hooksets Setup

# GeoNode javascript client configuration

# default map projection
# Note: If set to EPSG:4326, then only EPSG:4326 basemaps will work.
DEFAULT_MAP_CRS = os.environ.get('DEFAULT_MAP_CRS', "EPSG:3857")

DEFAULT_LAYER_FORMAT = os.environ.get('DEFAULT_LAYER_FORMAT', "image/png")

# Where should newly created maps be focused?
DEFAULT_MAP_CENTER = (os.environ.get('DEFAULT_MAP_CENTER_X', 0), os.environ.get('DEFAULT_MAP_CENTER_Y', 0))

# How tightly zoomed should newly created maps be?
# 0 = entire world;
# maximum zoom is between 12 and 15 (for Google Maps, coverage varies by area)
DEFAULT_MAP_ZOOM = int(os.environ.get('DEFAULT_MAP_ZOOM', 0))

MAPBOX_ACCESS_TOKEN = os.environ.get('MAPBOX_ACCESS_TOKEN', None)
BING_API_KEY = os.environ.get('BING_API_KEY', None)
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', None)

GEONODE_CLIENT_LAYER_PREVIEW_LIBRARY = os.getenv('GEONODE_CLIENT_LAYER_PREVIEW_LIBRARY', 'mapstore')

MAP_BASELAYERS = [{}]

"""
To enable the MapStore2 REACT based Client:
1. pip install pip install django-geonode-mapstore-client>=2.1.0
2. enable those:
"""
if GEONODE_CLIENT_LAYER_PREVIEW_LIBRARY == 'mapstore':
    GEONODE_CLIENT_HOOKSET = os.getenv('GEONODE_CLIENT_HOOKSET', 'geonode_mapstore_client.hooksets.MapStoreHookSet')

    if 'geonode_mapstore_client' not in INSTALLED_APPS:
        INSTALLED_APPS += (
            'mapstore2_adapter',
            'mapstore2_adapter.geoapps',
            'mapstore2_adapter.geoapps.geostories',
            'geonode_mapstore_client',)

    def get_geonode_catalogue_service():
        if PYCSW:
            pycsw_config = PYCSW["CONFIGURATION"]
            if pycsw_config:
                    pycsw_catalogue = {
                        ("%s" % pycsw_config['metadata:main']['identification_title']): {
                            "url": CATALOGUE['default']['URL'],
                            "type": "csw",
                            "title": pycsw_config['metadata:main']['identification_title'],
                            "autoload": True
                         }
                    }
                    return pycsw_catalogue
        return None

    GEONODE_CATALOGUE_SERVICE = get_geonode_catalogue_service()

    MAPSTORE_CATALOGUE_SERVICES = {
        "Demo WMS Service": {
            "url": "https://demo.geo-solutions.it/geoserver/wms",
            "type": "wms",
            "title": "Demo WMS Service",
            "autoload": False
         },
        "Demo WMTS Service": {
            "url": "https://demo.geo-solutions.it/geoserver/gwc/service/wmts",
            "type": "wmts",
            "title": "Demo WMTS Service",
            "autoload": False
        }
    }

    MAPSTORE_CATALOGUE_SELECTED_SERVICE = "Demo WMS Service"

    if GEONODE_CATALOGUE_SERVICE:
        MAPSTORE_CATALOGUE_SERVICES[list(list(GEONODE_CATALOGUE_SERVICE.keys()))[0]] = GEONODE_CATALOGUE_SERVICE[list(list(GEONODE_CATALOGUE_SERVICE.keys()))[0]]
        MAPSTORE_CATALOGUE_SELECTED_SERVICE = list(list(GEONODE_CATALOGUE_SERVICE.keys()))[0]

    DEFAULT_MS2_BACKGROUNDS = [
        {
            "type": "osm",
            "title": "Open Street Map",
            "name": "mapnik",
            "source": "osm",
            "group": "background",
            "visibility": True
        }, {
            "type": "tileprovider",
            "title": "OpenTopoMap",
            "provider": "OpenTopoMap",
            "name": "OpenTopoMap",
            "source": "OpenTopoMap",
            "group": "background",
            "visibility": False
        }, {
            "type": "wms",
            "title": "Sentinel-2 cloudless - https://s2maps.eu",
            "format": "image/jpeg",
            "id": "s2cloudless",
            "name": "s2cloudless:s2cloudless",
            "url": "https://maps.geo-solutions.it/geoserver/wms",
            "group": "background",
            "thumbURL": "%sstatic/mapstorestyle/img/s2cloudless-s2cloudless.png" % SITEURL,
            "visibility": False
       }, {
            "source": "ol",
            "group": "background",
            "id": "none",
            "name": "empty",
            "title": "Empty Background",
            "type": "empty",
            "visibility": False,
            "args": ["Empty Background", {"visibility": False}]
       }
       # Custom XYZ Tile Provider
        # {
        #     "type": "tileprovider",
        #     "title": "Title",
        #     "provider": "custom", // or undefined
        #     "name": "Name",
        #     "group": "background",
        #     "visibility": false,
        #     "url": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        #     "options": {
        #         "subdomains": [ "a", "b"]
        #     }
        # }
    ]

    if MAPBOX_ACCESS_TOKEN:
        BASEMAP = {
            "type": "tileprovider",
            "title": "MapBox streets-v11",
            "provider": "MapBoxStyle",
            "name": "MapBox streets-v11",
            "accessToken": "%s" % MAPBOX_ACCESS_TOKEN,
            "source": "streets-v11",
            "thumbURL": "https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/6/33/23?access_token=%s" % MAPBOX_ACCESS_TOKEN,
            "group": "background",
            "visibility": True
        }
        DEFAULT_MS2_BACKGROUNDS = [BASEMAP,] + DEFAULT_MS2_BACKGROUNDS

    if BING_API_KEY:
        BASEMAP = {
            "type": "bing",
            "title": "Bing Aerial",
            "name": "AerialWithLabels",
            "source": "bing",
            "group": "background",
            "apiKey": "{{apiKey}}",
            "visibility": False
        }
        DEFAULT_MS2_BACKGROUNDS = [BASEMAP,] + DEFAULT_MS2_BACKGROUNDS

    MAPSTORE_BASELAYERS = DEFAULT_MS2_BACKGROUNDS

# -- END Client Hooksets Setup
```

### Update migrations and static files

- Execute `DJANGO_SETTINGS_MODULE=<your_geonode.settings> python manage.py migrate`
- Execute `DJANGO_SETTINGS_MODULE=<your_geonode.settings> python manage.py collectstatic`
