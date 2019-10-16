let media = $("#carousel-links > a");

let options = {
    container: "#gallery-carousel",
    carousel: true,
    slideshowInterval: 5000
};

// we might not have a screenshot or video, and mounting without any links causes a JS error.
if (media.length > 0) {
    blueimp.Gallery(media, options);
}