
### Develop with a remote GeoNode instance

This setup allows to develop only the GeoNode MapStore  javascript applications.

- clone the repository in your workspace:

```
git clone --recursive https://github.com/GeoNode/geonode-mapstore-client.git
```

- navigate to the client directory

```
cd geonode-mapstore-client/geonode_mapstore_client/client/
```

- create an .env file in the client directory

```
touch .env
```

- add following variables to the .env file (example)

```
DEV_SERVER_PROTOCOL=https
DEV_SERVER_HOSTNAME=localhost
DEV_TARGET_GEONODE_HOST=mygeonodeinstance.org
```

- install all package dependencies with the command

```
npm install
```

- Start the development application locally

```
npm start
```

Now open the url `https://localhost:8081/` to work on the client.

Note: the protocol of the local development url change based on the target instance of GeoNode defined in the .env file
