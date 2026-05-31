# jMonkeyEngine Website

This is the Hugo source for the jMonkeyEngine website.

## Requirements

- Hugo extended. The repo includes a Linux `./hugo` binary; otherwise install `hugo` on your PATH.
- `lessc`
- `python3`
- Python modules: `numpy`, `yaml`
- `ffmpeg`

## Build

```sh
./make.sh
```

The build refreshes homepage community data, regenerates the showcase mashup image,
compiles `static/css/style.less` to `static/css/style.css`, then runs Hugo.

Useful switches:

```sh
SKIP_COMMUNITY_DATA=1 ./make.sh
SKIP_SHOWCASE_MASHUP=1 ./make.sh
DONT_COMPILE_LESS=1 ./make.sh
```

## Local Server

```sh
./make.sh server
```

The server binds to `0.0.0.0` and uses Hugo's default port, `1313`.
