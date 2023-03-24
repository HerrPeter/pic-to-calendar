import Recognizer from './recognizer';
import * as fs from 'fs';

const DIR_IMAGE_SOURCE = `${__dirname}` + '/_images';
const imageDir: string =
	process.argv.slice(2)[0] || `${DIR_IMAGE_SOURCE}` + '/job.jpg';
// const imageDir: string = process.argv.slice(2)[0] || __dirname + '/_images/job.jpg';

let image: Tesseract.RecognizeResult;
let imageLines: Tesseract.Line[];

const main = async () => {
	// Attempt to auth via Google and add events automatically (COMING SOON)
	// console.log('Authenticating...');
	// myRec.authorize();

	// Make sure the image folder exists.
	if (fs.existsSync(`${imageDir}`) == false) {
		console.log('Error: No image source directory exists.');
		console.log(`Solution: Create the folder dir: ${imageDir}`);
		return;
	}

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
