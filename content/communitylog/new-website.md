---
title: "New Website"
date: 2020-12-13T08:00:00+00:00
draft: false
type: "default"
layout: "default"
enable_comments: true
authors:
    - "riccardobl"

tags:
    - "communitylog"
    - "website"
---

Hello. 

We have a new website. 
This doesn't come to you as a surprise if you have been following  [this thread](https://hub.jmonkeyengine.org/t/wip-new-website/43960/) where for ~1 week a preview of the website has been exposed to the feedbacks of the community. 

This is the result after integrating all your suggestions, however there is always room for improvement and feedbacks are always appreciated, so if you didn't have a chance to voice your opinion before, feel free to do it as a reply to this post.

<a title="Open original" href="/uploads/Screenshot_2020-12-13-jMonkeyEngine.jpg">
<img style="display:inline-block" width="60%" src="/uploads/Screenshot_2020-12-13-jMonkeyEngine-partial.webp" />
</a>

<a title="Open original" href="/uploads/Screenshot_2020-12-13-jMonkeyEngine-portrait.png">
<img style="display:inline-block" width="30%" src="/uploads/Screenshot_2020-12-13-jMonkeyEngine-portrait-partial.webp" />
</a>


## Features Overview



### Backers an contributors

The website header shows one random github contributor and one random backer.

![Contributors an backers](/uploads/Screenshot_2020-12-13-jMonkeyEngine-contributors.webp)

*Note: the list of backers and contributors is not updated in realtime, due to local (browser level) caching, it might take up to 2 days for the update to be propagated to everyone*

### Backer message

Under the top banner a random backer message is shown

![Backer Message](/uploads/Screenshot_2020-12-13-jMonkeyEngine-backermessage.webp)

Those messages are obtained from [opencollective/jmonkeyengine](https://opencollective.com/jmonkeyengine#section-contributors), and can be left by anyone who donated to the project using the opencollective interface.

If you've already donated  but you didn't leave a message, don't worry, you can go to our opencollective page and leave one anytime you want, or change the message you've already left. 

You can for example promote your project that uses jmonkeyengine, leave a message to the community, say what you like about the project and why you donated, or anything else you wish to share, there is no strict rule on what can be written there, just please avoid being political and use common sense.

*Note: the messages are not updated in realtime, due to local (browser level) caching, it might take up to 2 days for the update to be propagated to everyone*

### Top banner
The top banner will now show one different random image from the showcased projects in every page.
Those images are randomized everytime the site is rebuilt, with one exception: the banner in author's pages will show only showcased content from the author itself, if it exists.

### Author handles and pages
Github handles are used as author names, the author page will automatically obtain public informations (such as bio, links, avatar etc) from the github account. The author pages will also list all the articles from the author.

*Note: author infos are not updated in realtime, due to local (browser level) caching, it might take up to 2 days for the update to be propagated to everyone*

### Tags
Everything is subdivided using tags. Special tags will make the articles appear under certain areas:
- **devlog** : will place the article under the *development updates*, an area that contains the news regarding the development of the engine
- **communitylog** : will place the article under the *community updates* an area that contains all the updates regarding our community
- **tutorials** : will place the article at the bottom of the [Docs](/docs) pages
-  **showcase** : will place the article among the showcased content
-  **blog** : will place the article under the generic blog section

More tags can be used together, and custom tags can be used to create lists of correlated posts (eg. a tutorial serie).


### Showcase
Just like before we have a showcase under the [showcase](/tags/showcase) tag. 
Articles published with this tag will be featured in the [Top Banner](#top-banner). If you have a projects that is complete or almost in its final form that looks good and can be showcased in our website,  feel free to add it yourself by following the [Contribute to the website](#contribute-to-the-website) section.

### Community addons
The "features" list now includes community contributions.

![Features](/uploads/Screenshot_2020-12-13-jMonkeyEngine-features.webp)

Make sure to let us know if you have a library to add there!

### Comments
Posts can integrate comments from the hub by setting the **enable_comments: true** property.


## Contribute to the website

Just like everything else, the website is open to community contributions.
We will accept and review articles from the community in form of PRs to our [website repo](https://github.com/jMonkeyEngine/jmonkeyengine-website). 
Once a PR is approved and merged, a CI/CD task will rebuild and deploy the static site.

### Create a post
To create a new post you need to make a new Markdown (.md) file under the `content/` folder in a directory of your choice (or a new one). 
The directory structure will be reflected in the url, but won't influence the functionality of the site or the categorization, to place your post under a certain group you'll need to use tags. You can learn the usage for different special tags in the [Tags](#tags) section.

For example, let's say I want to write a tutorial serie, I would write my article in *content/tutorials/my-tutorial-serie/tutorial1.md* and I would use the tags *tutorials, my-tutorial-serie*.

Feel free to use the styling you want for the article content, you can also use raw html, just try to keep it somewhat related to the general look of the website.


### General Header

The md files need to provide a special header that defines some metadata. 

For common articles the header is (nb don't forget the `---`)

```yaml
---
title: "Your post"
date: 2019-10-08T06:27:00+00:00
draft: false
type: "default"
layout: "default"
enable_comments: true
authors:
    - "your github handle"
    - "another github handle, if there is more than 1 author"
tags:
    - "tag1"
    - "tag2"
    - "tag3"
---
```

Make use to use a valid date in **date** and to remove **enable_comments** if you wish to disable comments.


### Showcase Header


If you are posting to the **showcase**, the header is different:

```yaml
---
title: "Your project name"
date: 2019-10-15T06:27:00+00:00
draft: false
type: "default"
layout: "showcase"
enable_comments: false

authors:
    - "your github handle"
    - "another github handle, if there is more than 1 author"
tags:
    - "tag1"
    - "tag2"
    - "tag3"


steam_link: "wwwww"
itch_link: "wwww"
publisher_link: "wwww"

gallery: [
    "image.jpg",
    "image.png",
    "image.webp",
    "video.webm",
    "youtube:ID"
]

---
```
As you can see, the name of the layout is **showcase** instead of **default** : **layout: "showcase"**

There are also new properties for external links

- Steam: **steam_link: "wwwww"**
- Itch.io: **itch_link: "wwww"**
- Generic Website: **publisher_link: "wwww"**

If you don't have one or more of those links for your project, you can just omit the param alltogether.

And finally there is a **gallery** param. 
There you can put images and videos of your projects that will be shown in the top header and in the gallery.

Every format supported by the html standard will work, in addition to that you can also link youtube videos by using this format `youtube:ID` (eg. `youtube:AnqzGANkPG8`).

*If possible you should link external resources in the gallery, in order to prevent the website repo from growing too big.*

