
(function (x) {
    var o = x.prototype;
    o.after || (o.after = function () { var e, m = arguments, l = m.length, i = 0, t = this, p = t.parentNode, n = Node, s = String, d = document; if (p !== null) { while (i < l) { ((e = m[i]) instanceof n) ? (((t = t.nextSibling) !== null) ? p.insertBefore(e, t) : p.appendChild(e)) : p.appendChild(d.createTextNode(s(e))); ++i; } } });
}(Element));

// from: https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/before()/before().md
(function (arr) {
    arr.forEach(function (item) {
        if (item.hasOwnProperty('before')) {
            return;
        }
        Object.defineProperty(item, 'before', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function before() {
                var argArr = Array.prototype.slice.call(arguments),
                    docFrag = document.createDocumentFragment();

                argArr.forEach(function (argItem) {
                    var isNode = argItem instanceof Node;
                    docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
                });

                this.parentNode.insertBefore(docFrag, this);
            }
        });
    });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype])


window.shuffleArray = function (array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};



function isInViewport(el) {

    var rect = el.getBoundingClientRect();

    return (
        rect.top >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
    );
}

function isVisible(el) {
    return !!el.offsetParent;
}

function lazyLoad(parent) {
    parent.querySelectorAll('[lazy]').forEach(el => {
        if (isVisible(el)) {
            console.log("Lazy load", el, isVisible(el));

            const attributeKeys = el.getAttributeNames();
            attributeKeys.forEach(akey => {

                if (akey.startsWith("lazy-")) {
                    console.log("Load attribute " + akey);
                    const realkey = akey.substring(5);
                    const value = el.getAttribute(akey);
                    el.setAttribute(realkey, value);
                    console.log("Set", realkey, "=", value);

                } else {
                    console.log("Skip attribute", akey, "not lazy");
                }
            });
        }
    });
}



let floatingHeader = null;
const updateFloatingHeader = () => {
    const header = document.querySelector("body > header");
    const siteTitle = document.querySelector("#siteTitle");
    if (!floatingHeader) {
        console.info("Create floating header!");
        floatingHeader = header.cloneNode(true);
        floatingHeader.classList.add("floating");
        let toTopBtn = floatingHeader.querySelector(".toggleNavOnPortraitButton");
        if (toTopBtn) {
            let newTopBtn=toTopBtn.cloneNode(true);
            toTopBtn.parentNode.replaceChild(newTopBtn,toTopBtn);
            toTopBtn=newTopBtn;
            toTopBtn.removeAttribute("toggle");
            toTopBtn.setAttribute("class", "toggleNavOnPortraitButton fas fa-angle-up");
            toTopBtn.setAttribute("title", "To top");
            toTopBtn.addEventListener("click",(ev) => {
                window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                });
           
            });
        }
        document.body.append(floatingHeader);
    }
    if (!isInViewport(siteTitle)) {
        // if (floatingHeader.style.display != visibleDisplay) {
            // console.log("Show floating header");
        floatingHeader.style.visibility = "visible";
        // }
    } else {
        // if (floatingHeader && floatingHeader.style.display == visibleDisplay) {
        //     console.log("Hide floating header");
         floatingHeader.style.visibility = "hidden";
        // }
    }
};

document.addEventListener("scroll", updateFloatingHeader);

const scrollTo = (contentAnchor) => {
    const anchorBound = contentAnchor.getBoundingClientRect();
    const floatingHBound = floatingHeader.getBoundingClientRect();
    // contentAnchor.scrollIntoView({
    //     behavior:"smooth",
    //     block:"start",
    //     inline:"nearest"
    // });
    window.scrollTo({
        top: anchorBound.top + window.scrollY - floatingHBound.bottom ,
        left: 0,
        behavior: 'smooth'
    });
    console.log("Scroll content into view");
}
window.addEventListener("DOMContentLoaded", function () {
    updateFloatingHeader();

    const scrollNow=()=>{
        window.scrollTo(0, 0);
        if (location.hash&&location.hash!="#") {
            const contentAnchor = document.querySelector(location.hash);
            if(contentAnchor)scrollTo(contentAnchor);
        } else {
            const contentAnchor = document.querySelector("#content");
            if (contentAnchor) scrollTo(contentAnchor);
        }
    };

    setTimeout(() => {
        scrollNow();
    }, 1);

    window.addEventListener("hashchange", function () {
        if(location.hash&&location.hash!="#")scrollNow();
    });


    document.querySelectorAll("[toggle]").forEach(el => {
        const toggleId = el.getAttribute("toggle");
        if (!toggleId) return;
        const parent = document.querySelector("#" + toggleId);
        if (!parent) return;
        el.addEventListener("click", () => {
            parent.querySelectorAll(".expandable").forEach(el2 => {
                if (el2.classList.contains("expandedOnPortrait"))
                    el2.classList.remove("expandedOnPortrait");
                else el2.classList.add("expandedOnPortrait");

            });
            parent.querySelectorAll(".toggleable").forEach(el2 => {
                let toggled = el2.classList.contains("toggledOn");
                let toggledPortrait = el2.classList.contains("toggledOnPortrait");
                let notToggledPortrait = el2.classList.contains("toggledOffPortrait");
                toggled = toggled || toggledPortrait;
                const portrait = notToggledPortrait || toggledPortrait;
                console.log("Toggle ", toggled ? "on" : "off'")
                if (toggled) {
                    // el.removeAttribute("toggled",false);
                    el2.classList.add(portrait ? "toggledOffPortrait" : "toggledOff");
                    el2.classList.remove("toggledOn");
                    el2.classList.remove("toggledOnPortrait");

                } else {
                    // el.setAttribute("toggled",true);
                    el2.classList.remove("toggledOff");
                    el2.classList.remove("toggledOffPortrait");
                    el2.classList.add(portrait ? "toggledOnPortrait" : "toggledOn");

                }
            });
        });
    })

});