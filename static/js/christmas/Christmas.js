class Christmas {
    static init(root,hatSelectors){
        this.root= root;
        this.hatSelectors=hatSelectors;

        document.addEventListener("DOMContentLoaded", () => {
            if( this.isChristmas()){
                this.loadSnow();
                const hatLoadInt =()=>{
                    this.loadHats(this.hatSelectors);
                };
                setInterval(function(){
                    hatLoadInt();
                }, 2000);
                hatLoadInt();
            }
        });
    }
    static isChristmas(){
        const date = new Date();
        if ((date.getMonth()+1) != 12) return false;
        if (date.getDate() < 6) return false;
        return true;
    }
    static loadSnow(){
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
    static getHats(){
        return  [
            this.root + 'hats/hat1.png'
        ];
    }
    static loadHats(selectors){
        
            const hats =this.getHats();

            selectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(avatar => {
                    if (avatar.getAttribute("christmas25550-hasHat")) return;

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
                    hat.style.filter = "hue-rotate(" + (Math.random() * 2. - 1.) + "turn)";
                    hat.style.transform = "rotate(" + Math.floor((Math.random() * 2. - 1.) * 4) + "deg)";
                    hat.style.backgroundRepeat = "no-repeat";
                    hat.style.backgroundSize = "contain";
                    hat.style.display = "block";
                    hat.style.position = "absolute";
                    const avatarWidth=Math.min(avatarBound.width ,124);
                    const avatarHeight=Math.min(avatarBound.height ,124);
                    hat.style.width =avatarWidth+ "px";
                    hat.style.height = avatarHeight+ "px";
                    hat.style.zIndex = "140";

                    hat.style.left = (parentBound.left - avatarBound.left- Math.min(avatarHeight,avatarWidth) * 0.3) + "px";
                    // hat.style.left = (avatarBound.left - parentBound.left - avatarBound.width * 0.3) + "px";
                    hat.style.top = (avatarBound.top - parentBound.top - avatarHeight * 0.76) + "px";

                    parent.appendChild(hat);
                    avatar.setAttribute("christmas25550-hasHat", "true");


                });
            });
   }
}
