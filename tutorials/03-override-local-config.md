
The localConfig.json is the main configuration files for MapStore and can be used to change pages structure by including, updating or removing plugins. The geonode-mapstore-project expose a global function called overrideLocalConfig that allows overrides in a geonode-project.

These are the steps to setup the localConfig override:

- create a new directory named `geonode-mapstore-client` inside the `geonode-project/project-name/templates/` directory

- create a new html template named `_geonode_config.html` inside the `geonode-project/project-name/templates/geonode-mapstore-client/ `directory

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

- add the following block extension in the `_geonode_config.html` template

```django
<!-- _geonode_config.html file in the my_geonode project -->
{% extends 'geonode-mapstore-client/_geonode_config.html' %}
{% block override_local_config %}
<script>
    window.__GEONODE_CONFIG__.overrideLocalConfig = function(localConfig) {
        // this function must return always a valid localConfig json object
        return localConfig;
    };
</script>
{% endblock %}
```

Now the `window.__GEONODE_CONFIG__.overrideLocalConfig` function can be used to override the localConfig json file.

## How to use the overrideLocalConfig function

- Override plugin configuration in a page (plugin configuration available here https://mapstore.geosolutionsgroup.com/mapstore/docs/api/plugins)

Note: not all configuration can be applied to the geonode-mapstore-client because the environment is different from the MapStore product

```django
<!-- _geonode_config.html file in the my_geonode project -->
{% extends 'geonode-mapstore-client/_geonode_config.html' %}
{% block override_local_config %}
<script>
    window.__GEONODE_CONFIG__.overrideLocalConfig = function(localConfig) {
        // an example on how you can apply configuration to existing plugins
        // example: DrawerMenu width (left panel)
        var selectedPluginName = "DrawerMenu";
        var pluginPageName = "map_viewer";

        var TOC_WIDTH = 400;

        // ensure the map layout has the correct size to move the background selector
        // when the layer tree is open
        localConfig.mapLayout.viewer.left.sm = TOC_WIDTH;

        for (var i = 0; i < localConfig.plugins[pluginPageName].length; i++) {
            var currentPlugin = localConfig.plugins[pluginPageName][i];
            var isSelectedPlugin = currentPlugin.name === selectedPluginName;
            if (isSelectedPlugin) {
                // apply configuration to the plugin
                localConfig.plugins[pluginPageName][i] = {
                    "name": selectedPluginName,
                    "cfg": {
                        "menuOptions": {
                            "width": TOC_WIDTH
                        }
                    }
                }
            }
        }
        return localConfig;
    };
</script>
{% endblock %}
```

- Restore a plugin in a page

```django
<!-- _geonode_config.html file in the my_geonode project -->
{% extends 'geonode-mapstore-client/_geonode_config.html' %}
{% block override_local_config %}
<script>
    window.__GEONODE_CONFIG__.overrideLocalConfig = function(localConfig) {
        /*
        "SearchServicesConfig" has been disabled by default but still available
        inside the list of imported plugin.
        It should be enabled only in the pages that contains the "Search" plugin.
        */

        // enable SearchServicesConfig in map viewer
        localConfig.plugins.map_viewer.push({ "name": "SearchServicesConfig" });

        return localConfig;
    };
</script>
{% endblock %}
```


- Remove a plugin from a page

```django
{% extends 'geonode-mapstore-client/_geonode_config.html' %}
{% block override_local_config %}
<script>
    window.__GEONODE_CONFIG__.overrideLocalConfig = function(localConfig) {
        // an example on how you can remove a plugin from configuration
        // example: Measure
        var removePluginName = "Measure";
        var pluginPageName = "map_viewer";
        var newMapPlugins = [];
        for (var i = 0; i < localConfig.plugins[pluginPageName].length; i++) {
            var currentPlugin = localConfig.plugins[pluginPageName][i];
            var isRemovePlugin = currentPlugin.name === removePluginName;
            if (!isRemovePlugin) {
                newMapPlugins.push(currentPlugin);
            }
        }
        // map_edit page used for path /maps/{pk}/edit
        localConfig.plugins[pluginPageName] = newMapPlugins;
        return localConfig;
    };
</script>
{% endblock %}
```

- Update plugin configuration

```html
{% extends 'geonode-mapstore-client/_geonode_config.html' %}
{% block override_local_config %}
<script>
    window.__GEONODE_CONFIG__.overrideLocalConfig = function(localConfig, _) {
        /**
        * this is an example of function used to merge new plugin configuration in the default localConfig
        * if match the plugin name for the GeoNode section, extend or override it
        * if the plugin is new, add it to localConfig
        * Note: you can create your on function or manipulate the localConfig to get your expected final configuration
        * @param {object} config localConfig to update
        * @param {string[]} options.pages array of page keys to target
        * @param {string} options.name name of plugin
        * @param {object} options.cfg new cfg to apply
        */
        function mergePluginConfig(config, options) {
            var pages = options.pages;
            var pluginName = options.name;
            var pluginCfg = options.cfg;
            for (var j = 0; j < pages.length; j++ ) {
                var page = pages[j];
                var plugins = config.plugins[page];
                var merged = false;
                for (var i = 0; i < config.plugins[page].length; i++ ) {
                    var plugin = plugins[i];
                    if (plugin.name === pluginName) {
                        plugin.cfg = _.merge(plugin.cfg, pluginCfg);
                        merged = true;
                        break;
                    }
                }
                if (!merged) {
                    plugins.push({
                        name: pluginName,
                        cfg: pluginCfg
                    })
                }
            }
        }

        mergePluginConfig(localConfig, {
            pages: [ 'map_viewer'],
            name: 'Search',
            cfg: {
                "searchOptions": {
                    "services": [
                        // { "type": "nominatim", "priority": 5 }, // default service
                        {
                            "type": "wfs",
                            "priority": 3,
                            "displayName": "${properties.propToDisplay}",
                            "subTitle": " (a subtitle for the results coming from this service [ can contain expressions like ${properties.propForSubtitle}])",
                            "options": {
                                "url": "{state('settings') && state('settings').geoserverUrl ? state('settings').geoserverUrl + '/wfs' : '/geoserver/wfs'}",
                                "typeName": "workspace:layer",
                                "queriableAttributes": [
                                    "attribute_to_query"
                                ],
                                "sortBy": "id",
                                "srsName": "EPSG:4326",
                                "maxFeatures": 20,
                                "blacklist": [
                                    "... an array of strings to exclude from  the final search filter "
                                ]
                            }
                        }
                    ]
                }
            }
        });
        return localConfig;
    };
</script>
{% endblock %}
```
