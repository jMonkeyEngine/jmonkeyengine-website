---
type: "default"
layout: "post_layout_default"
title: "Quick Start"
disable_nav: true
date: 2021-04-25T18:00:00+00:00
---

<script>
function showSubPage(id){
    const subpages=document.querySelectorAll(".qspage");
    subpages.forEach(sp=>sp.hidden=true);
    const selectedSubPage=document.querySelector(".qspage#"+id);
    selectedSubPage.hidden=false;

    const buttons=document.querySelectorAll("button.qsbtn");
    buttons.forEach(el=>el.classList.remove("highlightedCl"));
    
    const selectedBtn=document.querySelector("button#"+id+"Btn");
    selectedBtn.classList.add("highlightedCl");
}
</script>
<div id="qsbuttons">
jMonkeyEngine is not bound to any specific IDE or SDK and it can be used as any other java library.
<br>
There are several ways to start a project with jMonkeyEngine:
<br><br>

<button id="qsinitializerBtn" class="highlightedCl qsbtn" onclick="showSubPage('qsinitializer')">The Initializer</button> 
<button  class="qsbtn" id="qssdkBtn"  onclick="showSubPage('qssdk')">SDK & Editors</button>
<button class="qsbtn"  id="qscustomBtn" onclick="showSubPage('qscustom')" >DIY</button>

</div>
<hr>
<div class="qspage" id="qssdk" hidden>

SDKs and editor integrations can be a good fit if you want a more guided workflow with project templates, asset tools, and a simplified setup. They are also opinionated about how you structure and work on a project, and because they are maintained separately from the engine they may not always track the latest engine features immediately.

<div class="editor-card-grid">
  <a class="editor-card" href="https://github.com/jMonkeyEngine/sdk/releases" target="_blank" rel="noopener noreferrer">
    <span class="editor-card__icon"><i class="fa-solid fa-cubes"></i></span>
    <span class="editor-card__copy">
      <strong>jMonkeyEngine SDK</strong>
      <small>NetBeans-based SDK with templates, scene tooling, asset workflow helpers, and a ready-made desktop setup.</small>
    </span>
    <span class="editor-card__action">Download <i class="fas fa-arrow-right"></i></span>
  </a>
</div>

</div>



<div class="qspage qspage--center" id="qsinitializer">

The initializer is the most convenient path if you do not want to be tied to a specific editor. It creates a standard Gradle project that you can open with any editor or IDE with Gradle project support, while keeping the full jMonkeyEngine API available directly from code.

You can use any compatible setup, including [Visual Studio Code](https://code.visualstudio.com/), [IntelliJ IDEA](https://www.jetbrains.com/idea/), [Eclipse](https://www.eclipse.org/ide/), or another editor you prefer with Gradle project support.

You can access the tool directly from [here](https://start.jmonkeyengine.org) or use the embedded version below.

<iframe id="jme-initializer"
    src="https://start.jmonkeyengine.org"
></iframe>

<script>
    const iframe=document.querySelector("#jme-initializer");
    if(iframe){
        iframe.src=iframe.src+"?rnd="+Math.random()+"&time="+Date.now(); // avoid caching
        window.addEventListener("message",(msg)=>{
            try{
                const event=JSON.parse(msg.data);
                if(event.name=="jme-initializer-resize"){
                    const height=event.height;
                    document.querySelector("#jme-initializer").style.height = height + 'px';
                }else if(event.name=="jme-initializer-scrollToTop"){
                    const el=document.querySelector("#jme-initializer");
                    window.scrollToElement(el);
                }     
            }catch(e){
                console.log(e);
            }
            
        });


    }
</script>

</div>



<div class="qspage" id="qscustom" hidden>

Do it yourself means exactly that: bring your own build, source layout, editor, runtime packaging, and workflow. We provide the engine artifacts and Maven coordinates; you decide how to wire them into your project.

The engine itself and its dependencies can be downloaded from [the releases page](https://github.com/jMonkeyEngine/jmonkeyengine/releases) and used as any other Java library.

If you use Maven, Gradle, or another build tool that can consume Maven repositories, check the jMonkeyEngine namespace on [Maven Central](https://mvnrepository.com/artifact/org.jmonkeyengine): `org.jmonkeyengine`.

The code below shows how to include the bare minimum to use the jMonkeyEngine in your gradle project

```groovy
repositories {
    mavenCentral()
}

dependencies {
    implementation "org.jmonkeyengine:jme3-core:<version>"
    implementation "org.jmonkeyengine:jme3-desktop:<version>"
    implementation "org.jmonkeyengine:jme3-lwjgl3:<version>" 
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

</div>
