function agendaItem (title, commencesAt, concludesAt) {
    this.title = title;
    this.commencesAt = commencesAt;
    this.concludesAt = concludesAt;
    this.element = null;

    this.toString = function() {
        return(`${title} (${commencesAt} - ${concludesAt})`);
    }
    this.schedule = function() {
        return(`${this.commencesAt.toLocaleTimeString().substring(0,5)} - ${this.concludesAt.toLocaleTimeString().substring(0,5)} (${(this.concludesAt - this.commencesAt)/60000} mins)`);
    }
}

function runMeeting() {
    var list = $("#agenda-items").val();
    var lines = list.split(/\n/);
    console.log(`Found ${lines.length} lines`)
    //var midnight = new Date(); // in LOCAL time
    //midnight.setHours(0,0,0,0); // midnight last night, in LOCAL time.
    var items = new Array();
    for(var i = 0; i < lines.length; i++) {
        var tuple = lines[i].split(/ +/);
        var timeString = tuple[0];
        var title = tuple.splice(1).join(' ' );

        var parts = timeString.split(/:/);
        var hour = parseInt(parts[0]);
        var min = parseInt(parts[1]);
        var time = new Date();
        time.setHours(hour, min, 0, 0);
        items.push(new agendaItem(title, time));
    }
    for(var i = 0; i < items.length-1; i++) {
        items[i].concludesAt = items[i+1].commencesAt;
    }
    items.pop(); // remove the Finish element
    var elementHeight = $("#agenda").height() / (items.length-1)
    for(var i = 0; i < items.length; i++) {
        var $element = $(`<div class="agenda-item id="agenda-item-${i}"><h3>${items[i].title}</h3>${items[i].schedule()}</div>`);
        $element.height(elementHeight);
        $element.css({"top" : (i * elementHeight) + "px"});
        $("#agenda").append($element);
        items[i].element = $element;
    }
    $("#agenda").show();
    var render = tick(items);
    render();
    window.setInterval(render, 50);
}

function tick(items) {
    var $ticker = $("#ticker");
    return function() {
        var now = new Date();
        while (items[0].concludesAt < now) {
            items[0].element.addClass("concluded");
            items.shift();
            console.log(items.length);
            if (items.length == 0) return;
            $ticker.css({"top" : Math.floor(items[0].element.position().top) + "px"});
            $ticker.height(Math.floor(items[0].element.outerHeight()));
        }
        if (items.length > 1) {
            var duration = items[0].concludesAt.valueOf() - items[0].commencesAt.valueOf(); // total duration of this agenda item, in milliseconds
            var elapsed = now.valueOf() - items[0].commencesAt.valueOf();
            var multiplier = elapsed / duration;
            var width = Math.floor($("#agenda").width() * multiplier);
            $ticker.width(width);
        }
    }
}

$(function() {
    $("#run-meeting-button").click(runMeeting)
    runMeeting();
});