import Tesseract from 'tesseract.js';
import { calendar_v3, google } from 'googleapis';

const DaysOfWeek = [
	'M0NDAY',
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday',
];

interface Event {
	summary?: string | null;
	start?: {
		date: string | Date | null;
		dateTime: string | null;
	};
	end?: {
		date: string | Date | null;
		dateTime: string | null;
	};
}

export default class Recognizer {
	private scheduleLines: Tesseract.Line[];
	private selectedCalendar: string = '';
	private authClient: any;

	constructor(textLines: Tesseract.Line[]) {
		this.scheduleLines = textLines;
	}

	authorize = async () => {
		const auth = new google.auth.GoogleAuth({
			// Scopes can be specified either as an array or as a single, space-delimited string.
			scopes: [
				'https://www.googleapis.com/auth/calendar',
				'https://www.googleapis.com/auth/calendar.events',
			],
		});

		// Acquire an auth client, and bind it to all future calls
		this.authClient = await auth.getClient();
		google.options({ auth: this.authClient });
	};

	getNextEvent = (): Event[] | null | undefined => {
		if (this.scheduleLines.length == 0) {
			return null;
		}

		// let lineNum = 0;
		let currLine = this.scheduleLines.shift();
		let eventDate;
		let counter = 0;

		// Find line that has a valid date (but is not the week descriptor date at top of schedule)...
		for (let i = 0; i < this.scheduleLines.length; i++) {
			// Check line if it has a date...
			eventDate = this.scheduleLines[i].text.match(/\w{2,4}.\d{1,2}/);
			if (eventDate) {
				let weekDesc = this.scheduleLines[i].text.match(/\w{2,4}.\d{1,2}.-/); // NEEDS TESTING!!!
				if (!weekDesc) {
					// Successful date found, proceed...
					currLine = this.scheduleLines[i];
					break;
				}
			}

			counter++;
		}

		// If no date is found -> invalid input...
		if (!eventDate) return null;

		// Remove the lines that were trash...
		while (counter > 0) {
			this.scheduleLines.shift();
			counter--;
		}

		// if (Recognizer.strStartsWithSub(currLine.text, DaysOfWeek)) {
		// 	// -- Line starts with a day of the week...
		// 	// Get date from current line...
		// 	let eventDate = currLine.text.match(/\w{2,4}.\d{1,2}/); // To add the year append: ",.\d{2,4}"
		// 	if (eventDate) {
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
				} else return null; // Invalid (no end time).
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

						// If has end time -> end time of Normal shift (3 lines)
						if (endTime) {
							// Get third line...
							let fourthLine = this.scheduleLines.shift();

							// Get summary for Normal shift (3 lines)
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
											thirdLine.text = thirdLine.text.substring(continueIndex);
											let endTime: RegExpMatchArray | null =
												thirdLine.text.match(/\d{2}:\d{2}/);

											if (endTime) {
												// Get third line...
												let fourthLine = this.scheduleLines.shift();

												// Get summary for Normal shift (3 lines)
												if (fourthLine) {
													// Get summary
													let summary = fourthLine.text;
													events.push(
														Recognizer.createNewEvent(
															eventDate[0],
															startTime[0],
															endTime[0],
															summary
														)
													);
												} else break;
											} else break;
										} else break;
									} else break;
								}

								// Return all scheuldes as array.
								return events;
							} else return null; // Invalid (missing a summary).
						} else return null; // Invalid (missing an end time).
					} else return null; // Invalid (probably an ADO/RDO).
				} else return null; // Invalid (no next line).
			}
		} else return null; // Invalid (no next line | probably a day off).
		// 	} else return null; // Invalid (no date).
		// }
		// while (true){
		// this.scheduleLines.forEach((line) => {
		// });
		// }
	};

	private static createNewEvent = (
		date: string | Date | null,
		startTime: string,
		endTime: string,
		summary: string
	): Event => {
		return {
			start: {
				date: date,
				dateTime: startTime,
			},
			end: {
				date: date,
				dateTime: endTime,
			},
			summary: summary,
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

	addToCalendar = async (event: Event) => {
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
}
