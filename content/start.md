---
type: "default"
layout: "default"
title: "Quick Start"
---

There are a variety of ways to use jMonkeyEngine:

* Download the SDK
* Download the engine
* Add the libraries to a build script

Using the Netbeans-based SDK is by far the quickest solution to get you up and running. Everything needed is provided, along with extra tools and integrations, and is generally the place most users start their endevour.
[Download the SDK](https://github.com/jMonkeyEngine/sdk/releases).

jMonkeyEngine is not bound to any specific IDE or SDK, though, and if you feel comfortable in the Java environment you can use any IDE. The engine itself and it's dependencies can be downloaded directly and you can include them just like any other library in your java project.
[Download the Engine](https://github.com/jMonkeyEngine/jmonkeyengine/releases).

If you prefer to use online dependencies you can include them in your project from jcenter. This is the most common approach for users that use an IDE such as intellij.

```groovy
repositories {
    jcenter()
}

dependencies {
    implementation "org.jmonkeyengine:jme3-core:3.3.2-stable"
    implementation "org.jmonkeyengine:jme3-desktop:3.3.2-stable"
    implementation "org.jmonkeyengine:jme3-lwjgl:3.3.2-stable" 
}
```

Creating a Game
--

All games created with jmonkey start by extending `SimpleApplication`. Below is the most basic setup required to start your game and show a cube.

```java
package my.game;

import com.jme3.app.SimpleApplication;
import com.jme3.material.Material;
import com.jme3.math.ColorRGBA;
import com.jme3.scene.Geometry;
import com.jme3.scene.shape.Box;
import com.jme3.system.AppSettings;

public class Main extends SimpleApplication {

    public static void main(String[] args) {

        Main app = new Main();

        AppSettings settings = new AppSettings(true);
        settings.setTitle("My Awesome Game");
        app.setSettings(settings);

        app.start();

    }

    @Override
    public void simpleInitApp() {

        Box b = new Box(1, 1, 1);
        Geometry geom = new Geometry("Box", b);

        Material mat = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
        mat.setColor("Color", ColorRGBA.Blue);
        geom.setMaterial(mat);

        rootNode.attachChild(geom);

    }

    @Override
    public void simpleUpdate(float tpf) {
        //TODO: add update code
    }

}

```

Running this class will start your first game and display a blue box on the screen, and you can move around using your mouse and WASD keys. Congratulations! You're running your first JME game!

For a more thorough tutorial on jMonkey browse through our [wiki](https://wiki.jmonkeyengine.org). The wiki provides extended documentation as well as tutorials on how to develop your game effectively using jmonkey practices. Tutorials start from the basics all the way up to collision detection, input mapping and shaders, and will be your go-to place for most of the information you require.

If you ever find yourself confused or wondering how something is done, head over to our [community hub](https://hub.jmonkeyengine.org) and create a new thread. Our ultra-helpful team and community will be more than happy to give you a hand in getting you back on track.
