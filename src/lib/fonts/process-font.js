const fs = require('fs');
const path = require('path');

const inputPath = path.join('src', 'lib', 'fonts', 'Roboto-Regular.base64');
const outputPath = path.join('src', 'lib', 'fonts', 'Roboto-Regular-base64.ts');

try {
    const base64 = fs.readFileSync(inputPath, 'utf8').replace(/\s/g, '');
    const tsContent = `export const robotoBase64 = "${base64}";\n`;
    fs.writeFileSync(outputPath, tsContent);
    console.log('Successfully created font file.');
} catch (err) {
    console.error('Error creating font file:', err);
    process.exit(1);
}
