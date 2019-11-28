
var Agenda = {

    parseItem: function (itemString) {
        try {
            console.debug(itemString);
            var agendaItemRegExp = /^(\d\d):(\d\d)\s+(.*)$/;
            var tokens = agendaItemRegExp.exec(itemString);
            console.debug(tokens);
            var hour = parseInt(tokens[1]);
            var minute = parseInt(tokens[2]);
            var time = new Date();
            time.setHours(hour);
            time.setMinutes(minute);
            time.setSeconds(0);
            time.setMilliseconds(0);
            return {
                commencesAt: time,
                text: itemString
            }
        } catch (e) {
            console.warn(e);
            return (null);
        }
    },

    parse: function (agendaString, offset) {
        var items = agendaString.split(/\n/).map(line => this.parseItem(line)).filter(line => line != null);
        if (offset) {
            items.forEach(function(item, index, array) {
                item.commencesAt = newDate(item.commencesAt.valueOf() + offset)
            });
        }
        for(var i = 0; i < (items.length-1); i++) items[i].concludesAt = items[i+1].commencesAt;
        items.pop();
        console.debug(items);
        return items;
    }
}

function drawSampleAgenda() {
    var topics = new Array(
        "This is Agenda Defender!", 
        "List your agenda items", 
        "Times are local hh:mm",
        "Put the FINISH time last",
        "Then click 'let's go'",
        "Use it to run meetings,",
        "for giving talks and presentations,",
        "or whatever you like, really :)");
    var time = new Date();
    var items = new Array();
    time.setMinutes(time.getMinutes() - 5);
    for (var i = 0; i < 8; i++) {
        var item = time.getHours().toString().padStart(2, '0') + ":" + time.getMinutes().toString().padStart(2, '0') + " " + topics[i];
        items.push(item);
        time.setMinutes(time.getMinutes() + 2);
    }
    item = time.getHours().toString().padStart(2, '0') + ":" + time.getMinutes().toString().padStart(2, '0') + " FINISH";
    items.push(item);
    var agenda = items.join("\n");
    $("#agenda").html(agenda);
}

function runMeeting() {
    var agendaString = $("#agenda").val();
    var agenda = Agenda.parse(agendaString);
    var $ticker = $("#ticker");
    $ticker.html('');
    var tickerHeight = $ticker.height();
    var elementHeight = Math.floor(tickerHeight / agenda.length);
    agenda.forEach(function(item, index, array) {
        $div = $("<div class='agenda-item' />");
        $span = $("<span class='agenda-item-text' />")
        $span.text(item.text);
        $span.css("font-size", (elementHeight / 2) + "px");        
        var itemHeight = (elementHeight - 6) + "px";
        $div.css("height", itemHeight);
        $div.css("line-height", itemHeight);        
        $div.append($span);
        console.debug(item.text);
        $progressBar = $("<div class='progress-bar' />");
        item.element = $div;
        item.progressBar = $progressBar;
        $div.append($progressBar);
        $ticker.append($div);

    });
    $("#ticker").show();
    $("a#close-ticker").show();
    window.ticker = window.setInterval(makeTicker(agenda), 10);
    window.running = true;
}

function makeTicker(agenda) {
    return function() {
        var now = new Date();
        agenda.forEach(function(item, index, array) {
            if (item.concludesAt < now) {
                item.progressBar.hide();
                item.element.addClass('finished');
            }
            if (item.commencesAt < now && item.concludesAt > now) {
                var duration = item.concludesAt.valueOf() - item.commencesAt.valueOf();
                var elapsed = now.valueOf() - item.commencesAt.valueOf();
                var multiplier = elapsed / duration;
                var newWidth = item.element.width() * multiplier;
                item.progressBar.css("width", newWidth + "px");
            }
        });
    };
}

function stopMeeting() {
    window.clearInterval(window.ticker);
    $("a#close-ticker").hide();
    $("#ticker").hide();
    window.running = false;
}
$(function () {
    drawSampleAgenda();
    window.addEventListener("resize", function() {
        if (window.running) runMeeting();
    }, false);
    $("a#close-ticker").click(stopMeeting);
    $("#run-meeting-button").click(runMeeting);
});