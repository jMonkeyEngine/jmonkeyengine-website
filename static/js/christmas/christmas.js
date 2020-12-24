
(function () {
    const date = new Date();
    if ((date.getMonth()+1) != 12) return;
    if (date.getDate() < 6) return;

    document.addEventListener("DOMContentLoaded", () => {
        const christmasRoot = "https://jmonkeyengine.org/js/christmas/";

        function loadSnow() {
            console.log("Load snow...");
            const snowScript = document.createElement("script");
            snowScript.src = christmasRoot + "snow.js"
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
        function loadHats(selectors) {
            console.log("Load hats... for", selectors);

            const hats = [
                christmasRoot + 'hats/hat1.png'
            ];

            selectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(avatar => {
                    if (avatar.getAttribute("christmas25550-hasHat")) return;
                    console.log("Add hat to", avatar);

                    const parent = avatar.parentNode;

                    const parentPosMode = window.getComputedStyle(parent).position;
                    if (parentPosMode != "absolute" && parentPosMode != "fixed" && parentPosMode != "relative") parent.style.position = "relative";

                    const avatarBound = avatar.getBoundingClientRect();
                    if (avatarBound.width == 0 || avatarBound.height == 0) return;
                    const parentBound = parent.getBoundingClientRect();


                    const hat = document.createElement("div");
                    hat.classList.add("christmas25550-hat");

                    const hatImg = hats[Math.floor(Math.random() * hats.length)];
                    hat.style.pointerEvents = "none";
                    hat.style.backgroundImage = "url('" + hatImg + "')";
                    hat.style.backgroundPosition = "right bottom";
                    hat.style.filter = "hue-rotate(" + (Math.random() * 2. - 1.) + "turn)";
                    hat.style.transform = "rotate(" + Math.floor((Math.random() * 2. - 1.) * 4) + "deg)";
                    hat.style.backgroundRepeat = "no-repeat";
                    hat.style.backgroundSize = "contain";
                    hat.style.display = "block";
                    hat.style.position = "absolute";
                    hat.style.width = avatarBound.width + "px";
                    hat.style.height = avatarBound.height + "px";
                    hat.style.zIndex = "99";
                    hat.style.left = (avatarBound.left - parentBound.left - avatarBound.width * 0.3) + "px";

                    hat.style.top = (avatarBound.top - parentBound.top - avatarBound.height * 0.8) + "px";

                    parent.appendChild(hat);
                    avatar.setAttribute("christmas25550-hasHat", "true");


                })
            });
        }
        loadSnow();
        const hatLoadInt = function () {
            loadHats(["figure.githubUser img", 'img.avatar']);
        };
        setInterval(hatLoadInt, 2000);
        hatLoadInt();
    });

})();