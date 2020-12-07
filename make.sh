#!/bin/bash
#  ############ ############ ############
#   Usage:
#   with defaults:
#          ./make.sh
#          ./make.sh server
#   or:
#          ARGS="-it" IMAGE="riccardoblb/buildenvs:hugo" RUNTIME="docker" ./make.sh          
#          PORT="1313" ARGS="-it" IMAGE="riccardoblb/buildenvs:hugo" RUNTIME="docker" ./make.sh   server
#  ############ ############ ############ 

set -x
if [ "$IMAGE" = "" ];
then
    export IMAGE="riccardoblb/buildenvs:hugo"
fi

userUID=`id -u`
groupUID=`id -g`

if [ "$CMD" = "" ];
then
    export CMD="hugo $@"
fi



if [ "$ARGS" = "" ];
then
    if [ "$HEADLESS" = "" ];
    then
        export ARGS="$ARGS -it"
    fi
fi

if [ "$RUNTIME" = "" ];
then
    if [ "`which podman`" != "" ];then  
        export RUNTIME="podman"
    else
        export RUNTIME="docker"
        if [ "$SUDO_USER" != "" ];
        then
            userUID=`id -u $SUDO_USER`
            groupUID=`id -g $SUDO_USER`
        fi
        ARGS="$ARGS -u=$userUID:$groupUID"
    fi
fi


if [ "$PORT" = "" ];
then
    if [ "$1"  = "server" ];
    then
        export PORT="1313"
    fi
fi

if [ "$PORT" != "" ];
then
    export ARGS="$ARGS -p$PORT:1313"
fi

if [ "$1"  = "server" ];
then
    export CMD="$CMD --bind 0.0.0.0"    
fi

ENV_FILE=""
if [ -f ".local-env" ];
then
    if [ "$NO_CONTAINER" != "" ];
    then    
          export $(cat .local-env | xargs)
    fi
    ENV_FILE="--env-file=.local-env"
fi

set -x
if [ "$NO_CONTAINER" = "" ];
then
    $RUNTIME run  -v"$PWD:$PWD" $ENV_FILE $RUN_AS -w $PWD $ARGS --rm $IMAGE bash -c  "$CMD"
else
    eval "$CMD"
fi