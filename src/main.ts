import Tesseract from 'tesseract.js';
import Recognizer from './recognizer';

const imageDir: string = process.argv.slice(2)[0] || __dirname + '/NEW_job_VIEW.jpg';
let image: Tesseract.RecognizeResult;
let imageLines: Tesseract.Line[];

const getText = async (image: string): Promise<Tesseract.RecognizeResult> => {
	let data = await Tesseract.recognize(image, 'eng', {
		// logger: (m) => console.log(m),
	});

	return data;
};

const main = async () => {
	// console.log('Authenticating...');
	// myRec.authorize();
	// return;

	// let testStuff = '@ 10:30 to 15:30\n';
	// let regEx = testStuff.match(/\w{3,4}.\d{1,2}/);
	// console.log(regEx);
	// return;

	console.log('Extracting text from image (Please Wait) ...');

	image = await getText(imageDir);
	imageLines = image.data.lines;
	let myRec = new Recognizer(imageLines);

	let events = myRec.getAllEvents();
	console.log('Events:');
	console.log(events);

	myRec.createIcsFile(events); // Not working bc ics is undefined (FIXED via using require() instead of import)
};

main();
