import app from './app';
import dotenv from 'dotenv';

const result = dotenv.config();

const port = process.env.PORT || '80'; app.listen(port); 

console.log(`Listening on port ${port}`);
