import Tesseract from 'tesseract.js';
import Recognizer from './recognizer';

const imageDir: string = process.argv.slice(2)[0] || __dirname + '/job.jpg';
let image: Tesseract.RecognizeResult;
let imageLines: Tesseract.Line[];

const getText = async (image: string): Promise<Tesseract.RecognizeResult> => {
	let data = await Tesseract.recognize(image, 'eng', {
		// logger: (m) => console.log(m),
	});

	return data;
};

const main = async () => {
	console.log('Extracting text from image (Please Wait) ...');

	// let info = 'Jan 13, 2023 ©';
	// let time1 = info.match(/\w{2,4}.\d{1,2}.-/); //match(/\w{2,4}.\d{1,2},.\d{2,4}/);
	// console.log(time1);

	// return;

	image = await getText(imageDir);
	imageLines = image.data.lines;

	let myRec = new Recognizer(imageLines);

	let events = myRec.getAllEvents();
	console.log('Events:');
	console.log(events);

	return;

	console.log('Image Dir: ' + imageDir);
	console.log('Image Text:');

	// let fourthCount = -1;
	imageLines.forEach((line: Tesseract.Line) => {
		console.log(line.text.replace('\n', ''));

		// Note about number of lines for Disney Schedule...
		// 6 lines for split shift
		// 3/4 lines for normal schedule
		// 2 lines for RDO

		// if (fourthCount % 3 == 0) {
		// 	console.log('-- Next Date --');
		// }

		// fourthCount++;
	});
	// console.log(imageLines);
};

main();
