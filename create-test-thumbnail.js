const fs = require('fs');
const path = require('path');

// Create a test image file
const testImageContent = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;

// Convert base64 to buffer
const base64Data = testImageContent.split(',')[1];
const imageBuffer = Buffer.from(base64Data, 'base64');

// Save test image
const testImagePath = path.join(process.cwd(), 'test-custom-thumbnail.png');
fs.writeFileSync(testImagePath, imageBuffer);

console.log('Test custom thumbnail created:', testImagePath);
console.log('File size:', fs.statSync(testImagePath).size, 'bytes');
