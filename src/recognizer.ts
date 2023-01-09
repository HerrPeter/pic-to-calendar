import Tesseract from 'tesseract.js';
import { google } from 'googleapis';

interface Event {}

export default class Recognizer {
	private scheduleLines: Tesseract.Line[];
	private selectedCalendar: string = '';

	constructor(textLines: Tesseract.Line[]) {
		this.scheduleLines = textLines;
	}

	getNextEvent = () => {
		if (this.scheduleLines.length == 0) {
			return null;
		}
	};

	addToCalendar = (event: Event) => {
		// Note: Selected Calendar needs to be a user's calendar ID
		// Note: Request Body supplies the info for the new event to be added
		google
			.calendar('v3')
			.events.insert({
				calendarId: this.selectedCalendar,
				requestBody: { start: {}, end: {} },
			});
	};
}
