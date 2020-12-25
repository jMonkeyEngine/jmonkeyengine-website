

class Christmas {
    static init(root, hatSelectors, attributesForRng, exclusionSelectors) {
        this.root = root;
        this.hatSelectors = hatSelectors;
        this.attributesForRng = attributesForRng;
        this.exclusionSelectors = exclusionSelectors;
        document.addEventListener("DOMContentLoaded", () => {
            if (this.isChristmas() || window.location.hash == "#test-christmas25550") {
                this.loadNow();
            }
        });
    }
    static hashCode(v) {
        let hash = 0;
        for (var i = 0; i < v.length; i++) {
            var character = v.charCodeAt(i);
            hash = ((hash << 5) - hash) + character;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }
    static randomSeedParkMiller(seed) { // doesn't repeat b4 JS dies.
        // https://gist.github.com/blixt/f17b47c62508be59987b
        seed = seed % 2147483647
        seed = seed * 16807 % 2147483647
        return (seed - 1) / 2147483646

    }
    static loadNow() {
        this.loadSnow();
        const hatLoadInt = () => {
            this.loadHats(this.hatSelectors, this.attributesForRng, this.exclusionSelectors);
        };
        setInterval(function () {
            hatLoadInt();
        }, 2000);
        hatLoadInt();

    }

    static isChristmas() {
        const date = new Date();
        if ((date.getMonth() + 1) != 12) return false;
        if (date.getDate() < 6) return false;
        return true;
    }

    static loadSnow() {
        console.log("Load snow...");
        const snowScript = document.createElement("script");
        snowScript.src = this.root + "snow.js"
        document.head.appendChild(snowScript);
        snowScript.onload = function () {
            console.log("Snow Loaded. Starting...");
            snow.start({
                "stickingRatio": 0.7,
                "wind": 5,
                "flakeCount": 210,
                "maxRadius": 1.9,
                "maxSpeed": 3,
                "minSpeed": 0.4
            });
        }
    }
    static getHats() {
        return [
            this.root + 'hats/hat1.png'
        ];
    }
    static loadHats(selectors, attributesForRng, exclusionSelectors) {

        const hats = this.getHats();

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(avatar => {
                if (avatar.hasAttribute("christmas25550-hasHat")) return;

                if (exclusionSelectors) {
                    for (let i = 0; i < exclusionSelectors.length; i++) {
                        const exclusionSelector = exclusionSelectors[i];
                        if (avatar.matches(exclusionSelector)) {
                            return;
                        }
                    }
                }

                let hueRotation = 0;
                if (attributesForRng && attributesForRng.length > 0) {
                    let seed = "";
                    for (let i = 0; i < attributesForRng.length; i++) {
                        const r = attributesForRng[i];
                        if (r.type == "attribute") {
                            if (avatar.hasAttribute(r.value)) {
                                seed = avatar.getAttribute(r.value);
                                console.log("Use attribute", r.value, "as seed");
                                if (r.transform) {
                                    seed = r.transform(seed);
                                    console.log("Transformed to ", seed);
                                }
                                break;
                            }
                        } else if (r.type == "text") {
                            seed = avatar.innerText;
                            console.log("Use innerText as seed");
                            if (r.transform) {
                                seed = r.transform(seed);
                                console.log("Transformed to ", seed);
                            }
                            break;
                        }
                    }

                    seed = seed.trim();
                    const seedHashCode = this.hashCode(seed);
                    if (seed != "") {
                        hueRotation = this.randomSeedParkMiller(seedHashCode);
                    }
                }

                const parent = avatar.parentNode;
                const avatarBound = avatar.getBoundingClientRect();
                if (avatarBound.width == 0 || avatarBound.height == 0) return;
                const parentBound = parent.getBoundingClientRect();

                const parentPosMode = window.getComputedStyle(parent).position;
                if (parentPosMode != "absolute" && parentPosMode != "fixed" && parentPosMode != "relative") parent.style.position = "relative";


                console.log("Add hat to", avatar);

                const hat = document.createElement("div");
                hat.classList.add("christmas25550-hat");

                const hatImg = hats[Math.floor(Math.random() * hats.length)];
                hat.style.pointerEvents = "none";
                hat.style.backgroundImage = "url('" + hatImg + "')";
                hat.style.backgroundPosition = "left bottom";
                hat.style.filter = "hue-rotate(" + hueRotation + "turn)";
                hat.style.backgroundRepeat = "no-repeat";
                hat.style.backgroundSize = "contain";
                hat.style.display = "block";
                hat.style.position = "absolute";
                const avatarWidth = Math.min(avatarBound.width, 124);
                const avatarHeight = Math.min(avatarBound.height, 124);
                hat.style.width = avatarWidth + "px";
                hat.style.height = avatarHeight + "px";
                hat.style.zIndex = "140";

                hat.style.left = (parentBound.left - avatarBound.left - Math.min(avatarHeight, avatarWidth) * 0.3) + "px";
                // hat.style.left = (avatarBound.left - parentBound.left - avatarBound.width * 0.3) + "px";
                hat.style.top = (avatarBound.top - parentBound.top - avatarHeight * 0.76) + "px";

                parent.appendChild(hat);
                avatar.setAttribute("christmas25550-hasHat", "true");


            });
        });
    }
}
