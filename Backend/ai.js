const OpenAI = require("openai");


function getClient() {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("OpenRouter API key is missing");
    }

    return new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1"
    });
}

// Normal AI response
async function generateAIResponse(userMessage) {
    const client = getClient();

    const response = await client.chat.completions.create({
        model: "openrouter/free",
        messages: [{
                role: "system",
                content: "You are a helpful AI assistant."
            },
            {
                role: "user",
                content: userMessage
            }
        ]
    });

    return response.choices[0].message.content;
}

// Streaming AI response
async function streamAIResponse(userMessage, onToken) {
    const client = getClient();

    const stream = await client.chat.completions.create({
        model: "openrouter/free",
        messages: [{
                role: "system",
                content: "You are a helpful AI assistant."
            },
            {
                role: "user",
                content: userMessage
            }
        ],
        stream: true
    });

    
    for await (const chunk of stream) {
        const token = chunk.choices[0] ?.delta ?.content;

        if (token) {
            onToken(token);
        }
    }
}

// Export functions
module.exports = {
    generateAIResponse,
    streamAIResponse
};