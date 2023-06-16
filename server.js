const express = require('express');
const multer = require('multer');
const docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// Handle POST request to upload file
app.post('/upload', upload.single('wordFile'), (req, res) => {
  try {
    const { path: filePath, originalname: fileName } = req.file;
    const pdfFilePath = path.join(__dirname, 'public/uploads', `${path.parse(fileName).name}.pdf`);

    // Convert Word file to PDF
    const content = fs.readFileSync(filePath, 'binary');
    const doc = new docxtemplater(content);
    doc.render();
    const pdfBuffer = doc.getZip().generate({ type: 'nodebuffer' });

    // Save the PDF file
    fs.writeFileSync(pdfFilePath, pdfBuffer);

    // Delete the uploaded Word file
    fs.unlinkSync(filePath);

    // Send the PDF download link to the client
    res.json({ downloadLink: `http://localhost:${port}/uploads/${path.parse(fileName).name}.pdf` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Handle GET request to download PDF
app.get('/uploads/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, 'public/uploads', fileName);
    res.download(filePath, (error) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
  });
  

// Start the server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
