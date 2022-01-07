# Structure of directories

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
|    |         |-- configs/
|    |         +-- translations/
|    |-- themes/
|    |    |-- ...
|    |    +-- geonode/
|    |-- ...
|    |-- .env
|    |-- package.json
|    +-- version.txt
|-- static/
|    |-- ...
|    +-- mapstore/
|-- templates/
|    +-- geonode-mapstore-client/
|-- ...
```

## Javascript files

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
|         +-- utils/
|
|-- ...
```
Some directories and files have special behaviors:

- `geonode_mapstore_client/client/js/apps/`: each file in this folder will be compiled as a new entry point so only .js or .jsx files are allowed. eg. `geonode_mapstore_client/client/js/apps/gn-geostory.js` will become a `gn-geostory.js` file in the dist folder.

## Themes files

The `geonode_mapstore_client/client/themes/` folder contains all the [.less](http://lesscss.org/) files needed to compile the MapStore theme with additional customization. Each theme should be placed inside a folder named as the final expected css file and provide a file `theme.less` as entry point:

eg. `geonode_mapstore_client/client/themes/my-theme/theme.less` will become a `my-theme.css` file in the dist folder.

`geonode-mapstore-client` provides one main style called `geonode.css`

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

## Configurations files

The MapStore application needs [configurations](https://mapstore.readthedocs.io/en/latest/developer-guide/local-config/) to load the correct plugins or enable/disable/change functionalities.

We need to provide two main type of configuration:
 - apps and plugins configurations is centralized in `localConfig.json`
 - translations files are located in `geonode_mapstore_client/client/static/mapstore/translations/` folder

```
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

## HTML templates files

The HTML templates represents all the pages where the MapStore client is integrated. All this django html template can be extended or overridden in a geonode project.

The `_geonode_config.html` template is used as base configuration for other templates.

```
geonode_mapstore_client/
|-- ...
|-- templates/
|    |-- geonode-mapstore-client/
|    |    |-- ...
|    |    |-- snippets/
|    |    |    +-- ...
|    |    |-- _geonode_config.html
|    |    |-- catalogue.html
|    |    |-- dashboard_embed.html
|    |    |-- dataset_embed.html
|    |    |-- geostory_embed.html
|    |    +-- map_embed.html
|    |-- base.html
|    |-- index.html
|    +-- page.html
|-- ...
```
