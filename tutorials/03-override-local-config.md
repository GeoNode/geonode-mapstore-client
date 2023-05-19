
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

```html
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

```html
<!-- _geonode_config.html file in the my_geonode project -->
{% extends 'geonode-mapstore-client/_geonode_config.html' %}
{% block override_local_config %}
<script>
    window.__GEONODE_CONFIG__.overrideLocalConfig = function(localConfig) {
        // an example on how you can apply configuration to existing plugins
        // example: How to change configuration of visible properties in all DetailViewer panels including the one in the catalog (ResourcesGrid)

        Object.keys(localConfig.plugins).forEach((pageName) => {
            localConfig.plugins[pageName].forEach((plugin) => {
                if (['DetailViewer', 'ResourcesGrid'].includes(plugin.name) && plugin.cfg && (plugin.cfg.tabs || plugin.cfg.detailsTabs)) {
                    (plugin.cfg.tabs || plugin.cfg.detailsTabs).forEach((tab) => {
                        if (Array.isArray(tab.items)) {
                            // eg. remove the language row
                            tab.items = tab.items.filter((item) => !['gnviewer.language'].includes(item.labelId));
                        }
                    });
                }
            });
        });
        return localConfig;
    };
</script>
{% endblock %}
```

- Restore a plugin in a page

```html
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
        localConfig.plugins.map_viewer.push({ name: 'SearchServicesConfig' });

        return localConfig;
    };
</script>
{% endblock %}
```


- Remove a plugin from a page

```html
{% extends 'geonode-mapstore-client/_geonode_config.html' %}
{% block override_local_config %}
<script>
    window.__GEONODE_CONFIG__.overrideLocalConfig = function(localConfig) {
        // an example on how you can remove a plugin from configuration
        // example: Remove Measure from the map viewer
        localConfig.plugins['map_viewer'] = localConfig.plugins['map_viewer'].filter(plugin => !['Measure'].includes(plugin.name));
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
        Object.keys(localConfig.plugins).forEach((pageName) => {
            if (['map_viewer'].includes(pageName)) {
                localConfig.plugins[pageName].forEach((plugin) => {
                    if (['Search'].includes(plugin.name)) {
                        plugin.cfg = _.merge(
                            plugin.cfg,
                            {
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
                        );
                    }
                });
            }
        });
        
        return localConfig;
    };
</script>
{% endblock %}
```
