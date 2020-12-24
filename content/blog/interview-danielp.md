---
title: "Sgold interviews Daniel Perano"
date: 2020-02-25T18:00:00+00:00
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
Thank you for agreeing to be interviewed.

First question: Do you remember when you first encountered JMonkeyEngine?
What was your first impression?

{{< ghuser  user="danielperano" mode="inline" >}}I started learning jME back in the 3.0 days, as I recall,
and I was impressed with the features it offered.
The scene-graph control and appstate design made a lot of sense to me ---
at the time both were novel concepts.

Not long after that, I adopted jME for a project called “OpenWorld.”


{{< ghuser  user="stephengold" mode="inline" >}}
What sort of project was it?

{{< ghuser  user="danielperano" mode="inline" >}}OpenWorld was the precursor to MyWorld ---
a platform for real-time, 3-D social virtual worlds and MMO games.

{{< ghuser  user="stephengold" mode="inline" >}}
What got you interested in social virtual worlds?

{{< ghuser  user="danielperano" mode="inline" >}}I first heard of them from
a magazine article about Second Life, over a decade ago.
I was fascinated, and despite being underage
(accounts were restricted to users 18 and over), I created an account.

Since I was underage my adventures there did not last long, but
I was hooked from the start.
It was like a game, but there were so many things to do and places to explore,
and the built-in creation system blew my mind.

A couple years later, I discovered OpenSimulator,
an open-source server that’s compatible with Second Life clients (viewers).
Since then, I’ve been a member of various OpenSimulator virtual worlds (or grids, as they’re called).

During my second year in OpenSimulator, I began to keenly notice
some limitations that OpenSimulator inherited from Second Life.
Compared to multi-player games, virtual worlds always felt slow and bloated,
and the architecture was fundamentally limiting.

At that point I had the idea that grew into MyWorld:
apply multiplayer game technology to social virtual worlds.
Later on, I realized that a social virtual-world platform
could also be a powerful MMO gaming platform, and
since then I’ve worked towards the dual goal of supporting
social virtual worlds and MMO games as first-class citizens on MyWorld.

{{< ghuser  user="stephengold" mode="inline" >}}
How many people are working on MyWorld?

{{< ghuser  user="danielperano" mode="inline" >}}We have three people on the project.
Right now I’m the sole developer ---
the other two handle business management,
social media, and aesthetics (art and design).

{{< ghuser  user="stephengold" mode="inline" >}}
How is the project funded?

{{< ghuser  user="danielperano" mode="inline" >}}We’re fully self-funded: no investor or venture-capital backing.
We see this as an advantage, for two reasons:

1. We’re not beholden to shareholders,
   so we’re free to make decisions that bring the best experience to our users.
2. Our runway is infinitely long --- we have no pressure to grow rapidly to avoid bankruptcy.
   We can grow organically and sustainably.

{{< ghuser  user="stephengold" mode="inline" >}}
When’s the next release of MyWorld due out?

{{< ghuser  user="danielperano" mode="inline" >}}Our first alpha/preview release
will come out around the end of March of this year (2020).

{{< ghuser  user="stephengold" mode="inline" >}}
What features will it provide?

{{< ghuser  user="danielperano" mode="inline" >}}The feature set will depend on what we have time to finish.
Dynamic asset delivery/loading, the entity system, and scripting
are in pretty good shape,
but the user interface still needs work
and there are many small “detail features” that need attention.

{{< ghuser  user="stephengold" mode="inline" >}}
In the long run, what will differentiate MyWorld from other virtual worlds?
Specifically, how would you compare it to Minecraft and Second Life?

{{< ghuser  user="danielperano" mode="inline" >}}Unlike Minecraft, MyWorld is not a game itself ---
it’s a platform that supports dynamic content creation and scripting,
and unlike games more generally, MyWorld provides first-class support
for uploading 3D models, textures, audio, etcetera
and distributing them to clients on an as-needed basis.
It also has a professional-grade scripting language you can use
to add custom behavior to your creations.

Unlike current-generation virtual worlds,
MyWorld was designed from Day One to satisfy
the performance requirements of multiplayer action games.
This means that exploring a virtual world can have the same fast,
fluid feel as playing a well-designed multiplayer game.

