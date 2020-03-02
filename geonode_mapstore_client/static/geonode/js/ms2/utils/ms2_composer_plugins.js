// Needs base_plugins and map_viewer_plugins

var MS2_EDIT_PLUGINS = {
	"desktop": [
		// Map from base BackgroundSelector, Identify from map_plugins
		{
			"name": "TOC",
			"cfg": {
				"activateQueryTool": true,
				"activateAddLayerButton": true,
				"activateMetedataTool": false,
				// ### Activate the Group Button in TOC
				"activateAddGroupButton": true,
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
		// Setting, Toolbar, MapLoading, DrawerMenu, Cookie, OmniBar, Expander,
		// Undo, Redo, BurgerMenu, MapFooter, Measure, Print
		// ZoomAll, ZoomIn, ZoomOut from base
		// ScaleBox, FeatureEditor, QueryPanel, MetadataExplorer, GoFull, FullScreen
		// 	Widgets, WidgetsTray, SaveAs, Notifications TOCItemSettings, from map_viewer_plugins

		//  // ###  Add the AddGroup Settings
		"AddGroup",
		{
			"name": "Settings",
			"cfg": {
				"wrap": true
			}
		},
		"WidgetsBuilder",
		"Save"
	]
}