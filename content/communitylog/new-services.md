---
title: "jMonkey Initializer, Library and p2p donations"
date: 2022-07-10T08:00:00+00:00
draft: false
type: "default"
layout: "post_layout_default"
enable_comments: true

authors:
    - "riccardobl"

tags:
    - "communitylog"
    - "bitcoin"
    - "initializer"
    - "library"
    - "blog"
---

Hello jMonkey community, I bring you some exciting news:


## jMonkeyEngine Initializer
Thanks to [@richtea](https://hub.jmonkeyengine.org/u/richtea/) we now have an awesome web tool that simplifies the creation of jme projects for both new and advanced users:
The [**jMonkeyEngine Initializer**](https://start.jmonkeyengine.org).


<img src="/images/initializer.png" style="max-width:100%">


This tool is found in the [Get Started](http://localhost:1313/start/) page and assists in the creation of new multi-platform gradle projects. 


## Library: the new Store
We are moving what is currently referred as "jmonkey store" to a new solution called ["jmonkey library"](https://library.jmonkeyengine.org).
This has been rebuilt from scratch with the intent of making a low-friction and developer friendly portal to find community content.

<img src="/images/library.png" style="max-width:100%">

The main improvement of this solution over the previous one are:
- **Login shared with the [hub](https://hub.jmonkeyengine.org)**.
- **Auto-Import projects from Github (and the old Store)**: You just paste the link and the library tries to figure out the rest
- **[Simple Apis](https://library.jmonkeyengine.org/apidoc)**
- **[Github Action integration](https://github.com/jMonkeyEngine/jme-library-publish-action)** to automate publishing and updates using the github action workflow.
- **Github Sponsor, PayPal Donations, Bitcoin Lightning Tips and Patreon buttons** can be configured and displayed in the library pages
- **Integration with the Initializer**: users with trust level >=2 on the [hub](https://hub.jmonkeyengine.org) can toggle a checkbox and get their libraries included in the jme initializer.

*The old store will stay online until all the entries are migrated.*

## P2P/Community2Community Donation 

Until now we have been receiving donations only through [opencollective](https://opencollective.com/jmonkeyengine) and we've been using them mostly to cover hosting costs and not much else, while there are discussions around using some of the funds to promote development, I've come up with something new...

Following the value4value principle we are now [accepting donations](/donate) also through Bitcoin over the lightning network (for borderless, low fees and fast settling), but the catch is that these donations go directly to the private lightning wallets of our github contributors. 

<img src="/images/splitdonation.png" style="max-width:100%">


Basically you can add a lightning address or LNURL to your github bio, as explained [here](https://github.com/riccardobl/SplitDonation#opensource-contributor-receive-rewards) and you will be eligible to get a slice of the donations made through [donate.jmonkeyengine.org](https://donate.jmonkeyengine.org). 

This is also integrated with the [jMonkeyEngine Library](https://library.jmonkeyengine.org) and [jMonkeyEngine Initializer](https://start.jmonkeyengine.org). Projects built with the initializer will have a special  *gradle fund* task that opens a page to donate to the authors of the dependencies that have a valid lightning address or LNURL configured in the [jMonkeyEngine Library's User Settings](https://library.jmonkeyengine.org/#!user=current).

*More on this in a dedicated post at a later time*


