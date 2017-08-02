(function() {
    var oldLog = console.log;
    var oldWarn = console.warn;
    var oldInfo = console.info;
    var oldError = console.error;

    function addLog(args, type) {
        var message = args[0];
        var foundIndex = 0;
        var date = new Date();
        message = message.replace(/([\%][sod]{0,1})/gi, function(m) {
            foundIndex++;
            return args[foundIndex];
        });
        message = ("0" + date.getHours()).slice(-2) + ":" +
            ("0" + date.getMinutes()).slice(-2) + ":" +
            ("0" + date.getSeconds()).slice(-2) + " - " +
            message;
        $("#log").prepend("<li class='" + type + "'>" + message + "</li>");
    }

    console.log = function() {
        addLog(arguments, "log");
        oldLog.apply(console, arguments);
    };

    console.info = function() {
        addLog(arguments, "info");
        oldInfo.apply(console, arguments);
    };

    console.warn = function() {
        addLog(arguments, "warning");
        oldWarn.apply(console, arguments);
    };

    console.error = function() {
        addLog(arguments, "error");
        oldError.apply(console, arguments);
    };
})();