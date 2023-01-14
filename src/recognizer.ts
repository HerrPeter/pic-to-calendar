import Tesseract from 'tesseract.js';
import { calendar_v3, google } from 'googleapis';
import * as ics from 'ics';
import { writeFileSync } from 'fs';

const CLIENT_ID = '';
const CLIENT_SECRET = '';
const API_KEY = '';

interface Event {
	summary?: string | null;
	start: {
		date?: string | Date;
		dateTime: Date;
	};
	end: {
		date?: string | Date;
		dateTime: Date;
	};
}
interface EventTime {
	start: string;
	end: string;
}

export default class Recognizer {
	private scheduleLines: Tesseract.Line[];
	private selectedCalendar: string = '';
	private authClient: any;

	constructor(textLines: Tesseract.Line[]) {
		this.scheduleLines = textLines;
	}

	/**
	 * (WIP) Authorize the use of the client's calendar to add events automatically.
	 */
	authorize = async () => {
		let authClient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);

		let scopes = [
			'https://www.googleapis.com/auth/calendar',
			'https://www.googleapis.com/auth/calendar.events',
		];

		const auth = new google.auth.GoogleAuth({
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
		this.authClient = await auth.getClient();
		// google.options({ auth: this.authClient });
	};

	/**
	 * Get the raw data extracted from the image provided.
	 * @param image The directory of the image to scan.
	 * @returns Raw data from the image.
	 */
	public static getText = async (
		image: string
	): Promise<Tesseract.RecognizeResult> => {
		let data = await Tesseract.recognize(image, 'eng', {
			// logger: (m) => console.log(m),
		});

		return data;
	};

	/**
	 * Gets all events parsed from the image's lines.
	 * @returns Array of Event objects.
	 */
	getAllEvents = (): Event[] => {
		let allEvents: Event[] = [];
		if (!this.scheduleLines) return allEvents;

		while (this.scheduleLines.length > 1) {
			// Get all events in the next day of the week.
			let events = this.getNextEvent();

			// Add current day's events to list of all events.
			events.forEach((event) => {
				allEvents.push(event);
			});
		}

		return allEvents;
	};

	/**
	 * (DEPRICATED) Gets the next event from list of schedule lines.
	 * @returns Array of events for the current day of the week.
	 */
	OLD_getNextEvent = (): Event[] => {
		if (this.scheduleLines.length == 0) {
			return [];
		}

		let eventDate;

		// Find line that has a valid date (but is not the week descriptor date at top of schedule)...
		for (let i = 0; i < this.scheduleLines.length; i++) {
			// Check line if it has a date...
			eventDate = this.scheduleLines[i].text
				.toLowerCase()
				.match(/[a-z]{2,9}.\d{1,2}.+20\d{1,2}/); // NOTE: Consider using (([a-zA-Z]{2,9}){1}(\w*\s*)*){1}\d{1,2} to include anyting inbetween the month and date (then remove the middle portion)
			if (eventDate) {
				let weekDesc = this.scheduleLines[i].text
					.toLowerCase()
					.match(/[a-z]{2,9}.\d{1,2}.+-/);
				if (!weekDesc) {
					// Successful date found, proceed...
					break;
				} else {
					this.scheduleLines.shift(); // Remove the useless week description
					i--;
				}
			} else {
				this.scheduleLines.shift(); // Remove the useless non-date line (date must be first)
				i--;
			}
		}

		// If no date is found -> invalid input...
		if (!eventDate) return [];

		// Remove the date line...
		this.scheduleLines.shift();

		// Get second line (has either a time or a week day)...
		let secondLine = this.scheduleLines.shift();
		if (secondLine) {
			// Get start time...
			let startTime: RegExpMatchArray | null = secondLine.text.match(/\d{2}:\d{2}/);

			// If has time -> is Normal shift with the "Today" header (3 lines)
			if (startTime) {
				// Get end time...
				let continueIndex = startTime[0].length + (startTime.index || 0);
				secondLine.text = secondLine.text.substring(continueIndex);
				let endTime: RegExpMatchArray | null = secondLine.text.match(/\d{2}:\d{2}/);

				// If has end time -> end time of Normal shift (3 lines)
				if (endTime) {
					// Get third line...
					let thirdLine = this.scheduleLines.shift();

					// Get summary for Normal shift (3 lines)
					if (thirdLine) {
						// Get summary
						let summary = thirdLine.text;
						return [
							Recognizer.createNewEvent(
								eventDate[0],
								startTime[0],
								endTime[0],
								summary
							),
						];
					}
				} else {
					this.scheduleLines.unshift(secondLine);
					return []; // Invalid (no end time).
				}
			}
			// This is possible RDO/ADO+/Split Shift/Normal (4 lines)
			else {
				// Check 2 lines down to see if split shift or not
				let thirdLine = this.scheduleLines.shift();
				if (thirdLine) {
					// Get start time...
					let startTime: RegExpMatchArray | null =
						thirdLine.text.match(/\d{2}:\d{2}/);

					// This is either a normal shift (4 lines) or split (4 or more lines)
					if (startTime) {
						// Get end time...
						let continueIndex = startTime[0].length + (startTime.index || 0);
						thirdLine.text = thirdLine.text.substring(continueIndex);
						let endTime: RegExpMatchArray | null =
							thirdLine.text.match(/\d{2}:\d{2}/);

						// If has end time -> end time of Normal shift (4 lines)
						if (endTime) {
							// Get third line...
							let fourthLine = this.scheduleLines.shift();

							// Get summary for Normal shift (4 lines)
							if (fourthLine) {
								// Get summary
								let summary = fourthLine.text;
								let events: Event[] = [];
								events.push(
									Recognizer.createNewEvent(
										eventDate[0],
										startTime[0],
										endTime[0],
										summary
									)
								);

								// Now check if there are more schedules (i.e. splits) until new date is reached/end of scheduleLines...
								// Check line if it has a date...
								while (true) {
									let newLine = this.scheduleLines.shift();
									if (newLine) {
										let newStartTime = newLine.text.match(/\d{2}:\d{2}/);
										if (newStartTime) {
											// Get end time...
											let continueIndex =
												startTime[0].length + (startTime.index || 0);
											newLine.text = newLine.text.substring(continueIndex);
											let newEndTime = newLine.text.match(/\d{2}:\d{2}/);

											if (newEndTime) {
												// Get third line...
												let summaryLine = this.scheduleLines.shift();

												// Get summary for Normal shift (3 lines)
												if (summaryLine) {
													// Get summary
													let summary = summaryLine.text;
													events.push(
														Recognizer.createNewEvent(
															eventDate[0],
															newStartTime[0],
															newEndTime[0],
															summary
														)
													);
												} else break;
											} else break;
										} else {
											this.scheduleLines.unshift(newLine);
											break;
										}
									} else break;
								}

								// Return all scheuldes as array.
								return events;
							} else {
								this.scheduleLines.unshift(thirdLine);
								this.scheduleLines.unshift(secondLine);
								return []; // Invalid (missing a summary).
							}
						} else {
							this.scheduleLines.unshift(thirdLine);
							this.scheduleLines.unshift(secondLine);
							return []; // Invalid (missing an end time).
						}
					} else {
						this.scheduleLines.unshift(thirdLine);
						this.scheduleLines.unshift(secondLine);
						return []; // Invalid (probably an ADO/RDO).
					}
				} else return []; // Invalid (no next line).
			}
		} else return []; // Invalid (no next line | probably a day off).

		return [];
	};

	/**
	 * Gets the valid date from the provided string (i.e. "Jan 13, 2023").
	 * @param str The string to parse the date from.
	 * @returns Returns the match for the date format or null.
	 */
	private static getValidDate = (str: string): RegExpMatchArray | null => {
		let date = str.toLowerCase().match(/[a-z]{2,9}.\d{1,2}.+20\d{1,2}/);

		if (date) {
			let weekDesc = str.toLowerCase().match(/[a-z]{2,9}.\d{1,2}.+-/);

			return !weekDesc ? date : null;
		} else {
			return null;
		}
	};

	/**
	 * Gets the start/end time of the currently provided string.
	 * @param str The string to parse the start/end time from.
	 * @returns EventTime object or null
	 */
	private static getEventTime = (str: string): EventTime | null => {
		// Get start time...
		let startTime: RegExpMatchArray | null = str.match(/\d{2}:\d{2}/);

		if (startTime) {
			// Get end time...
			let continueIndex = startTime[0].length + (startTime.index || 0);
			str = str.substring(continueIndex);
			let endTime = str.match(/\d{2}:\d{2}/);

			if (endTime) {
				let eventTime: EventTime = {
					start: startTime[0],
					end: endTime[0],
				};

				return eventTime;
			} else return null;
		} else return null;
	};

	/**
	 * Officially working method for getting the next event.
	 * @returns Array of events.
	 */
	getNextEvent = (): Event[] => {
		if (this.scheduleLines.length == 0) {
			return [];
		}

		let eventDate;

		// Find line that has a valid date (but is not the week descriptor date at top of schedule)...
		for (let i = 0; i < this.scheduleLines.length; i++) {
			eventDate = Recognizer.getValidDate(this.scheduleLines[i].text);

			if (eventDate) {
				// Remove the successful date from the list...
				this.scheduleLines.shift();
				break;
			} else {
				// Remove the useless lines...
				this.scheduleLines.shift();
				i--;
			}
		}

		// If no date is found -> invalid input...
		if (!eventDate) return [];

		// List of events in current date (i.e. splits)
		let events: Event[] = [];

		// Start loop...
		while (true) {
			// Check if next line exists (break case)
			let nextLine = this.scheduleLines.shift();
			if (!nextLine) break;

			// Check if next line is a date (break case)
			// -- True: break (done with current event)
			// -- False: check if next line has a time (normal event)
			// -- -- Continue while loop
			let nextEventDate = Recognizer.getValidDate(nextLine.text);
			if (nextEventDate) {
				// Done with the current event
				this.scheduleLines.unshift(nextLine);
				break;
			}

			// Check if the next line has an event time...
			let eventTime = Recognizer.getEventTime(nextLine.text);
			if (eventTime) {
				// Get event summary...
				let titleLine = this.scheduleLines.shift();
				if (!titleLine) break;

				// Create and add the new event found...
				let summary = titleLine.text;
				events.push(
					Recognizer.createNewEvent(
						eventDate[0],
						eventTime.start,
						eventTime.end,
						summary
					)
				);

				continue;
			} else continue;
		}

		return events;
	};

	/**
	 * Creates and returns a new Event instance.
	 * @param date Date of the event.
	 * @param startTime Start time of the event.
	 * @param endTime End time of the event.
	 * @param summary Title of the event.
	 * @returns Event object
	 */
	private static createNewEvent = (
		date: string,
		startTime: string,
		endTime: string,
		summary: string
	): Event => {
		// Remove invalid characters...
		date = date.replace(/[^a-zA-Z\d ]/, ' ');

		let currYear = new Date().getFullYear();
		let startDate = new Date(date + ' ' + currYear + ' ' + startTime);
		let endDate = new Date(date + ' ' + currYear + ' ' + endTime);

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
	private static strStartsWithSub = (str: string, subStrs: string[]): boolean => {
		return subStrs.some((subStr) =>
			str.toLowerCase().startsWith(subStr.toLowerCase())
		);
	};

	/**
	 * (WIP) Eventually connects to client's google calendar and adds the events automatically.
	 * @param events Array of events.
	 */
	addToCalendar = async (events: Event[]) => {
		// Note: Selected Calendar needs to be a user's calendar ID
		// Note: Request Body supplies the info for the new event to be added
		let res = await google.calendar('v3').events.insert({
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
		});

		console.log('-- New Event Should Now Be Added --');
		console.log('-- -- Response Data below -- --');
		console.log(res.data);
	};

	/**
	 * Officially creates and saves all events to an .ics file in the local directory.
	 * @param events Array of events to save to the calendar file.
	 * @returns Returns a promise.
	 */
	createIcsFile = async (events: Event[]) => {
		if (!events) return null;

		let icsEvents: ics.EventAttributes[] = [];

		events.forEach((event) => {
			let icsEvent: ics.EventAttributes = {
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
		ics.createEvents(icsEvents, (err, value) => {
			if (err) {
				console.log(err);
				return null;
			} else if (value) {
				writeFileSync(`${__dirname}/job-schedule.ics`, value);
				return null;
			}
		});
	};
}
