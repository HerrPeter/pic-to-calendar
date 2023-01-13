import Recognizer from './recognizer';

const imageDir: string = process.argv.slice(2)[0] || __dirname + '/job.jpg';
let image: Tesseract.RecognizeResult;
let imageLines: Tesseract.Line[];

const main = async () => {
	// Attempt to auth via Google and add events automatically (COMING SOON)
	// console.log('Authenticating...');
	// myRec.authorize();

	console.log('Extracting text from image (Please Wait) ...');
	image = await Recognizer.getText(imageDir);
	imageLines = image.data.lines;
	let myRec = new Recognizer(imageLines);

	console.log('Extracting relavent scheduled events (Please Wait)...');
	let events = myRec.getAllEvents();
	console.log('Events:');
	console.log(events);

	console.log('Creating the ICS file for the gathered events (Please Wait)...');
	myRec.createIcsFile(events);
	console.log('Done!');
};

main();
