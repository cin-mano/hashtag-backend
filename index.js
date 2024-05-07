const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path')

const app = express();
const upload = multer({ dest: 'uploads/' });

// Route for uploading images
app.post('/upload', upload.single('file'), (req, res) => {
    // Call the C++ executable passing the image file path as an argument
    try {
        let reqFilePath = path.join(__dirname, req?.file?.path);
        let opencvProcess
        if (req?.file?.mimetype.includes('video')) {
            opencvProcess = spawn('../Yolov5_Video_Object_Detection/Video_Obj_Detection', [reqFilePath]);
        }
        else if (req?.file?.mimetype.includes('image')) {
            opencvProcess = spawn('../Yolov5_Image_Object_Detection/Image_Detection', [reqFilePath]);
        }
        else {
            return res.send("File not supported");
        }
        let outputData = '';
        opencvProcess.stdout.on('data', data => {
            outputData += data.toString();
        });
        opencvProcess.stderr.on('data', err => {
            console.error(`Error--->>>: ${err}`);
            // res.status(500).json({ error: 'An error occurred during object detection.' });
        });

        opencvProcess.on('close', code => {
            if (code !== 0) {
                console.error(`Child process exited with code ${code}`);
                fs.unlinkSync(reqFilePath)
                // res.status(500).json({ error: 'An error occurred during object detection.' });
            } else {
                // Parse and send the output data back to the client
                console.log(outputData, "-------");
                let result = "";
                for (let i = 0; i < outputData.length; i++) {
                    if (outputData[i] != '\r' && outputData[i] != '\n') {
                        result += outputData[i];
                    }
                    else if (outputData[i] == '\n' && i != outputData.length - 1) {
                        result += " ";
                    }
                }
                res.json({ result });
                fs.unlinkSync(reqFilePath);
            }
        });
        // res.send("Done");
    } catch (error) {
        console.log(error, "----");
        fs.unlinkSync(reqFilePath)
    }
});

app.listen(8000, () => {
    console.log('Server is running on port 8000');
});
