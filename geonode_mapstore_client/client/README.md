# GeoNode MapStore Client Project

This directory is the root folder where to initialize all the npm scripts. See the main [README.md](../../README.md) for more information about this directory.

This project contains following applications:

- [MapStore js API](#mapStore-js-api)
- [GeoStory](#geostory)
- [Homepage](#homepage)

## MapStore js API
Api used inside django templates to show map and layer viewers

## GeoStory
This application allow to show and edit stories with map and geospatial data
## Homepage

This single application is an alternative homepage that interact with the GeoNode API v2 and shows available resources. You can enable this app by replacing the content of the index.html of a GeoNode project with the [home.html](home.html) template.

The homepage configuration file is located in [localConfig.json](static/mapstore/configs/localConfig.json) and it exposes specific properties to customize the homepage theme and structure:

### localConfig.json

| property | type | description |  |
| --- | --- | --- | --- |
| `geoNodeApi` | {object} |  |  |
| `supportedLocales` | {object} |  |  |
| `geoNodeConfiguration` | {object} | contains all the configuration needed to change the theme, filters and navbar structures | [see available properties](#geonode-configuration) |

### GeoNode configuration

[localConfig](#geonode-configuration).geoNodeConfiguration

| property | type | description |  |
| --- | --- | --- | --- |
| `theme` | {object} | general theme configuration variables | [see available properties](#theme-configuration) |
| `filters` | {object} | configuration of filter | |
| `filters.order` | {object} | configuration of order dropdown | |
| `filters.order.defaultLabelId` | {string} | label id to use for the order dropdown button | |
| `filters.order.options` | {array} | label id to use for the order dropdown button | [order object entry](#order-object) |
| `filters.extent` | {object} | configuration of extent filter | |
| `filters.extent.layers` | {array} | a list of MapStore layers object used as extent background | |
| `filters.extent.style` | {object} | a MapStore vector style object | |
| `navbar` | {object} | configuration of the brand navbar (top) | |
| `navbar.logo` | {array} | list of logo items | [logo item entry](#logo-item) |
| `navbar.items` | {array} | list of menu item objects, right placement | [menu item object entry](#menu-item-object) |
| `menu` | {object} | configuration of the main menu | |
| `menu.items` | {array} | list of menu item objects, left placement | [menu item object entry](#menu-item-object) |
| `menu.rightItems` | {array} | list of menu item objects, right placement | [menu item object entry](#menu-item-object) |
| `menu.cfg.rightContents.style.width` | {number} | value to fix width in right side of action navbar | [menu item object entry](#menu-item-object) |
| `footer` | {object} | configuration of the footer | |
| `footer.items` | {array} | list of menu item objects, left placement | [menu item object entry](#menu-item-object) |
| `cardsMenu` | {object} | configuration of the menu of resource cards | |
| `cardsMenu.items` | {array} | list of menu item objects, right placement | [menu item object entry](#menu-item-object) |
| `cardOptions` | {object} | configuration of the resource cards dropdown | |
| `cardOptions.items` | {array} | list of menu item objects, dropdown placement | [menu item object entry](#menu-item-object) |
| `filtersForm` | {object} | configuration of the resource cards dropdown | |
| `filtersForm.items` | {array} | list of filter objects, panel placement | [filter object](#filter-object) |
### Theme configuration

[geoNodeConfiguration](#geonode-configuration).theme

| property | type | description |
| --- | --- | --- |
| `variant` | {string} | "light" or "dark" |
| `color` | {string} | main theme color |
| `navbar` | {object} | navbar theme properties |
| `navbar.style` | {object} | a css style object to apply on the navbar container node |
| `hero` | {object} | hero image theme properties |
| `hero.style` | {object} | a css style object to apply on the hero image container node, use backgroundImage css property to apply a background image  |
| `jumbotron` | {object} | jumbotron text content theme properties |
| `jumbotron.style` | {object} | a css style object to apply on the jumbotron container node |
| `languageSelector` | {object} | language selector theme properties |
| `languageSelector.inline` | {boolean} | shows languages as inline text if true, default false shows a dropdown |
| `footer` | {object} | footer theme properties |
| `footer.color` | {string} | footer text color (css variable --gn-footer-color) |
| `footer.bg` | {string} | footer background color (css variable --gn-footer-bg) |
| `footer.link` | {object} | theme for footer link |
| `footer.link.color` | {string} | footer link text color (css variable --gn-footer-link-color) |
| `footer.link.hoverColor` | {string} | footer link text color on hover (css variable --gn-footer-link-hover-color) |
| `footer.style` | {string} | a css style object to apply on the footer container node |

### Order Object

Order object contains properties for an entry of the order dropdown. Configuration:

```js
{
  "labelId": "gnhome.aZ", // message id for the dropdown item
  "value": "title" // value used in the sort filter
}
```
### Logo Item

Logo item contains properties for an image rendered in the top navbar. Configuration:

```js
{
  "src": "path/to/image.png", // image source
  "href": "#/", // logo href
  "style": { // default css style object
    "minHeight": 80
  },
  "sm": { // page size key small screen
    "style": { // small screen css style object
      "minHeight": 40
    }
  },
  "md": { // page size key medium screen
    "style": {} // medium screen css style object
  },
  "lg": { // page size key large screen
    "style": {} // large screen css style object
  }
}
```

### Menu Item Object

Menu item object contains properties for a list item rendered in a menu. Configuration:

- type link
```js
{
  "labelId": "gnhome.register", // label message id
  "type": "link", // one of 'link', 'dropdown', 'divider' or 'filter'
  "href": "/account/signup/?next=/",
  "badge": "{state.layersTotalCount}", // (menu configuration only) counter badge. variable available: layersTotalCount, mapsTotalCount,
  "authenticated": true, // true shows the item only when user authenticated while false only for anonymous user, if undefined the item is always visible
  "permissions": [], // the value in array define the access to the contents
  "allowedRoles": [] // user roles to access  to the contents
}
```

- type dropdown
```js
{
  "labelId": "gnhome.register", // label message id
  "image": "", //the toogle image
  "type": "dropdown", // one of 'link', 'dropdown', 'divider' or 'filter'
  "authenticated": true, // true shows the item only when user authenticated while false only for anonymous user, if undefined the item is always visible
  "permissions": [], // the value in array define the access to the contents
  "allowedRoles": [], // user roles to access  to the contents
  "items": []  // menu items of type link or divider
}
```

- type divider
```js
{
  "type": "divider", // one of 'link', 'dropdown', 'divider' or 'filter'
  "authenticated": true, // true shows the item only when user authenticated while false only for anonymous user, if undefined the item is always visible
  "permissions": [], // the value in array define the access to the contents
  "allowedRoles": [], // user roles to access  to the contents
}
```

- type filter
```js
{
  "type": "filter", // one of 'link', 'dropdown', 'divider' or 'filter'
  "id": "landuse", // unique id of the filter
  "labelId": "gnhome.customFilterExample", // label message id
  "authenticated": true, // true shows the item only when user authenticated while false only for anonymous user, if undefined the item is always visible
  "permissions": [], // the value in array define the access to the contents
  "allowedRoles": [],  // user roles to access  to the contents
  "query": { // query filter to use
    "filter{regions.name.in}": [
        "Global"
    ]
  }
}
```

### Filter Object

Filter object contains properties for a select input rendered inside the filter form. Configurations:

- type select
  - properties for select input with static options:
  ```js
  {
    "id": "title", // filter id used for the request filter{title.in}=
    "labelId": "gnhome.labelId", // message id for select label
    "placeholderId": "gnhome.placeholderId", // message id for select placeholder
    "type": "select",
    "options": [ // list of string values
        "Title 1",
        "Title 2",
        "Title 3",
        "Title 4"
    ]
  }
  ```

  - properties for select input with suggestions request:
  ```js
  {
    "labelId": "gnhome.resourceTypes", // message id for select label
    "placeholderId": "gnhome.resourceTypesPlaceholder", // message id for select placeholder
    "type": "select",
    "suggestionsRequestKey": "resourceTypes" // available 'resourceTypes', 'categories', 'keywords', 'regions' or 'owners'
  }
  ```
- type group
```js
{
  "type": "group",
  "labelId": "gnhome.customFiltersTitle", // label message id
  "authenticated": true, // true shows the item only when user authenticated while false only for anonymous user, if undefined the item is always visible
  "items": [
    //... list of filter objects excluding type group
  ]
}
```
Filter items supports also the following types from [menu object configuration](#menu-item-object): filter, divider and link.