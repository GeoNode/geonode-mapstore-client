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

```
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
|    |-- geonode/
|    |    +-- js/
|    |         +-- ms2/
|    |              +-- utils/
|    +-- mapstore/
|-- templates/
|    +-- geonode-mapstore-client/
|-- ...
```

### Javascript files

The `geonode_mapstore_client/client/js/` folder contains all the javascript and jsx files needed to build the application. This folder is targeted by babel loader so it's possible to use javascript es6 features inside .js and .jsx files.

The naming of folder is following the directories and files naming conventions used inside [MapStore](https://mapstore.readthedocs.io/en/latest/developer-guide/plugins-architecture/). The directories are subdivided by function: actions, api, components, epics, hooks, observables, plugins, reducers, routes, utils, ... while the files should be related to a specific plugin name if they are not generic:

eg. The Save plugin will have plugins/Save.jsx, components/save/*.jsx, utils/SaveUtils.jsx, actions/save.js, reducers/save.js, epics/save.js and so on.

Below the structure of the `geonode_mapstore_client/client/js/` folder:

```
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
|         |-- utils/
|         |-- api.js
|         |-- plugins.js
|         +-- previewPlugins.js
|
|-- ...
```
Some directories and files have special behaviors:

- `geonode_mapstore_client/client/js/apps/`: each file in this folder will be compiled as a new entry point so only .js or .jsx files are allowed. eg. `geonode_mapstore_client/client/js/apps/gn-geostory.js` will become a `gn-geostory.js` file in the dist folder.
- `geonode_mapstore_client/client/js/api.js`:  entry point for the custom js api of MapStore used in the GeoNode template as map viewer. This compiled name of this file is `ms2-geonode-api.js`
- `geonode_mapstore_client/client/js/plugins.js`: list of MapStore plugins available inside the full page map viewer
- `geonode_mapstore_client/client/js/previewPlugins.js`: list of MapStore plugins available inside the preview map viewer

### Themes files

The `geonode_mapstore_client/client/themes/` folder contains all the [.less](http://lesscss.org/) files needed to compile the MapStore theme with additional customization. Each theme should be placed inside a folder named as the final expected css file and provide a file `theme.less` as entry point:

eg. `geonode_mapstore_client/client/themes/my-theme/theme.less` will become a `my-theme.css` file in the dist folder.

`geonode-mapstore-client` provides two main style:
- default.css used by the full page map viewer
- preview.css used by the preview map viewer

```
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

 - plugins and app configurations: this includes list of needed plugin in a page and customization of functionalities:
   - js api imports a combination of files from the directory `geonode_mapstore_client/static/geonode/js/ms2/utils/` inside the templates. The files inside `geonode_mapstore_client/static/geonode/js/ms2/utils/` are list of plugins grouped by purpose: view, embed or edit. There is also an additional app configuration in the _config.html template.
   - new app imports static configuration from json files of the `geonode_mapstore_client/client/static/mapstore/configs/` folder or centralize the configuration in the correspondent template (see [geostory.html](geonode_mapstore_client/templates/geonode-mapstore-client/app/geostory.html)).
 - translations: both approaches retrieve custom translations for the geonode client from the `geonode_mapstore_client/client/static/translations/` folder

```
geonode_mapstore_client/
|-- ...
|-- client/
|    |-- ...
|    |-- static/
|    |    +-- mapstore/
|    |         |-- configs/ (new app)
|    |         |-- img/ (new app)
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
|    |-- geonode/
|    |    +-- js/
|    |         +-- ms2/
|    |              +-- utils/
|    |                   |-- ms2_base_plugins.js (js api)
|    |                   |-- ms2_composer_plugins.js (js api)
|    |                   |-- ms2_map_embed_plugins.js (js api)
|    |                   |-- ms2_map_viewer_plugins.js (js api)
|    |                   |-- ms2_viewer_plugins.js (js api)
|    |                   +-- thumbnail.js (js api)
|    +-- mapstore/ (only compiled files here from client/ folder 'npm run compile')
|-- ...
```

**Important!**: The `geonode_mapstore_client/static/mapstore/` is the directory with all the final files generated after running the `npm run compile` script inside the `geonode_mapstore_client/client/` folder. Every new file needed in the `geonode_mapstore_client/static/mapstore/` must be placed inside the `geonode_mapstore_client/client/static/mapstore/` directory then the `npm run compile` will move all the needed files in the final destination including the statics.

### HTML templates files

The HTML templates represents all the pages where the MapStore client is integrated. Each template has its own configuration based on the resource type layer, map or app, and for a specific purpose view, edit or embed.

There are special templates used as base configuration for other templates: _config.html and base_ms.html.


```
geonode_mapstore_client/
|-- ...
|-- templates/
|    +-- geonode-mapstore-client/
|         |-- ...
|         |-- app/
|         |    |-- ...
|         |    +-- geostory.html
|         |-- _client_composer_js.html (deprecated)
|         |-- _client_viewer_js.html (deprecated)
|         |-- _config.html
|         |-- app_edit.html
|         |-- app_embed.html
|         |-- app_list.html
|         |-- app_new.html
|         |-- app_view.html
|         |-- base_ms.html
|         |-- edit_map.html
|         |-- layer_edit.html
|         |-- layer_map.html
|         |-- layer_style_edit.html
|         |-- layer_view.html
|         |-- map_detail.html
|         |-- map_embed.html
|         |-- map_new.html
|         +-- map_view.html
|-- ...
```

List of templates based on the resource type:

- Layers - templates in use _config.html, base_ms.html, layer_edit.html, layer_map.html, layer_style_edit.html and layer_view.html

- Maps - templates in use _config.html, base_ms.html, edit_map.html, map_detail.html, map_embed.html, map_new.html and map_view.html

- Apps - app_edit.html, app_embed.html, app_list.html, app_new.html, app_view.html and app/geostory.html

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
            // if my GeoNode runs on http://localhost:8000/ use
            "host": "localhost:8080",
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
- [MapStore JS API](https://mapstore.geo-solutions.it/mapstore/docs/api/jsapi)
- [Plugins](https://mapstore.geo-solutions.it/mapstore/docs/api/plugins)

### Customization via configurations/templates

It's possible to remove and configure plugins by changing configuration and css directly inside templates. See the [configurations files locations](#configurations-files) in the repository and the MapStore documentations about plugins for more information.

### Customization via fork/branch (advanced)

Create a new fork/branch, apply changes, compile the new client then install the specific branch with pip in the requirement.txt of the geonode-project.

Expected version in requirement.txt
```
-e git+https://github.com/GeoNode/geonode-mapstore-client.git@{commit}#egg=django_geonode_mapstore_client
```

### Customization via @mapstore/project (advanced/experimental)

This type of customization has been introduced to be applied to geonode-project and add, replace or remove plugins for the map and layer viewer. This approach is still in development and aim to normalize the way various apps inside geonode-mapstore-client could be customized.

Given a geonode-project with this directories structure:

```
geonode-project/
|-- ...
|-- project-name/
|    |-- ...
|    +-- ...
|-- ...
```

- Navigate to `geonode-project/project-name/`

`cd geonode-project/project-name/`

- Run the create script of `@mapstore/project`

`npx @mapstore/project create geonode`

The script above will create a folder called `client` inside `geonode-project/project-name/` with the following structure:

```
geonode-project/
|-- ...
|-- project-name/
|    |-- ...
|    |-- client/
|    |    |-- js/
|    |    |     |-- ...
|    |    |     |-- apps/
|    |    |     +-- jsapi/
|    |    |          |-- plugins.js
|    |    |          +-- previewPlugins.js
|    |    |-- static/
|    |    |     +-- mapstore/
|    |    |     |    |-- ...
|    |    |          +-- translations/
|    |    |-- themes/
|    |    |     |-- default/
|    |    |     |    |-- ...
|    |    |     |    +-- theme.less
|    |    |     +-- preview/
|    |    |          +-- theme.less
|    |    |-- .gitignore
|    |    |-- package.json
|    |    +-- version.txt
|    +-- ...
|-- ...
```

This new `client/` directory has a similar structure of `geonode-mapstore-client/geonode_mapstore_client/client/` with some special file and folders:

- `client/js/apps/` each .js file in this directory will became an application entry
- `client/js/jsapi/plugins.js` and `client/js/jsapi/previewPlugins.js` this two file have a function that get current plugins imported in mapstore client and should return a plugin list

```js
// example to add a new plugin
import MyCustomPlugin from '../plugins/MyCustomPlugin.jsx';
export const extendPluginsDefinition = ({ plugins,  requires }) =>
    ({
        plugins: {
            ...plugins,
            MyCustomPlugin
        },
        requires
});
```

- `client/static/mapstore/translations` extend translations of the client
- `client/themes/default/theme.less` extend the default theme
- `client/themes/preview/theme.less` extend the preview theme

Inside this client folder it's possible to use the same scripts used in the geonode-mapstore-client `npm start`, `npm run test`, `npm run compile`, ... .

You can run the `npm run compile` to create the new client application in the `static/mapstore` of the geonode-project once the new customizations are applied.

Important!: the branch/commit of the geonode-mapstore-client inside the package.json must be the same of the pip package inside the requirement.txt

expected version in requirement.txt
```
-e git+https://github.com/GeoNode/geonode-mapstore-client.git@{commit}#egg=django_geonode_mapstore_client
```
expected version in client/package.json
```js
"dependencies": {
    ...,
    "geonode-mapstore-client": "git+https://github.com/GeoNode/geonode-mapstore-client.git#{commit}",
    ...
}
```

## Integrating into GeoNode/Django

- Execute `pip install django-mapstore-adapter --upgrade`
- Execute `pip install django-geonode-mapstore-client --upgrade`

### GeoNode settings update
Update your `GeoNode` > `settings.py` as follows:

```
# To enable the MapStore2 based Client enable those
if 'geonode_mapstore_client' not in INSTALLED_APPS:
    INSTALLED_APPS += (
        'geonode_mapstore_client.mapstore2_adapter',
        'geonode_mapstore_client',)

GEONODE_CLIENT_LAYER_PREVIEW_LIBRARY = 'mapstore'  # DEPRECATED use HOOKSET instead
GEONODE_CLIENT_HOOKSET = "geonode_mapstore_client.hooksets.MapStoreHookSet"

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
    MAPSTORE_CATALOGUE_SERVICES[list(GEONODE_CATALOGUE_SERVICE.keys())[0]] = GEONODE_CATALOGUE_SERVICE[list(GEONODE_CATALOGUE_SERVICE.keys())[0]]
    MAPSTORE_CATALOGUE_SELECTED_SERVICE = list(GEONODE_CATALOGUE_SERVICE.keys())[0]

DEFAULT_MS2_BACKGROUNDS = [{
        "type": "osm",
        "title": "Open Street Map",
        "name": "mapnik",
        "source": "osm",
        "group": "background",
        "visibility": True
    },
    {
        "group": "background",
        "name": "osm",
        "source": "mapquest",
        "title": "MapQuest OSM",
        "type": "mapquest",
        "visibility": False
    }
]

MAPSTORE_BASELAYERS = DEFAULT_MS2_BACKGROUNDS

if 'geonode.geoserver' in INSTALLED_APPS:
    LOCAL_GEOSERVER = {
        "type": "wms",
        "url": OGC_SERVER['default']['PUBLIC_LOCATION'] + "wms",
        "visibility": True,
        "title": "Local GeoServer",
        "group": "background",
        "format": "image/png8",
        "restUrl": "/gs/rest"
    }
```

### Update migrations and static files

- Execute `DJANGO_SETTINGS_MODULE=<your_geonode.settings> python manage.py migrate`
- Execute `DJANGO_SETTINGS_MODULE=<your_geonode.settings> python manage.py collectstatic`
