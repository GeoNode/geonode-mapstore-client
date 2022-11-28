
### Develop with a local GeoNode instance

This setup allows to develop both the django and the GeoNode MapStore javascript applications including templates.

In order to develop with GeoNode MapStore Client we need a running local instance of GeoNode. You could follow this [documentation](https://docs.geonode.org/en/master/install/advanced/core/index.html#ubuntu-20-04lts) to setup a local instance of GeoNode (Ubuntu/WSL only)

Following steps are based on the assumption that there is a running local instance of GeoNode at the url http://localhost:8000/ inside the virtual environment called `geonode`:

- clone the repository in your workspace:

```
git clone --recursive https://github.com/GeoNode/geonode-mapstore-client.git
```

- navigate to the cloned directory

```
cd geonode-mapstore-client/
```

- activate the virtual environment of your local geonode instance

```
workon geonode
```

- install all this django application in edit mode to replace the default used by geonode

```
pip install -e .
```

- navigate to the client directory

```
cd geonode_mapstore_client/client/
```

- create an .env file in the client directory

```
touch .env
```

- add following variables to the .env file

```
DEV_SERVER_PROTOCOL=http
DEV_SERVER_HOSTNAME=localhost
DEV_TARGET_GEONODE_HOST=localhost:8000
```

- install all package dependencies with the command

```
npm install
```

- Start the development application locally

```
npm start
```

Now open the url `http://localhost:8081/` to work on the client.


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
