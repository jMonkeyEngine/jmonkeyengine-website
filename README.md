# jMonkeyEngine Website

## How to edit the website
1. Open the folder with [Visual Studio Code](https://code.visualstudio.com/)
2. Be sure to have the [Easy Less](https://marketplace.visualstudio.com/items?itemName=mrcrowl.easy-less) extension installed (this will autocompile less files on save)
3. Edit the files you want
4. Submit a PR to the source repo

## How to test the website locally

### With Docker
The advantage of using Docker is that the script will pull a container with everything that is needed in order to run the website, if you chose this method you will need to have only a working [Docker installation](https://docs.docker.com/get-started/).

To start an instance with docker, run
   ```
   RUNTIME="sudo docker" ./make.sh server
   ```
The instance will start and the http server will listen on http://localhost:1313


### Without Docker
If you can't or don't want to use Docker, the alternative is to launch the website manually. 
 To do that you will need [hugo installed on your system](https://gohugo.io/), you can then choose to launch the instance using the helper script
   ```
   DONT_COMPILE_LESS=1 NO_CONTAINER=1 ./make.sh server
   ```
or directly with hugo if you are on a platform that doesn't support bash scripts
```
hugo server
```