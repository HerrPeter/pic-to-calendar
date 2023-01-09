import Tesseract from 'tesseract.js';

const imageDir: string = process.argv.slice(2)[0] || __dirname + '/job.jpg';
let imageData: Tesseract.RecognizeResult;
let imageLines: Tesseract.Line[];

const getText = async (image: string): Promise<Tesseract.RecognizeResult> => {
	let data = await Tesseract.recognize(image, 'eng', {
		// logger: (m) => console.log(m),
	});

	return data;
};

const main = async () => {
	console.log('Extracting text from image (Please Wait) ...');

	imageData = await getText(imageDir);
	imageLines = imageData.data.lines;

	console.log('Image Dir: ' + imageDir);
	console.log('Image Text:');

	// let fourthCount = -1;
	imageLines.forEach((line: Tesseract.Line) => {
		console.log(line.text.replace('\n', ''));

		// Note about number of lines for Disney Schedule...
		// 6 lines for split shift
		// 4 lines for normal schedule
		// 2 lines for RDO

		// if (fourthCount % 3 == 0) {
		// 	console.log('-- Next Date --');
		// }

		// fourthCount++;
	});
	// console.log(imageLines);
};

main();
