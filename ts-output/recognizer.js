"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var googleapis_1 = require("googleapis");
var DaysOfWeek = [
    'M0NDAY',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
];
var Recognizer = /** @class */ (function () {
    function Recognizer(textLines) {
        var _this = this;
        this.selectedCalendar = '';
        this.authorize = function () { return __awaiter(_this, void 0, void 0, function () {
            var auth, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        auth = new googleapis_1.google.auth.GoogleAuth({
                            // Scopes can be specified either as an array or as a single, space-delimited string.
                            scopes: [
                                'https://www.googleapis.com/auth/calendar',
                                'https://www.googleapis.com/auth/calendar.events',
                            ],
                        });
                        // Acquire an auth client, and bind it to all future calls
                        _a = this;
                        return [4 /*yield*/, auth.getClient()];
                    case 1:
                        // Acquire an auth client, and bind it to all future calls
                        _a.authClient = _b.sent();
                        googleapis_1.google.options({ auth: this.authClient });
                        return [2 /*return*/];
                }
            });
        }); };
        this.getAllEvents = function () {
            var allEvents = [];
            while (_this.scheduleLines.length > 1) {
                var events = _this.getNextEvent();
                events.forEach(function (event) {
                    allEvents.push(event);
                });
            }
            return allEvents;
        };
        this.getNextEvent = function () {
            if (_this.scheduleLines.length == 0) {
                return [];
            }
            // let lineNum = 0;
            var currLine; //= this.scheduleLines.shift();
            var eventDate;
            var counter = 0;
            // Find line that has a valid date (but is not the week descriptor date at top of schedule)...
            for (var i = 0; i < _this.scheduleLines.length; i++) {
                // Check line if it has a date...
                eventDate = _this.scheduleLines[i].text.match(/\w{2,4}.\d{1,2}/);
                if (eventDate) {
                    var weekDesc = _this.scheduleLines[i].text.match(/\w{2,4}.\d{1,2}.-/); // NEEDS TESTING!!!
                    if (!weekDesc) {
                        // Successful date found, proceed...
                        currLine = _this.scheduleLines[i];
                        break;
                    }
                }
                counter++;
            }
            // If no date is found -> invalid input...
            if (!eventDate)
                return [];
            // Remove the lines that were trash...
            while (counter > 0) {
                _this.scheduleLines.shift();
                counter--;
            }
            // Make currLine the date...
            currLine = _this.scheduleLines.shift();
            // Get second line (has either a time or a week day)...
            var secondLine = _this.scheduleLines.shift();
            if (secondLine) {
                // Get start time...
                var startTime = secondLine.text.match(/\d{2}:\d{2}/);
                // If has time -> is Normal shift with the "Today" header (3 lines)
                if (startTime) {
                    // Get end time...
                    var continueIndex = startTime[0].length + (startTime.index || 0);
                    secondLine.text = secondLine.text.substring(continueIndex);
                    var endTime = secondLine.text.match(/\d{2}:\d{2}/);
                    // If has end time -> end time of Normal shift (3 lines)
                    if (endTime) {
                        // Get third line...
                        var thirdLine = _this.scheduleLines.shift();
                        // Get summary for Normal shift (3 lines)
                        if (thirdLine) {
                            // Get summary
                            var summary = thirdLine.text;
                            return [
                                Recognizer.createNewEvent(eventDate[0], startTime[0], endTime[0], summary),
                            ];
                        }
                    }
                    else {
                        _this.scheduleLines.unshift(secondLine);
                        return []; // Invalid (no end time).
                    }
                }
                // This is possible RDO/ADO+/Split Shift/Normal (4 lines)
                else {
                    // Check 2 lines down to see if split shift or not
                    var thirdLine = _this.scheduleLines.shift();
                    if (thirdLine) {
                        // Get start time...
                        var startTime_1 = thirdLine.text.match(/\d{2}:\d{2}/);
                        // This is either a normal shift (4 lines) or split (4 or more lines)
                        if (startTime_1) {
                            // Get end time...
                            var continueIndex = startTime_1[0].length + (startTime_1.index || 0);
                            thirdLine.text = thirdLine.text.substring(continueIndex);
                            var endTime = thirdLine.text.match(/\d{2}:\d{2}/);
                            // If has end time -> end time of Normal shift (4 lines)
                            if (endTime) {
                                // Get third line...
                                var fourthLine = _this.scheduleLines.shift();
                                // Get summary for Normal shift (4 lines)
                                if (fourthLine) {
                                    // Get summary
                                    var summary = fourthLine.text;
                                    var events = [];
                                    events.push(Recognizer.createNewEvent(eventDate[0], startTime_1[0], endTime[0], summary));
                                    // Now check if there are more schedules (i.e. splits) until new date is reached/end of scheduleLines...
                                    // Check line if it has a date...
                                    while (true) {
                                        var newLine = _this.scheduleLines.shift();
                                        if (newLine) {
                                            var newStartTime = newLine.text.match(/\d{2}:\d{2}/);
                                            if (newStartTime) {
                                                // Get end time...
                                                var continueIndex_1 = startTime_1[0].length + (startTime_1.index || 0);
                                                newLine.text = newLine.text.substring(continueIndex_1);
                                                var newEndTime = newLine.text.match(/\d{2}:\d{2}/);
                                                if (newEndTime) {
                                                    // Get third line...
                                                    var summaryLine = _this.scheduleLines.shift();
                                                    // Get summary for Normal shift (3 lines)
                                                    if (summaryLine) {
                                                        // Get summary
                                                        var summary_1 = summaryLine.text;
                                                        events.push(Recognizer.createNewEvent(eventDate[0], newStartTime[0], newEndTime[0], summary_1));
                                                    }
                                                    else
                                                        break;
                                                }
                                                else
                                                    break;
                                            }
                                            else {
                                                _this.scheduleLines.unshift(newLine);
                                                break;
                                            }
                                        }
                                        else
                                            break;
                                    }
                                    // Return all scheuldes as array.
                                    return events;
                                }
                                else {
                                    _this.scheduleLines.unshift(thirdLine);
                                    _this.scheduleLines.unshift(secondLine);
                                    return []; // Invalid (missing a summary).
                                }
                            }
                            else {
                                _this.scheduleLines.unshift(thirdLine);
                                _this.scheduleLines.unshift(secondLine);
                                return []; // Invalid (missing an end time).
                            }
                        }
                        else {
                            _this.scheduleLines.unshift(thirdLine);
                            _this.scheduleLines.unshift(secondLine);
                            return []; // Invalid (probably an ADO/RDO).
                        }
                    }
                    else
                        return []; // Invalid (no next line).
                }
            }
            else
                return []; // Invalid (no next line | probably a day off).
            return [];
        };
        this.addToCalendar = function (event) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, googleapis_1.google.calendar('v3').events.insert({
                            calendarId: this.selectedCalendar,
                            requestBody: {
                            // request body parameters
                            // {
                            //   "anyoneCanAddSelf": false,
                            //   "attachments": [],
                            //   "attendees": [],
                            //   "attendeesOmitted": false,
                            //   "colorId": "my_colorId",
                            //   "conferenceData": {},
                            //   "created": "my_created",
                            //   "creator": {},
                            //   "description": "my_description",
                            //   "end": {},
                            //   "endTimeUnspecified": false,
                            //   "etag": "my_etag",
                            //   "eventType": "my_eventType",
                            //   "extendedProperties": {},
                            //   "gadget": {},
                            //   "guestsCanInviteOthers": false,
                            //   "guestsCanModify": false,
                            //   "guestsCanSeeOtherGuests": false,
                            //   "hangoutLink": "my_hangoutLink",
                            //   "htmlLink": "my_htmlLink",
                            //   "iCalUID": "my_iCalUID",
                            //   "id": "my_id",
                            //   "kind": "my_kind",
                            //   "location": "my_location",
                            //   "locked": false,
                            //   "organizer": {},
                            //   "originalStartTime": {},
                            //   "privateCopy": false,
                            //   "recurrence": [],
                            //   "recurringEventId": "my_recurringEventId",
                            //   "reminders": {},
                            //   "sequence": 0,
                            //   "source": {},
                            //   "start": {},
                            //   "status": "my_status",
                            //   "summary": "my_summary",
                            //   "transparency": "my_transparency",
                            //   "updated": "my_updated",
                            //   "visibility": "my_visibility"
                            // },
                            },
                        })];
                    case 1:
                        res = _a.sent();
                        console.log('-- New Event Should Now Be Added --');
                        console.log('-- -- Response Data below -- --');
                        console.log(res.data);
                        return [2 /*return*/];
                }
            });
        }); };
        this.scheduleLines = textLines;
    }
    Recognizer.createNewEvent = function (date, startTime, endTime, summary) {
        var currYear = new Date().getFullYear();
        var startDate = new Date(date + ' ' + currYear + ' ' + startTime);
        var endDate = new Date(date + ' ' + currYear + ' ' + endTime);
        // If overnight shift, add 1 to the date...
        if (endTime < startTime) {
            endDate.setDate(endDate.getDate() + 1);
        }
        return {
            start: {
                dateTime: startDate,
            },
            end: {
                dateTime: endDate,
            },
            summary: summary.replace('\n', ''),
        };
    };
    /**
     * (DEPRICATED) Check if string starts with any substring array.
     * @param str String to check
     * @param subStrs Array of sub strings
     * @returns boolean
     */
    Recognizer.strStartsWithSub = function (str, subStrs) {
        return subStrs.some(function (subStr) {
            return str.toLowerCase().startsWith(subStr.toLowerCase());
        });
    };
    return Recognizer;
}());
exports.default = Recognizer;
