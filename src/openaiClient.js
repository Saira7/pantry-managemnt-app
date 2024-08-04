import axios from 'axios';

const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;


const client = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${openaiApiKey}`
  }
});

export const recognizeImage = async (imageBase64) => {
  const response = await client.post('/images/generations', {
    prompt: `Describe this image: ${imageBase64}`,
    max_tokens: 1000,
    n: 1,
    size: "1024x1024",
    stop: null,
    user: "default"
  });

  return response.data.choices[0].text;
};

export const getRecipeSuggestions = async (pantryItems) => {
  const prompt = `Here are the items in my pantry: ${pantryItems.join(', ')}. Suggest some recipes that I can make with these ingredients.`;

  const response = await client.post('/completions', {
    model: 'text-davinci-003',
    prompt: prompt,
    max_tokens: 500,
    n: 1,
    stop: null,
  });

  return response.data.choices[0].text;
};