Another difference is that we support scripting on both client and server,
allowing scripted effects and latency-elimination techniques
that are impossible in current virtual worlds.

In addition, our internal systems can be extended via plugins
that can integrate into the entity system and
host or call HTTP endpoints (for custom REST APIs, for example).
Plugins can even extend the core network protocol
with jME’s fast, intuitive, and efficient RMI implementation.

{{< ghuser  user="stephengold" mode="inline" >}}
What’s the financial model? Will the client be freely downloadable?
Will there be paid subscriptions? Free-to-play accounts?

{{< ghuser  user="danielperano" mode="inline" >}}Our vision for MyWorld has always been to release it open-source,
so the client will always be free to download and use, as will the core server.
We may eventually release some commercial plugins for professional use,
but these would be extensions to the core server,
not permanently built-in proprietary code.

In a project like MyWorld,
there are many opportunities to provide value to users,
so there are many potential revenue streams.
Initially we’re looking at a revenue model similar to Second Life:
users can rent space in the virtual world to build homes,
businesses, workshops, etcetera.
We may also introduce a subscription model that offers
extra benefits to heavy users.

We’re also investigating how we can monetize
by offering professional hosting and support services to game developers
and those interested in running MyWorld servers.

{{< ghuser  user="stephengold" mode="inline" >}}
I’ve heard that Second Life has its own currency.
Do you have plans in that area?

{{< ghuser  user="danielperano" mode="inline" >}}While MyWorld needs a virtual currency to effectively operate,
issuing one ourselves is not currently a viable choice for a couple of reasons:

 1. Issuing in-house currency is a large financial liability ---
    there are many ways to destabilize an economy, virtual or otherwise,
    that are largely or completely outside the control of the currency issuer,
    which would present a risk both to us and our users.

 2. Governments have begun regulating virtual currencies,
    making it expensive and difficult to issue them.

Fortunately, we’re not the only ones with this need
and there are several good virtual currency services,
some of which allow the same currency to be used across many games or virtual worlds.

So yes, we will have a virtual currency,
but we’re not planning on issuing it ourselves.

{{< ghuser  user="stephengold" mode="inline" >}}
You mentioned earlier that Second Life was age-restricted.
Will MyWorld have similar restrictions?

{{< ghuser  user="danielperano" mode="inline" >}}Initially yes, unfortunately.
Allowing minors requires extra legal compliance
and stringent moderation of content and user interactions.

I don’t see this as a notable limitation, especially early on.
Most of our initial user base will be developers and creators,
not general users,
so I expect the overwhelming majority of interest to be coming from adults.

I want to allow minors to access at least some areas within MyWorld
as soon as it makes sense for us as an organization and community,
but for now we need to focus on the technical aspects.

{{< ghuser  user="stephengold" mode="inline" >}}
Does MyWorld use JMonkeyEngine for the client, the server, or both?

{{< ghuser  user="danielperano" mode="inline" >}}The client is a typical jME application ---
AppStates tie MyWorld-specific libraries (such as our in-house entity system)
to other systems and the scene graph.

The server uses jME’s network stack,
and we’re transitioning from jME’s physics to Minie, but that’s about all.
The server’s systems and heartbeat/event dispatch loop are all custom ---
we don’t use jME’s application structure serverside.

{{< ghuser  user="stephengold" mode="inline" >}}
What technologies does MyWorld use besides JMonkeyEngine?

{{< ghuser  user="danielperano" mode="inline" >}}It uses JavaFX, Lemur, Chipmunk (our in-house scripting language),
Jetty (an embedded HTTP server), and CockroachDB (a distributed SQL database).

{{< ghuser  user="stephengold" mode="inline" >}}
What prompted you to create Chipmunk?
What other scripting languages did you consider?

{{< ghuser  user="danielperano" mode="inline" >}}Chipmunk was born out of necessity.

Like Second Life,
MyWorld allows content creators to script anything they create.
Scripting can include physics, movement, particle/sound/animation effects,
HTTP calls, etcetera.

The problems here are security and resource use.
Since anyone with creation privileges can upload scripts to a server
(and scripts can also run client side), sandboxing is a must.

