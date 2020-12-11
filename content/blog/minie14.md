---
title: "Minie Physics Library Version 1.4 Released!"
date: 2020-02-09T08:00:00+00:00
draft: false
type: "default"
layout: "default"
enable_comments: true

authors:
    - "stephengold"

tags:
    - "library"
    - "physics"
    - "software"
    - "minie"
    - "blog"
---

Minie version 1.4 is an exciting new add-on for
[the JMonkeyEngine (JME) game engine](https://jmonkeyengine.org).

{{< figure src="https://i.imgur.com/YdoHlbf.jpg"  >}}

Minie provides an [open-source](https://en.wikipedia.org/wiki/Open-source_software)
physics [engine](https://en.wikipedia.org/wiki/Physics_engine) for desktop games.
It gives software developers using JME access to the proven technology of
[the Bullet Physics SDK version 2.89](https://github.com/bulletphysics/bullet3/releases/tag/2.89),
including:

 + [rigid-body dynamics](https://en.wikipedia.org/wiki/Rigid_body_dynamics),
 + [soft bodies](https://en.wikipedia.org/wiki/Soft-body_dynamics),
 + [collision detection](https://en.wikipedia.org/wiki/Collision_detection),
 + vehicle and character controllers,
 + ray and sweep tests, and
 + dynamic constraints.

Minie incorporates [DynamicAnimControl](https://hub.jmonkeyengine.org/t/introducing-dynamicanimcontrol/41075)
technology for [ragdoll simulation](https://en.wikipedia.org/wiki/Ragdoll_physics)
and [inverse kinematics](http://radiomonash.com/inverse-kinematics-video-games-thing-happens-games-never-knew-word/).
It supports the use of
[Khaled Mamou V-HACD algorithm](https://kmamou.blogspot.com/2011/10/hacd-hierarchical-approximate-convex.html)
to decompose complicated shapes for efficient simulation.

Minie's [API](https://en.wikipedia.org/wiki/Application_programming_interface)
closely mimics those of JME's official physics libraries:
jme3-bullet and jme3-jbullet, so existing JME applications
should require little or no modification to work with Minie.

Minie's documentation starts with a
[70-KB README file](https://github.com/stephengold/Minie/blob/master/README.md).
It comes with a dozen demo applications, some tutorials,
and an extensive test suite, all open-source.
Its Javadoc describes all public methods and their arguments,
and the source code includes additional inline documentation.

The release of Minie 1.4 was first announced
[on 8 February 2020 at the JME Forum](https://hub.jmonkeyengine.org/t/the-minie-physics-library/41839/119).
The software can easily be obtained for free.
Pre-built Maven artifacts are served by
[JCenter](https://bintray.com/stephengold/com.github.stephengold/Minie).
Its complete source code and build scripts are in
[a public GitHub repository](https://github.com/stephengold/Minie/releases/tag/1.4.0for32).
And of course it has its own
[page at Jmonkeystore](https://jmonkeystore.com/38308161-c3cf-4e23-8754-528ca8387c11).

Whether you're starting a new game project,
dissatisfied with the official physics libraries,
or simply curious about the future of open-source game physics,
you owe it to yourself to try Minie!