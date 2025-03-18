const fs = require('fs');
const path = require('path');

module.exports.writeBlobToPNG = (blob, filePath) => {
    const writeStream = fs.createWriteStream(filePath);

    // Pipe the Blob data to the write stream
    blob.pipe(writeStream);

    return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
            resolve();
        });

        writeStream.on('error', (err) => {
            reject(err);
        });
    });
}