My first choice for scripting was Groovy.
It’s a powerful, well-known language with many features,
and the compiler supports AST transformations for customizing compiled code.
I spent a great deal of time pursuing this route,
but the shoe always pinched in the same spots: preemption and checkpointing.

Preemption means that the script engine can stop a running script at any time.
This is necessary to ensure that misbehaving (or resource-intensive) scripts
don’t overuse CPU resources.
Preemption is also necessary for checkpointing:
freezing a script so it can be persisted to disk or sent to another server.

Java was not designed for preemption.
Every mechanism I could think of to fit preemption support
into Java’s compiled bytecode came with substantial overhead and other nasty limitations.

I also experimented with an assembly-like language for scripting,
but it was too difficult to read to be suitable for anything more than trivial scripts.

I designed Chipmunk to fit a unique place in the language spectrum ---
easy for a first-time programmer to pick up,
but powerful enough for an experienced developer to hit the ground running.
For example, classes declare state that’s shared between all instances
via the “shared” keyword,
which is semantically identical to Java’s “static” keyword,
but expresses the concept in terms that make intuitive sense
to inexperienced programmers.

In terms of features, Chipmunk supports modules, classes, polymorphism,
first-class functions, anonymous (lambda) functions, exceptions,
and dynamic typing.

{{< ghuser  user="stephengold" mode="inline" >}}
Chipmunk sounds like it might have many uses.

{{< ghuser  user="danielperano" mode="inline" >}}I hope so! I’m looking forward to seeing what else it’s used for.

{{< ghuser  user="stephengold" mode="inline" >}}
Is there any published documentation for it?
Is it open-source?

{{< ghuser  user="danielperano" mode="inline" >}}Chipmunk is developed separately from MyWorld and will be released
open-source as soon as we’ve finalized the v1.0 language spec
and finished implementing the standard library.

The main language features are functional, but it needs more attention
on things like string manipulation, collection operations, and libraries.

{{< ghuser  user="stephengold" mode="inline" >}}
Part of the appeal of an open world, I think,
is having a place to exhibit digital creations.

What skills/tools would someone need to create and upload a 3-D model?
Do you envision people using Blender 3D?

What audio formats will MyWorld support?

{{< ghuser  user="danielperano" mode="inline" >}}MyWorld is built around the assumption that users will create digital content.
One of the first things I wrote was the dynamic asset upload/download mechanism.

Our initial creation pipeline is based around the GLTF format.
Thanks to jME’s GLTF importer, most modern GLTF files should import seamlessly.
Our primary interest in external tools is Blender 3D,
but anything that exports to GLTF should do fine.

Later on, we plan to support in-world creation via constructive solid geometry
with procedural extensions, as a supplement to the GLTF pipeline.

Any audio format supported by jME (OGG & WAV in particular)
can be opened by the client for upload.
Streaming media can be in any format supported by JavaFX’s media framework.

{{< ghuser  user="stephengold" mode="inline" >}}
If someone wants to develop games for MyWorld, where should they begin?
Is there an e-mail list for announcements?
A website they should monitor?
A chatroom they should join?

{{< ghuser  user="danielperano" mode="inline" >}}The best place to go is our [Discord server](https://discordapp.com/invite/WccnrWg).
We have an active community there,
and we often discuss planned or requested features.
It’s also the first place we share development updates
and news about the project.
For anyone wishing to participate in the alpha-test release,
this is the place to be.

Our [Facebook](https://www.facebook.com/MyWorld-LLC-228751528045088)
and [Twitter](https://twitter.com/MyWorldLLC) pages
cover major news items and announcements,
and liking/following us there helps us get the word out to more people!

For general project information, blog posts, and press releases,
the [MyWorld website](https://myworldvw.com/) is the place to go.
We archive the notes from our monthly “MyWorld Meetup” sessions on the blog ---
these are a great resource for finding out details about the project.

{{< ghuser  user="stephengold" mode="inline" >}}
I’ve run out of questions.
Unless there’s something more you’d like to discuss, let’s wrap this up.

Thank you very much for your detailed answers
and all the time and care you put into them.

{{< ghuser  user="danielperano" mode="inline" >}}Thank you! I enjoyed the interview, and I’m looking forward to seeing how jME continues to grow and improve – there’s a lot of great talent behind this project!
