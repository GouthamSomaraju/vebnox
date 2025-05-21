const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middlewares
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Multer setup for storing original images in 'uploads' and upscaled images in 'result'
const upload = multer({ dest: 'public/uploads' });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.post('/upload', upload.single('image'), async (req, res) => {
  const scale = parseInt(req.body.scale || '2');
  const inputPath = req.file.path;
  const ext = path.extname(req.file.originalname);
  
  // Set output paths for original and upscaled images
  const originalFolder = 'public/uploads/originals';
  const upscaledFolder = 'public/uploads/upscaled';
  
  // Create directories if they don't exist
  if (!fs.existsSync(originalFolder)) {
    fs.mkdirSync(originalFolder, { recursive: true });
  }
  if (!fs.existsSync(upscaledFolder)) {
    fs.mkdirSync(upscaledFolder, { recursive: true });
  }

  // Define file names
  const originalPath = path.join(originalFolder, req.file.originalname);
  const outputName = `upscaled_${Date.now()}${ext}`;
  const outputPath = path.join(upscaledFolder, outputName);

  try {
    // Move the original image from temporary folder to 'originals' folder
    fs.renameSync(inputPath, originalPath);

    // Process the image using Sharp
    const metadata = await sharp(originalPath).metadata();
    await sharp(originalPath)
      .resize({ width: metadata.width * scale, height: metadata.height * scale })
      .toFile(outputPath);

    // Send response with paths to the images
    res.json({
      original: `/uploads/originals/${path.basename(originalPath)}`,
      upscaled: `/uploads/upscaled/${outputName}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Image processing failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
