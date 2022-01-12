# Install a custom branch of the geonode-mapstore-client in the geonode-project

This approach should be used only when other type of customizations does not fullfil the needs of the project.
The following steps shows how to install geonode-mapstore-client from a github repositoty:

- Create a new fork/branch
- Apply all needed changes and customization in the custom branch
- Compile and commit the new client bundles in the custom branch
- Install the specific branch with pip in the requirement.txt of the geonode-project.

```
-e git+https://github.com/{fork}/geonode-mapstore-client.git@{commit|branch}#egg=django_geonode_mapstore_client
```
