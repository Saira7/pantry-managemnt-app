import axios from 'axios';
import formidable from 'formidable';
import FormData from 'form-data';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const recognizeImage = async (filePath) => {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  const response = await axios.post('https://api.openai.com/v1/images', formData, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      ...formData.getHeaders(),
    }
  });

  return response.data.recognition_result; // Adjust based on OpenAI API response
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).json({ error: 'Error parsing form' });
        return;
      }

      const filePath = files.file.path;

      try {
        const recognizedItem = await recognizeImage(filePath);
        
        // Assuming recognizedItem is an object with a 'label' field
        const isFood = ['apple', 'banana', 'carrot', 'sandwich'].includes(recognizedItem.label.toLowerCase());

        if (isFood) {
          res.status(200).json({ recognizedItem: recognizedItem.label });
        } else {
          res.status(200).json({ recognizedItem: null });
        }
      } catch (error) {
        res.status(500).json({ error: 'Error recognizing image' });
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
