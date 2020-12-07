---
menu: "main"
title: "Features"
type: "default"
layout: "default"
---



jMonkeyEngine is a feature-rich engine capabale of creating both beautiful
and complex games, single-player or networked, on a wide variety of platforms.

---

### Platforms
- Windows
- Linux
- Mac OSX 
- Raspberry Pi 3 (OpenGL ES 2.0)
- Raspberry Pi 4 (OpenGL ES 3.2)
- Android

## Supported Model Formats
- GLTF
- OBJ

### Audio
- Support for WAV, MP3 and OGG file formats.
- Buffered and Streaming support.
- Global, directional and positional sounds.


### Input
- Mouse and Keyboard
- Touchscreen
- Joystick/Joypad/Wheel

### SceneGraph
- Batching
- Instancing
- 2D and 3D scene support
- Level of Detail
- Light Culling
- Single Pass Lighting

### Animation
- Tween API with out of the box support for spatial, bone and morph animations
- Stock Tweens availble:
    - Sequence tween: a tween that plays tweens in sequence.
    - Parallel tween: a tween that plays tweens in parallel.
    - Delay tween : a tween that just waits…
    - Stretch tween: a tween that wraps another tween and change its duration.
    - Camera tween: moves the camera…
    - CallMethod: calling a method on an object …
- Animation Blending
- Animation interpolation (interpolors for rotation, position, scale and time)
- Hardware Skinning

### Graphics
- OpenGL support up to OpenGL 4.5
- OpenGL ES support up to 3.0
- LWJGL2 and 3
- Post Processing
- Stock Post Processors
    - Water
    - Screen Space Ambient Occlusion
        - Supports Approximate Normals (50% faster)
    - Bloom
    - Cartoon Edge
    - Color Overlay
    - Cross-Hatch
    - Depth Of Field
    - Fast Approximate Anti Aliasing
    - Fog
    - Light Scattering
    - Posterization
    - Radial Blur
    - ToneMap
- Unshaded Materials
- Phong Lighting Materials
- PBR Materials
    - Sphere and OrientedBox Probe areas
    - Light Probe blending (up to 3 light probes)
    - Supports both Roughness/Metallic & Roughness/SpecularGloss workflow
- Vertex, Fragment and Geometry shader support
- Texture Atlas support
- Particles

### Language
- Support for Java 1.8+
- Use Kotlin, Groovy or any combination all in one project.

### Physics
- Bullet Physics
- **[Minie Physics](https://github.com/stephengold/Minie)** - A high-powered improved and up-to-date binding around Bullet with "soft body" support.

### Networking
- Networking API supporting UDP/TCP either with low-level Messaging or high-level RMI.
- **[SimEthereal](https://github.com/Simsilica/SimEthereal)**  - A high performance library for real-time networked object synching

### GUI
- **[Lemur](http://jmonkeyengine-contributions.github.io/Lemur/)** - a fast and efficient Jme-Native 2D and 3D GUI Toolkit.
- **[JME-JFX-11](https://github.com/jayfella/jme-jfx-11)** - A bridge to create a 2D GUI in JME using JavaFX 11.

### Entity System
- **[Zay-ES](https://github.com/jMonkeyEngine-Contributions/zay-es)** - A high-performance entity-component-system

### Profiling
- DetailedProfiler - Displays timing information for various areas of your game to determine bottlenecks
