$buoop = {
    required: { i: 8, f: 25, o: 17, s: 9, c: 22 },
    style:"corner",
    insecure:false,
    // Specifies required browser versions
    // Browsers older than this will be notified.
    // f:22 ---> Firefox < 22 gets notified
    // Negative numbers specify how much versions behind current version.
    // c:-5 ---> Chrome < 35  gets notified if latest Chrome version is 40.
    // more details (in english)

    reminder: 24,
    // after how many hours should the message reappear
    // 0 = show all the time

    reminderClosed: 150,
    // if the user explicitly closes message it reappears after x hours

    onshow: function (infos) { },
    onclick: function (infos) { },
    onclose: function (infos) { },
    // callback functions after notification has appeared / was clicked / closed

    l: false,
    // set a fixed language for the message, e.g. "en". This overrides the default detection.

    test: false,
    // true = always show the bar (for testing)

    text: "<b>Your browser ({brow_name}) is out of date.</b><br />This website requires a modern browser to function properly. You can continue using the site with your current browser, but some features will be disabled. <br /><center><a{ignore_but}>Ok</a></center>",
    // custom notification text (html)
    // Placeholders {brow_name} will be replaced with the browser name, {up_but} with contents of the update link tag and {ignore_but} with contents for the ignore link.
    // Example: "Your browser, {brow_name}, is too old: <a{up_but}>update</a> or <a{ignore_but}>ignore</a>."
    // more details (in english)


    newwindow: true,
    // open link in new window/tab

    url: null,
    // the url to go to after clicking the notification

    noclose: false,
    // Do not show the "ignore" button to close the notification

    nomessage: false,
    // Do not show a message if the browser is out of date, just call the onshow callback function

    jsshowurl: "/browser-update/scripts/update.show.js",
    // URL where the script, that shows the notification, is located. This is only loaded if the user actually has an outdated browser.

    container: document.body,
    // DOM Element where the notification will be injected.

    no_permanent_hide: false
    // Do not give the user the option to permanently hide the notification


};

function $buo_f() {
    var e = document.createElement("script");
    e.src = "/browser-update/scripts/update.js";
    document.body.appendChild(e);
};
try { document.addEventListener("DOMContentLoaded", $buo_f, false) }
catch (e) { window.attachEvent("onload", $buo_f) }