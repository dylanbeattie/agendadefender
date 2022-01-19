
function AgendaItem(timePart1, timePart2, text) {
    this.timePart1 = timePart1;
    this.timePart2 = timePart2;
    var tokens = text.split(' ');
    if (/^#[0-9a-f]{3,6}$/i.test(tokens[1])) {
        var prefix = tokens.shift();
        this.color = tokens.shift();
        this.text = prefix + ' ' + tokens.join(' ');
    } else {
        this.text = text;
    }
    this.isRelativeMode = timePart1 == 0 && timePart2 == 0;
    this.getAbsoluteTime = function () {
        var time = new Date();
        time.setHours(timePart1);
        time.setMinutes(timePart2);
        time.setSeconds(0);
        time.setMilliseconds(0);
        return time;
    }
    this.getRelativeTime = function (baseline) {
        var time = new Date(baseline);
        time.setMinutes(time.getMinutes() + timePart1);
        time.setSeconds(time.getSeconds() + timePart2);
        return (time);
    }
}

var Agenda = {
    parseItem: function (itemString) {
        try {
            var agendaItemRegExp = /^(\d\d):(\d\d)\s+(.*)$/;
            var tokens = agendaItemRegExp.exec(itemString);
            var p1 = parseInt(tokens[1]);
            var p2 = parseInt(tokens[2]);
            return new AgendaItem(p1, p2, itemString);
        } catch (e) {
            console.warn(e);
            return (null);
        }
    },

    parse: function (agendaString) {
        var items = agendaString.split(/\n/).map(line => this.parseItem(line)).filter(line => line != null);
        var relativeMode = items[0].isRelativeMode;
        var now = new Date();
        items.forEach(item => item.commencesAt = (relativeMode ? item.getRelativeTime(now) : item.getAbsoluteTime()));
        for (var i = 0; i < (items.length - 1); i++) items[i].concludesAt = items[i + 1].commencesAt;
        items.pop();
        console.debug(items);
        return items;
    }
}

function drawSampleAgenda(event) {
    var topics = new Array(
        "This is Agenda Defender!",
        "List your agenda items",
        "Times are local, 24-hour clock, HH:mm",
        "Put the FINISH time last",
        "Then click 'GO!'",
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
    if (event && event.preventDefault) event.preventDefault();
    return (false);
}

function draw45MinuteTalk(event) {
    $("#agenda").html(`00:00 Intro and welcome
05:00 Context: why are database deployments hard?
08:00 Rolling forward, rolling back
13:00 Schema management
18:00 Working with static data and lookup data
25:00 Live demonstration
40:00 Conclusion and next steps
45:00 FINISH`);
    event.preventDefault();
    return (false);
}

function drawLightningTalk(event) {
    $("#agenda").html(`00:00 Introduction to lightning talks
00:30 How I learned to love three-minute talks
01:00 The history of pecha kucha
01:30 Rehearsal tips for lightning talks
02:00 Scheduling tips
02:30 Funny stories
03:00 FINISH`);
    event.preventDefault();
    return (false);
}

// function saveToUrlHash() {
//     var base64 = btoa($("#agenda").html());
//     var hash = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
//     window.location.hash = hash;
// }

// function loadUrlHash() {
//     var hash = window.location.hash.substring(1);
//     if (! hash) return(false);
//     try {
//     var base64 = hash.replace(/-/g, '+').replace(/_/g, '/') + "==";
//     $("#agenda").html(atob(base64));
//     return(true);
//     } catch(err) {
//         console.log(err);
//         return(false);
//     }
// }

function runMeeting() {
    var agendaString = $("#agenda").val();
    var agenda = Agenda.parse(agendaString);
    var $ticker = $("#ticker");
    $ticker.html('');
    var tickerHeight = $ticker.height();
    var elementHeight = Math.floor(tickerHeight / agenda.length);
    agenda.forEach(function (item, index, array) {
        $div = $("<div class='agenda-item' />");
        $span = $("<span class='agenda-item-text' />")
        $span.text(item.text);
        var fontSize = (elementHeight / 3);
        if (fontSize > 200) fontSize = 200;
        $span.css("font-size", fontSize + "px");
        var itemHeight = (elementHeight - 6) + "px";
        $div.css("height", itemHeight);
        $div.css("line-height", itemHeight);
        $div.append($span);
        console.debug(item.text);
        $progressBar = $("<div class='progress-bar' />");
        if (item.color) $progressBar.css("color", item.color);
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
    return function () {
        var now = new Date();
        agenda.forEach(function (item, index, array) {
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
    // if (!loadUrlHash()) 
    drawSampleAgenda();
    window.addEventListener("resize", function () {
        if (window.running) runMeeting();
    }, false);
    // $("#agenda").on("keyup", saveToUrlHash);
    $("a#lightning-talk").click(drawLightningTalk);
    $("a#45-minute-talk").click(draw45MinuteTalk);
    $("a#absolute-example").click(drawSampleAgenda);
    $("a#close-ticker").click(stopMeeting);
    $("#run-meeting-button").click(runMeeting);
    $(document).on('keyup', function (e) {
        if (e.key == "Escape") stopMeeting();
    });
});