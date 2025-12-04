
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
        // example: How to change configuration of visible properties in all ResourceDetails
        // in this example the configuration is using expression to provide value,
        // learn more about MapStore dynamic configuration at:
        // https://docs.mapstore.geosolutionsgroup.com/en/latest/developer-guide/plugins-documentation/#dynamic-configuration
        Object.keys(localConfig.plugins).forEach((pageName) => {
            localConfig.plugins[pageName].forEach((plugin) => {
                if (['ResourceDetails'].includes(plugin.name)) {
                    plugin.cfg = {
                        ...plugin.cfg,
                        "tabs": [
                            {
                                "type": "tab",
                                "id": "info",
                                "labelId": "gnviewer.info",
                                "items": [
                                    {
                                        "type": "text",
                                        "labelId": "gnviewer.title",
                                        "value": "{context.get(state('gnResourceData'), 'title')}"
                                    }
                                ]
                            },
                            {
                                "type": "locations",
                                "id": "locations",
                                "labelId": "gnviewer.locations",
                                "items": "{({extent: context.get(state('gnResourceData'), 'extent')})}"
                            },
                            {
                                "type": "relations",
                                "id": "related",
                                "labelId": "gnviewer.linkedResources.label",
                                "items": "{context.get(state('gnResourceData'), 'linkedResources')}"
                            },
                            {
                                "type": "assets",
                                "id": "assets",
                                "labelId": "gnviewer.assets",
                                "items": "{context.get(state('gnResourceData'), 'assets')}",
                                "disableIf": "{!context.resourceHasPermission(state('gnResourceData'), 'change_resourcebase')}"
                            },
                            {
                                "type": "data",
                                "id": "data",
                                "labelId": "gnviewer.data",
                                "disableIf": "{context.get(state('gnResourceData'), 'resource_type') !== 'dataset'}",
                                "items": "{context.get(state('gnResourceData'), 'attribute_set')}"
                            },
                            {
                                "type": "share",
                                "id": "share",
                                "labelId": "gnviewer.share",
                                "disableIf": "{!context.canAccessPermissions(state('gnResourceData'))}",
                                "items": [true]
                            },
                            {
                                "type": "settings",
                                "id": "settings",
                                "labelId": "gnviewer.settings",
                                "disableIf": "{!context.canManageResourceSettings(state('gnResourceData'))}",
                                "items": [true]
                            }
                        ]
                    }
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
