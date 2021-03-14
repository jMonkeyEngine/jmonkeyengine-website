---
title: "Sgold interviews Adi Barda"
date: 2021-03-11T18:00:00+00:00
draft: false
type: "default"
layout: "post_layout_default"
enable_comments: true

authors:
    - "stephengold"

tags:
    - "interview"
    - "blog"
---

{{< ghuser  user="stephengold" mode="inline" >}}
When, where, and how did you first become aware of JMonkeyEngine?
What got you interested in using it?


{{< ghuser  user="SceneMax3D" mode="inline" >}}
Back in 2018, I decided to create a 3-D animation development environment
that would run on Android devices.
I went looking for a 3-D Java library
that could be used in Android applications,
and JME was the only one I found that had a "code first" approach.
This was important to me
because I needed to be able to create scene graphs from code,
without relying on a visual editor.
In addition, the on-line forum was very responsive.
It looked like a good choice for my project.

In the end, an Android-based development environment
was released to the Play Store, and it worked fine!

[YouTube video: Simulating gravitation forces using variables](https://www.youtube.com/watch?v=bMMLJF7GIH4)


{{< ghuser  user="stephengold" mode="inline" >}}
Congratulations on getting your project to the Play Store.
Not all Android projects make it that far!

That video refers to the SceneMax Scripting Language
and (briefly) displays what looks like a sample of it.
What is SceneMax, and how did it come to exist?


{{< ghuser  user="SceneMax3D" mode="inline" >}}
As a kid, I was obsessed
with creating imaginary worlds and pouring life into them.
I used to write animations and games on my Commodore 64,
using Microsoft Basic and 6502 Assembler.
That was the only software-engineering education I have ever had,
and in 1999 it was enough to get a programming job---
after catching up on a few modern technologies
such as VB 6, C++, and SQL.

Grateful for the tools that helped me launch my programming career,
I decided in 2005 to create programming language that would encourage
young kids to create games and become programmers.
SceneMax was born.


{{< ghuser  user="stephengold" mode="inline" >}}
Has SceneMax evolved over the years?


{{< ghuser  user="SceneMax3D" mode="inline" >}}
Originally it was an open-source project in C++,
using DirectX for the rendering.
Parsing was done using the `strtok()` function (no regex!)
so the syntax was limited.

It was an immediate success, with tens of thousands of downloads,
and it won first place in an open-source competition.
More importantly, I used it to teach kids programming.
My vision became a reality.

SceneMax got a few updates before reaching end of life in 2014.
In 2018, I rewrote it from scratch, targeting Android devices.
I used using Java, ANTLR4 for parsing, and JME for rendering.
I started teaching kids with Android devices.

When I sold an online course to the Israeli Ministry of Education,
they conditioned it on having a PC version,
so I devoted my time to building a new development environment for PCs
and porting the JME renderer to run on Windows.

The port proved surprisingly easy. It just worked!


{{< ghuser  user="stephengold" mode="inline" >}}
What distinguishes SceneMax3D from other languages?


{{< ghuser  user="SceneMax3D" mode="inline" >}}
General programming languages such as Java, C++, and C#
aren't suited to teaching young kids to code.
It's difficult for these kids
(non-native English speakers, ten-to-twelve years old)
to write interesting programs such as games.
With simple code, they can only create boring programs.

SceneMax3D fills that gap;
it enables kids to write amazing animations and games
in language that is very simple and intuitive.
Later, when they feel comfortable with their coding skills,
they can begin adding C# code to their projects.

Here are a few simple code snippets:

    d is a dragon
    d.fly loop
    d.turn left 360 in 10 seconds


    t is a static track
    car is a gtr_nismo vehicle : pos (0,3,0)
    camera.chase car


    skybox.show solar system
    s is a sinbad
    s.Dance then SliceVertical loop
    b is a box : pos(4,-1,-20) and size (3,5,2) and material="pond"
    b.turn left 360 in 10 seconds async
    b.move to (s) + 5 in 10 seconds async
    when b collides with s do
      sys.print "BOOM"
      s.move left 5 in 10 seconds
    end do
    when key R is pressed do
      s.move right 1 in 0.1 seconds
    end do

It's simple, generates attractive animations, and kids just love it!


{{< ghuser  user="stephengold" mode="inline" >}}
Thanks for that answer and for the code samples.

If someone wants to teach coding to children younger than ten,
what would you advise?


{{< ghuser  user="SceneMax3D" mode="inline" >}}
I'd advise a block-based computational thinking course
using software such as Alice, Tynker, Scratch, Minecraft web, or Roblox.

SceneMax3D has an option for adding smart macros,
so that teachers and other companies can add syntax
in the language of their target audience.
In this way, even first- or second-graders can start coding.


{{< ghuser  user="stephengold" mode="inline" >}}
Why extend SceneMax projects using C# instead of Java?


{{< ghuser  user="SceneMax3D" mode="inline" >}}
C# was chosen because it is used
in the curriculum of the Israeli educational system
and in other game engines such as Unity and Godot.
I plan to add support for Java and JavaScript extensions in the future.


{{< ghuser  user="stephengold" mode="inline" >}}
Are you planning any other updates or additions to SceneMax3D?

There are currently two white-label commercial products based on SceneMax3D.
One is gaining speed and looks promising,
so I'm focussing on features that will help it succeed:

* improving the overall quality of the product
* virtual classroom support to make teaching even easier
* deployment to the Web and Android devices
* real-time networking support
* WooCommerce integration to allow artists to create and sell graphics and music packages for SceneMax3D


{{< ghuser  user="stephengold" mode="inline" >}}
SceneMax3D is a very impressive project!

I’ve run out of questions.
Thank you very much for your detailed answers
and the thought you put into them.
