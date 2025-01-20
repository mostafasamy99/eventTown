const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const multer = require('multer');
const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
const passport = require('passport');

dotenv.config({ path: 'config.env' });

const dbConnection = require('./config/database');
const ApiError = require('./utils/apiError');
const globalError = require('./middlewares/errorMiddleware');

const authRoute = require('./routes/authRoute');
const userRoute = require('./routes/userRoute');
const categoryRoute = require('./routes/categoryRoute');
const eventRoute = require('./routes/eventRoute');
const wishlistRoute = require('./routes/wishlistRoute');
const calendarRoute = require('./routes/calendarRoute');
const commentRoute = require('./routes/commentRoute');
const organizerRoute = require('./routes/organizerRoute');
const gameficationPointRoute = require('./routes/gameficationPointRoute');
const {startAgenda} = require('./services/agend');
const NotificationRoute = require('./routes/notificationsRoute');


dbConnection();

const app = express();

app.use(express.json());

//enable other domains access your application
app.use(
  cors({
    origin: true, // dynamically set the origin based on request origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log(`mode: ${process.env.NODE_ENV}`);
}
//serve static files inside 'uploads'
app.use(express.static(path.join(__dirname, 'uploads')));

//Mount Routes
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/categories', categoryRoute);
app.use('/api/v1/events', eventRoute);
app.use('/api/v1/wishlists', wishlistRoute);
app.use('/api/v1/comments', commentRoute);
app.use('/api/v1/calendars', calendarRoute);
app.use('/api/v1/organizers', organizerRoute);
app.use('/api/v1/gamefication', gameficationPointRoute);
app.use('/api/v1/notifications', NotificationRoute);
app.get('/.well-known/assetlinks.json', (req, res) => {
  const assetlinksPath = path.join(__dirname, './.well-known/assetlinks.json');
  
  try {
    // Read the file
    const assetlinksContent = fs.readFileSync(assetlinksPath, 'utf8');
    
    // Parse and validate JSON
    const assetlinksData = JSON.parse(assetlinksContent);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Optional: cache for 1 hour
    
    // Send the JSON
    res.json(assetlinksData);
  } catch (error) {
    console.error('Error serving assetlinks.json:', error);
    res.status(500).json({ error: 'Unable to serve assetlinks file' });
  }
});

// Path to the service account key file
const SERVICE_ACCOUNT_FILE = 'apikeys.json';

// Initialize multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Load the service account key file
const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_FILE,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

// Get the authenticated client
const driveService = google.drive({ version: 'v3', auth });

async function uploadFile(filePath, fileName, folderId) {
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };
  const media = {
    mimeType: 'image/jpeg',
    body: fs.createReadStream(filePath),
  };
  try {
    const response = await driveService.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });
    console.log('File ID:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

async function generatePublicUrl(fileId) {
  try {
    // const fileId = 'YOUR FILE ID';
    // await drive.permissions.create({
    //   fileId: fileId,
    //   requestBody: {
    //     role: "reader",
    //     type: "anyone",
    //   },
    // });

    /* 
    webViewLink: View the file in browser
    webContentLink: Direct download link 
    */
    const result = await driveService.files.get({
      fileId: fileId,
      fields: 'webViewLink, webContentLink',
    });
    console.log(result.data);
    return result.data;
  } catch (error) {
    console.log(error.message);
  }
}

// Express route for file upload
app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }
  const folderId = '15ZfznkTSD9_e4-UD-kKfw1v-mMAOJ1ss'; // Replace with your shared folder ID
  try {
    const fileId = await uploadFile(file.path, file.originalname, folderId);
    const URL = await generatePublicUrl(fileId);
    // Delete the file from the local disk
    fs.unlink(file.path, err => {
      if (err) {
        console.error('Error deleting file:', err);
        return res.status(500).send('Error deleting file from server.');
      }
      console.log('File deleted from server:', file.path);
      res.status(200).json({
        message: `File uploaded and deleted successfully. File ID: ${fileId}`,
        URL,
      });
    });
  } catch (error) {
    res.status(500).send('Error uploading file.');
  }
});

// Initialize Passport
app.use(passport.initialize());

// Handel unhandelling Routes
app.all('*', (req, res, next) => {
  next(new ApiError(`Can't found this Route : ${req.originalUrl}`, 400));
});

// Global error handelling middleware
app.use(globalError);

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`App Running on port ${PORT}`);
});

process.on('unhandledRejection', error => {
  console.log(`unhandledRejection Error : ${error.name} | ${error.message}`);
  server.close(() => {
    console.error('Shutting down.... ');
    process.exit(1);
  });
});

startAgenda();