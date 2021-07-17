// needs base_plugins
var MS2_MAP_PLUGINS = {
	"desktop": [
		// Map from base
		"BackgroundSelector",
		{
			"name": "Identify",
			"cfg": {
				"viewerOptions": {
					"container": "{context.ReactSwipe}"
				}
			},
			"override": {
				"Toolbar": {
					"position": 11,
					"alwaysVisible": false
				}
			}
		},
		{
			"name": "TOC",
			"cfg": {
				"activateAddLayerButton": true,
				"activateMetedataTool": false,
				"activateSettingsTool": false,
				"activateRemoveLayer": false,
				"spatialOperations": [{
						"id": "INTERSECTS",
						"name": "queryform.spatialfilter.operations.intersects"
					},
					{
						"id": "BBOX",
						"name": "queryform.spatialfilter.operations.bbox"
					},
					{
						"id": "CONTAINS",
						"name": "queryform.spatialfilter.operations.contains"
					},
					{
						"id": "WITHIN",
						"name": "queryform.spatialfilter.operations.within"
					}
				],
				"spatialMethodOptions": [{
						"id": "Viewport",
						"name": "queryform.spatialfilter.methods.viewport"
					},
					{
						"id": "BBOX",
						"name": "queryform.spatialfilter.methods.box"
					},
					{
						"id": "Circle",
						"name": "queryform.spatialfilter.methods.circle"
					},
					{
						"id": "Polygon",
						"name": "queryform.spatialfilter.methods.poly"
					}
				]
			}
		},
		"AddLayer",
		"FilterLayer",
		"ScaleBox",
		// Setting, Toolbar, MapLoading, DrawerMenu, Cookie, OmniBar, Expander,
		// Undo, Redo, BurgerMenu, MapFooter, Measure, Print
		// ZoomAll, ZoomIn, ZoomOut from base
		{
			"name": "FeatureEditor",
			"cfg": {
				"editingAllowedRoles": ["NONE"],
				"canEdit": false
			}
		},
		{
			"name": "QueryPanel",
			"cfg": {
				"activateQueryTool": true,
				"spatialOperations": [{
						"id": "INTERSECTS",
						"name": "queryform.spatialfilter.operations.intersects"
					},
					{
						"id": "BBOX",
						"name": "queryform.spatialfilter.operations.bbox"
					},
					{
						"id": "CONTAINS",
						"name": "queryform.spatialfilter.operations.contains"
					},
					{
						"id": "WITHIN",
						"name": "queryform.spatialfilter.operations.within"
					}
				],
				"spatialMethodOptions": [{
						"id": "Viewport",
						"name": "queryform.spatialfilter.methods.viewport"
					},
					{
						"id": "BBOX",
						"name": "queryform.spatialfilter.methods.box"
					},
					{
						"id": "Circle",
						"name": "queryform.spatialfilter.methods.circle"
					},
					{
						"id": "Polygon",
						"name": "queryform.spatialfilter.methods.poly"
					}
				]
			}
		},
		{
			"name": "MetadataExplorer",
			"cfg": {
				"wrap": true
			}
		},
		{
			"name": "MousePosition",
			"cfg": {
				"editCRS": true,
				"showLabels": true,
				"showToggle": true,
				"filterAllowedCRS": ["EPSG:4326", "EPSG:3857"],
				"additionalCRS": {}
			}
		},
		{
			"name": "Search",
			"cfg": {
				"withToggle": ["max-width: 768px", "min-width: 768px"]
			}
		},
		{
			"name": "GoFull",
			"override": {
				"Toolbar": {
					"alwaysVisible": false
				}
			}
		},
		{
			"name": "FullScreen",
			"override": {
				"Toolbar": {
					"alwaysVisible": false
				}
			}
		},
		{
			"name": "TOCItemsSettings",
			"cfg": {
				"hideTitleTranslations": true,
				"showFeatureInfoTab": false
			}
		},
		"Widgets",
		"WidgetsTray",
		{
			"name": "SaveAs",
			"cfg": {
				"disablePermission": true
			}
		},
		"Notifications",
		"Timeline",
		"Playback",
		"SearchServicesConfig",
		{
			"name": "Share",
			"cfg": {
				"pathTemplate": "/maps/{id}/embed"
			}
		},
		{ "name": "Swipe" },
		{ "name": "Locate" }
	]
}
