
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



let PROGRESS_BAR_INTERVAL = null;
window.addEventListener("load", function () {
    document.getElementById("pageLoadingProgress").style.display = "none";
    if (PROGRESS_BAR_INTERVAL) {
        clearInterval(PROGRESS_BAR_INTERVAL);
        PROGRESS_BAR_INTERVAL = null;
    }
});


PROGRESS_BAR_INTERVAL = setInterval(function () {
    const bar = document.getElementById("pageLoadingProgress");
    if (!bar) return;
    bar.value += 1;
    if (bar.value >= bar.max) bar.value = 0;
}, 20);


window.addEventListener("load", function () {
    document.querySelectorAll(".toggleNavOnPortraitButton").forEach(el=>{
        const toggleId=el.getAttribute("toggle");
        if(!toggleId)return;
        const parent=document.querySelector("#"+toggleId);
        if(!parent)return;
        el.addEventListener("click",()=>{
            let toggled=el.getAttribute("toggled");
            console.log("Toggle ",toggled?"on":"off'")
            parent.querySelectorAll("div").forEach(el2=>{
                if(toggled){
                    el.removeAttribute("toggled",false);
                    el2.classList.add("toggledOff");
                    el2.classList.remove("toggledOn");

                }else{
                    el.setAttribute("toggled",true);
                    el2.classList.remove("toggledOff");
                    el2.classList.add("toggledOn");

                }
            });
        });
    })
    document.getElementById("pageLoadingProgress").style.display = "none";
    if (PROGRESS_BAR_INTERVAL) {
        clearInterval(PROGRESS_BAR_INTERVAL);
        PROGRESS_BAR_INTERVAL = null;
    }
});


function lazyLoad(parent){
    parent.querySelectorAll('[lazy]').forEach(el=>{
        console.log("Lazy load",el);
        const attributeKeys=el.getAttributeNames();
        attributeKeys.forEach(akey=>{
            
            if(akey.startsWith("lazy-")){
                console.log("Load attribute "+akey);
                const realkey=akey.substring(5);
                const value=el.getAttribute(akey);
                el.setAttribute(realkey,value);
                console.log("Set",realkey,"=",value);

            }else{
                console.log("Skip attribute",akey,"not lazy");
            }
        })
    });
}