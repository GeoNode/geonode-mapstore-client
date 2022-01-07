# Update client applications bundles

GeoNode MapStore Client django templates uses directly the bundles compiled and committed in the repository so it's important to compile the client and commit it to the repository. This operation is needed if you are working on a custom branch/fork of geonode-mapstore-client to include all the needed updates in the pip module.

- navigate to the client directory

```
cd geonode-mapstore-client/geonode_mapstore_client/client/
```
- make changes inside the client folder
- commit the changes
- run the lint script (need to be successful)

```
npm run lint
```

- run the test script (need to be successful)

```
npm run test
```

- compile the new application bundle

```
npm run compile
```

- create a new commit for the updated bundles

Note: this process will deletes all contents of `geonode-mapstore-client/geonode_mapstore_client/static/mapstore` and it will add the new files from the `geonode-mapstore-client/geonode_mapstore_client/client/static/mapstore`
