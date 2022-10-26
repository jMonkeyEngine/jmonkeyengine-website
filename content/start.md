---
type: "default"
layout: "post_layout_default"
title: "Quick Start"
disable_nav: true
date: 2021-04-25T18:00:00+00:00
---

<style>
    #qsbuttons{ 
        text-align:center;
    }
    #qsbuttons > p{
        display:flex;
        align-items:center;
        justify-content:center;
    }

    .qsbtn{
      flex-grow: 1
        
    }
    #jme-initializer{
        margin-top:1em;
        border:none;
    }
</style>
<script>
function showSubPage(id){
    const subpages=document.querySelectorAll(".qspage");
    subpages.forEach(sp=>sp.style.display="none");
    const selectedSubPage=document.querySelector(".qspage#"+id);
    selectedSubPage.style.display="block";

    const buttons=document.querySelectorAll("button.qsbtn");
    buttons.forEach(el=>el.classList.remove("highlightedCl"));
    
    const selectedBtn=document.querySelector("button#"+id+"Btn");
    selectedBtn.classList.add("highlightedCl");
}
</script>
<div id="qsbuttons" style="text-align:center">
jMonkeyEngine is not bound to any specific IDE or SDK and it can be used as any other java library.
<br>
There are several ways to start a project with jMonkeyEngine:
<br><br>

<button id="qsinitializerBtn" class="highlightedCl qsbtn" onclick="showSubPage('qsinitializer')">The Initializer</button> 
<button  class="qsbtn" id="qssdkBtn"  onclick="showSubPage('qssdk')">The SDK</button>
<button class="qsbtn"  id="qscustomBtn" onclick="showSubPage('qscustom')" >DIY</button>

</div>
<hr>
<div class="qspage" id="qssdk" style="display:none">

Using the Netbeans-based SDK is by far the quickest solution to get you up and running. Everything needed is provided, along with extra tools and integrations, and is generally the place most users start their endevour. [Download the SDK](https://github.com/jMonkeyEngine/sdk/releases).

</div>



<div class="qspage" id="qsinitializer" style="text-align:center;display:block">

The initializer is a convenient online tool that build a starter gradle script and template for your application.
You can access the tool directly from [here](https://start.jmonkeyengine.org) or use the embedded version below.

<iframe id="jme-initializer" 
    style="width:100%;height:800px;" 
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



<div class="qspage" id="qscustom" style="display:none">

The engine itself and its dependencies can be downloaded from [the releases page](https://github.com/jMonkeyEngine/jmonkeyengine/releases) and used as any other java library.

If you prefer to use a build automation tool, you can find the engine hosted on the [Maven Central Repository](https://mvnrepository.com/artifact/org.jmonkeyengine). This is the most common approach for users that use an IDE or editor that supports maven or gradle build scripts (such as [IntelliJ IDEA](https://www.jetbrains.com/idea/) or [Visual Studio Code](https://code.visualstudio.com/) ).

The code below shows how to include the bare minimum to use the jMonkeyEngine in your gradle project

```groovy
repositories {
    mavenCentral()
}

dependencies {
    implementation "org.jmonkeyengine:jme3-core:3.3.2-stable"
    implementation "org.jmonkeyengine:jme3-desktop:3.3.2-stable"
    implementation "org.jmonkeyengine:jme3-lwjgl3:3.3.2-stable" 
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

