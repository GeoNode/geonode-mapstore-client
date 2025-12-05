Geonode allows for the creation of custom pages to display specific types of resources of interest. In this way, it is possible to create a page with a title and some text, to perhaps, display only dashboards, a particular category or group, etc.

Below are the steps required to create a custom resource grid page:

- create a new html template named `geostory_resources_page.html` inside the `geonode-project-name/src/geonode_project_name/templates/ `directory

```
geonode-project-name/
|-- ...
|-- src/
|    |-- geonode_project_name/
|         |-- ...
|         +-- templates/
|              |-- ...
|              +-- geostory_resources_page.html
|-- ...
```

- add the following block extension in the `geostory_resources_page.html` template

```html
{% extends "geonode-mapstore-client/resource_page_catalog.html" %} 
{% load i18n %}
{% block content %}
    {% comment %}
        The i18n template tag allows to import functionality needed to support translations.
        It is also possible to access information about the current language in use with:

            {% get_current_language as LANG %}

        then the LANG variable can be used inside the template, e.g.:

            <div>{{ LANG }}</div>

    {% endcomment %}
    <div class="gn-resource-page-catalog-section">
        <div class="gn-resource-page-catalog-content">
            <h4>{% trans "My GeoStories" %}</h4>
        </div>
    </div>
    <div id="my-geostory" class="ms-plugin ResourcesGrid"></div>
{% endblock content %}

{% block ms_plugins %}
    msPluginsBlocks = [
        {
            "name": "ResourcesGrid",
            "cfg": {
                "id": "catalog",
                "title": "GeoStory",
                "defaultQuery": {
                    "f": "geostory"
                },
                "targetSelector": "#my-geostory",
                "menuItems": []
            }
        },
        {
            "name": "ResourcesFiltersForm",
            "cfg": {
                "fields": getPageFilterForm()
            }
        }
    ];
{% endblock ms_plugins %}
```

- add the new page inside urls.py inside urlpatterns list

```python
urlpatterns += [
    url('geostory_resources_page', view=TemplateView.as_view(template_name='geostory_resources_page.html'))
]
```

- Now visit `/geostory_resources_page`. You should see a new page displaying a grid of geostories from the database.


