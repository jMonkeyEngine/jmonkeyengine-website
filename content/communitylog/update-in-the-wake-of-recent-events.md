---
title: "Update in the wake of recent events"
date: 2020-10-29T08:00:00+00:00
draft: false
type: "default"
layout: "default"

authors:
    - "riccardobl"

tags:
    - "communitylog"
    - "donations"
    - "opencollective"
---
## Hello fellow community members.

Probably most of you know already, but one of the team members left the community due to an internal disagreement.

From his departure I took over his role, reconfigured our services to use easily redeployable docker containers, tested for different configurations and load and migrated everything to a different cloud provider with a plan that I believe is more suitable to our needs.

As part of my commitment to the community I am also making sure all the configurations are available to the core team and to the community itself, in this regard I published the scripts that allow to deploy an exact clone of our server at https://github.com/jMonkeyEngine/jmonkeyengine-webservices .

As part of the migration process, we also decided that it was more adequate to have the store accessible from a subdomain of jmonkeyengine.org, rather than from a different first-level domain.
For this reason it was moved to https://store.jmonkeyengine.org
As an added bonus, the original author allowed us to opensource it.
The source code is now available on this repo: https://github.com/jMonkeyEngine/SoftwareStore

Regarding the **donations**, they are still suspended for now, since they were handled personally by the team member that left. This time we are looking into reintroducing them via the Github Sponsor partner [OpenCollective](https://opencollective.com), that will provide a more suitable, stable and community oriented alternative in the long run.

**If for some reasons your donations are still going out somewhere, please cancel them, since they are not reaching us anymore.**

A successive post will report the details regarding the donations and donors once they are finalized.

Thank you for your attention, and sorry for the inconveniences.
-RB

### Other resources:

- Mirrors  of the personal repos that were deleted: https://github.com/jMonkeyEngine-mirrors
- Health monitor bot: https://github.com/jMonkeyEngine/jmonkeyengine-webservices-healthmonitor
- Discord/Notification bot: https://github.com/jMonkeyEngine/jmonkeyengine-webservices-discordbot
- https://hub.jmonkeyengine.org/t/further-development-of-the-advanced-vehicles-project/43774