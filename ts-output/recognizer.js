"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var googleapis_1 = require("googleapis");
var Recognizer = /** @class */ (function () {
    function Recognizer(textLines) {
        var _this = this;
        this.selectedCalendar = '';
        this.getNextEvent = function () {
            if (_this.scheduleLines.length == 0) {
                return null;
            }
        };
        this.addToCalendar = function (event) {
            // Note: Selected Calendar needs to be a user's calendar ID
            // Note: Request Body supplies the info for the new event to be added
            googleapis_1.google
                .calendar('v3')
                .events.insert({
                calendarId: _this.selectedCalendar,
                requestBody: { start: {}, end: {} },
            });
        };
        this.scheduleLines = textLines;
    }
    return Recognizer;
}());
exports.default = Recognizer;
