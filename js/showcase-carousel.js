(function () {
    function scrollCarousel(id, dir) {
        var carousel = document.getElementById(id);
        if (!carousel) return;
        var track = carousel.querySelector('.screenshots-track');
        if (!track) return;
        var item = track.querySelector('.screenshot-item');
        if (!item) return;
        var itemWidth = item.offsetWidth + 12;
        track.scrollBy({ left: itemWidth * dir * 2, behavior: 'smooth' });
    }

    document.addEventListener('click', function (event) {
        var button = event.target.closest('[data-carousel-target]');
        if (!button) return;
        scrollCarousel(button.getAttribute('data-carousel-target'), Number(button.getAttribute('data-carousel-dir') || 1));
    });
})();
