$(document).ready(function(){
    var scrollFromTop = 0;
    var height = $(document).height();
    var stepDist = $(window).innerHeight();

    var steps = height / stepDist;

    var timerID = setInterval(function () {
        $(document).scrollTop(stepDist + scrollFromTop);
        scrollFromTop = $(document).scrollTop();
        console.log('scrollFromTop', scrollFromTop);

        if ((scrollFromTop + stepDist) >= height) {
            console.log('done');
            clearInterval(timerID);
        }
    }, 1000);
});
