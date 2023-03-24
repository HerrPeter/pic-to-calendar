"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var tesseract_js_1 = __importDefault(require("tesseract.js"));
var googleapis_1 = require("googleapis");
var ics = __importStar(require("ics"));
var fs = __importStar(require("fs"));
var CLIENT_ID = '';
var CLIENT_SECRET = '';
var API_KEY = '';
var DIR_GENERATED_CALENDARS = "" + __dirname + '/_generatedCalendars';
var Recognizer = /** @class */ (function () {
    function Recognizer(textLines) {
        var _this = this;
        this.selectedCalendar = '';
        /**
         * (WIP) Authorize the use of the client's calendar to add events automatically.
         */
        this.authorize = function () { return __awaiter(_this, void 0, void 0, function () {
            var authClient, scopes, auth, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        authClient = new googleapis_1.google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
                        scopes = [
                            'https://www.googleapis.com/auth/calendar',
                            'https://www.googleapis.com/auth/calendar.events',
                        ];
                        auth = new googleapis_1.google.auth.GoogleAuth({
                            clientOptions: {
                                clientId: CLIENT_ID,
                                clientSecret: CLIENT_SECRET,
                            },
                            // Scopes can be specified either as an array or as a single, space-delimited string.
                            scopes: [
                                'https://www.googleapis.com/auth/calendar',
                                'https://www.googleapis.com/auth/calendar.events',
                            ],
                        });
                        // // Acquire an auth client, and bind it to all future calls
                        _a = this;
                        return [4 /*yield*/, auth.getClient()];
                    case 1:
                        // // Acquire an auth client, and bind it to all future calls
                        _a.authClient = _b.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        /**
         * Gets all events parsed from the image's lines.
         * @returns Array of Event objects.
         */
        this.getAllEvents = function () {
            var allEvents = [];
            if (!_this.scheduleLines)
                return allEvents;
            while (_this.scheduleLines.length > 1) {
                // Get all events in the next day of the week.
                var events = _this.getNextEvent();
                // Add current day's events to list of all events.
                events.forEach(function (event) {
                    allEvents.push(event);
                });
            }
            return allEvents;
        };
        /**
         * (DEPRICATED) Gets the next event from list of schedule lines.
         * @returns Array of events for the current day of the week.
         */
        this.OLD_getNextEvent = function () {
            if (_this.scheduleLines.length == 0) {
                return [];
            }
            var eventDate;
            // Find line that has a valid date (but is not the week descriptor date at top of schedule)...
            for (var i = 0; i < _this.scheduleLines.length; i++) {
                // Check line if it has a date...
                eventDate = _this.scheduleLines[i].text
                    .toLowerCase()
                    .match(/[a-z]{2,9}.\d{1,2}.+20\d{1,2}/); // NOTE: Consider using (([a-zA-Z]{2,9}){1}(\w*\s*)*){1}\d{1,2} to include anyting inbetween the month and date (then remove the middle portion)
                if (eventDate) {
                    var weekDesc = _this.scheduleLines[i].text
                        .toLowerCase()
                        .match(/[a-z]{2,9}.\d{1,2}.+-/);
                    if (!weekDesc) {
                        // Successful date found, proceed...
                        break;
                    }
                    else {
                        _this.scheduleLines.shift(); // Remove the useless week description
                        i--;
                    }
                }
                else {
                    _this.scheduleLines.shift(); // Remove the useless non-date line (date must be first)
                    i--;
                }
            }
            // If no date is found -> invalid input...
            if (!eventDate)
                return [];
            // Remove the date line...
            _this.scheduleLines.shift();
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
        /**
         * Officially working method for getting the next event.
         * @returns Array of events.
         */
        this.getNextEvent = function () {
            if (_this.scheduleLines.length == 0) {
                return [];
            }
            var eventDate;
            // Find line that has a valid date (but is not the week descriptor date at top of schedule)...
            for (var i = 0; i < _this.scheduleLines.length; i++) {
                eventDate = Recognizer.getValidDate(_this.scheduleLines[i].text);
                if (eventDate) {
                    // Remove the successful date from the list...
                    _this.scheduleLines.shift();
                    break;
                }
                else {
                    // Remove the useless lines...
                    _this.scheduleLines.shift();
                    i--;
                }
            }
            // If no date is found -> invalid input...
            if (!eventDate)
                return [];
            // List of events in current date (i.e. splits)
            var events = [];
            // Start loop...
            while (true) {
                // Check if next line exists (break case)
                var nextLine = _this.scheduleLines.shift();
                if (!nextLine)
                    break;
                // Check if next line is a date (break case)
                // -- True: break (done with current event)
                // -- False: check if next line has a time (normal event)
                // -- -- Continue while loop
                var nextEventDate = Recognizer.getValidDate(nextLine.text);
                if (nextEventDate) {
                    // Done with the current event
                    _this.scheduleLines.unshift(nextLine);
                    break;
                }
                // Check if the next line has an event time...
                var eventTime = Recognizer.getEventTime(nextLine.text);
                if (eventTime) {
                    // Get event summary...
                    var titleLine = _this.scheduleLines.shift();
                    if (!titleLine)
                        break;
                    // Create and add the new event found...
                    var summary = titleLine.text;
                    events.push(Recognizer.createNewEvent(eventDate[0], eventTime.start, eventTime.end, summary));
                    continue;
                }
                else
                    continue;
            }
            return events;
        };
        /**
         * (WIP) Eventually connects to client's google calendar and adds the events automatically.
         * @param events Array of events.
         */
        this.addToCalendar = function (events) { return __awaiter(_this, void 0, void 0, function () {
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
        /**
         * Officially creates and saves all events to an .ics file in the local directory.
         * @param events Array of events to save to the calendar file.
         * @returns Returns a promise.
         */
        this.createIcsFile = function (events) { return __awaiter(_this, void 0, void 0, function () {
            var icsEvents;
            return __generator(this, function (_a) {
                if (!events)
                    return [2 /*return*/, null];
                icsEvents = [];
                events.forEach(function (event) {
                    var icsEvent = {
                        start: [
                            event.start.dateTime.getFullYear(),
                            event.start.dateTime.getMonth() + 1,
                            event.start.dateTime.getDate(),
                            event.start.dateTime.getHours(),
                            event.start.dateTime.getMinutes(),
                        ],
                        title: event.summary || 'No Title',
                        end: [
                            event.end.dateTime.getFullYear(),
                            event.end.dateTime.getMonth() + 1,
                            event.end.dateTime.getDate(),
                            event.end.dateTime.getHours(),
                            event.end.dateTime.getMinutes(),
                        ],
                        alarms: [
                            {
                                action: 'display',
                                description: 'Reminder: ' + event.summary || '',
                                trigger: {
                                    hours: 2,
                                    before: true,
                                },
                            },
                            {
                                action: 'display',
                                description: 'Reminder 2: ' + event.summary || '',
                                trigger: {
                                    hours: 1,
                                    minutes: 30,
                                    before: true,
                                },
                            },
                        ],
                    };
                    icsEvents.push(icsEvent);
                });
                // let icsResults = await ics.createEvents(icsEvents);
                ics.createEvents(icsEvents, function (err, value) {
                    if (err) {
                        console.log(err);
                        return null;
                    }
                    else if (value) {
                        // Make the directory for the generated calendar files if it does not already exist.
                        if (fs.existsSync("" + DIR_GENERATED_CALENDARS) == false) {
                            console.log('-- Making Calendar Dir --');
                            fs.mkdirSync("" + DIR_GENERATED_CALENDARS);
                        }
                        // Create the calendar file.
                        fs.writeFileSync("" + DIR_GENERATED_CALENDARS + '/job-schedule.ics', value);
                        return null;
                    }
                });
                return [2 /*return*/];
            });
        }); };
        this.scheduleLines = textLines;
    }
    /**
     * Get the raw data extracted from the image provided.
     * @param image The directory of the image to scan.
     * @returns Raw data from the image.
     */
    Recognizer.getText = function (image) { return __awaiter(void 0, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, tesseract_js_1.default.recognize(image, 'eng', {
                    // logger: (m) => console.log(m),
                    })];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data];
            }
        });
    }); };
    /**
     * Gets the valid date from the provided string (i.e. "Jan 13, 2023").
     * @param str The string to parse the date from.
     * @returns Returns the match for the date format or null.
     */
    Recognizer.getValidDate = function (str) {
        var date = str.toLowerCase().match(/[a-z]{2,9}.\d{1,2}.+20\d{1,2}/);
        if (date) {
            var weekDesc = str.toLowerCase().match(/[a-z]{2,9}.\d{1,2}.+-/);
            return !weekDesc ? date : null;
        }
        else {
            return null;
        }
    };
    /**
     * Gets the start/end time of the currently provided string.
     * @param str The string to parse the start/end time from.
     * @returns EventTime object or null
     */
    Recognizer.getEventTime = function (str) {
        // Get start time...
        var startTime = str.match(/\d{2}:\d{2}/);
        if (startTime) {
            // Get end time...
            var continueIndex = startTime[0].length + (startTime.index || 0);
            str = str.substring(continueIndex);
            var endTime = str.match(/\d{2}:\d{2}/);
            if (endTime) {
                var eventTime = {
                    start: startTime[0],
                    end: endTime[0],
                };
                return eventTime;
            }
            else
                return null;
        }
        else
            return null;
    };
    /**
     * Creates and returns a new Event instance.
     * @param date Date of the event.
     * @param startTime Start time of the event.
     * @param endTime End time of the event.
     * @param summary Title of the event.
     * @returns Event object
     */
    Recognizer.createNewEvent = function (date, startTime, endTime, summary) {
        // Remove invalid characters...
        date = date.replace(/[^a-zA-Z\d ]/, ' ');
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
            summary: summary.replace(/\n/g, ''),
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
