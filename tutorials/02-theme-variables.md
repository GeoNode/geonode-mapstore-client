
The GeoNode theme allows to override colors with [css variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) in this ways the layout CSS structure will be always aligned with the version in use but with a customized look.

Here the steps to overrides the variables:

- add a style tag in the template. it is possible to use the `geonode-mapstore-client/snippets/custom_theme.html` template included in all the pages.

```html
<style>
</style>
```

- add the `.gn-theme` class in the style tag with the css variable to override

```html
<style>
    /* msgapi is the selector wrapper of the page */
    .msgapi .gn-theme {
        --gn-primary: #74cfe2;
    }
</style>
```

It is possible to use this [tool]{@tutorial theme} to customize and get the style snippet to apply to the theme.
