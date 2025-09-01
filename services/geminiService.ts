import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WatermarkArea } from "../types";

const getApiKey = () => {
    const key = process.env.API_KEY;
    if (!key) {
        throw new Error("API_KEY environment variable not set.");
    }
    return key;
};

let ai: GoogleGenAI;
try {
    ai = new GoogleGenAI({ apiKey: getApiKey() });
} catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
}

// Utility to robustly check for rate limit errors from the Gemini API
const isRateLimitError = (error: any): boolean => {
    // Direct property check for object-based errors
    if (typeof error === 'object' && error !== null) {
        const nestedError = error.error || error; // Handles both {error: {}} and {}
        if (nestedError.status === 'RESOURCE_EXHAUSTED' || nestedError.code === 429) {
            return true;
        }
    }

    // String-based check for serialized errors or error messages
    const message = (error instanceof Error ? error.message : String(error)).toUpperCase();
    if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        return true;
    }
    
    return false;
};


// A wrapper to add retry logic with exponential backoff to Gemini API calls
async function geminiApiCallWithRetry<T>(apiCall: () => Promise<T>): Promise<T> {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error) {
            console.error(`Attempt ${attempt} failed for API call:`, error);

            if (isRateLimitError(error)) {
                if (attempt === maxRetries) {
                    throw new Error(`AI service failed after ${maxRetries} retries due to rate limiting.`);
                }
                const delay = Math.pow(2, attempt - 1) * 1000 + Math.random() * 500;
                console.log(`Rate limit hit. Retrying in ${Math.round(delay)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error; // Re-throw non-retryable errors
            }
        }
    }
    // This part should not be reachable
    throw new Error('API call failed after all retries.');
}

export const getWatermarkTips = async (): Promise<string> => {
    if (!ai) {
        return "Gemini AI service is not available.";
    }
    
    try {
        const response = await geminiApiCallWithRetry(() => {
            const prompt = "Provide 3 short, helpful, and distinct tips for video creators about using watermarks effectively or how to avoid needing to remove them. Format the response as a single string with each tip separated by a double newline (\\n\\n).";
            
            return ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
        });

        return response.text;
    } catch (error) {
        console.error('Error generating content from Gemini:', error);
        if (error instanceof Error) throw error;
        throw new Error(`Failed to fetch tips from AI service: ${String(error)}`);
    }
};

export const detectWatermark = async (base64Image: string): Promise<WatermarkArea | null> => {
    if (!ai) {
        throw new Error("Gemini AI service is not available.");
    }

    try {
        const response = await geminiApiCallWithRetry(() => {
            const prompt = "Analyze this image, which is a frame from a video. Identify the most likely area containing a watermark, logo, or persistent on-screen text. Return a bounding box for this area. If no watermark is found, return null.";
            
            const imagePart = {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image,
                },
            };

            return ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [ {text: prompt}, imagePart ] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            x: { type: Type.NUMBER, description: "The top-left x-coordinate as a percentage (0-100)." },
                            y: { type: Type.NUMBER, description: "The top-left y-coordinate as a percentage (0-100)." },
                            width: { type: Type.NUMBER, description: "The width of the box as a percentage (0-100)." },
                            height: { type: Type.NUMBER, description: "The height of the box as a percentage (0-100)." }
                        },
                        nullable: true,
                    },
                },
            });
        });

        const jsonString = response.text;
        if (!jsonString || jsonString.toLowerCase() === 'null') {
            return null;
        }
        
        const result = JSON.parse(jsonString);
        
        // Basic validation
        if (typeof result.x === 'number' && typeof result.y === 'number' && typeof result.width === 'number' && typeof result.height === 'number') {
            return result as WatermarkArea;
        }

        return null;

    } catch (error) {
        console.error('Error in detectWatermark:', error);
        if (error instanceof Error) throw error;
        throw new Error(`AI watermark detection failed: ${String(error)}`);
    }
};

export const removeWatermarkFromFrame = async (base64ImageWithMarker: string): Promise<string | null> => {
    if (!ai) {
        throw new Error("Gemini AI service is not available.");
    }

    try {
        const response = await geminiApiCallWithRetry(() => {
            const prompt = "In this image, please remove the content inside the bright red rectangle. Inpaint that area to seamlessly match the surrounding content. Also, completely remove the red rectangle itself, leaving only the clean, inpainted result. Do not add any text or other elements.";

            const imagePart = {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64ImageWithMarker,
                },
            };

            return ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts: [imagePart, { text: prompt }] },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data; // Success
            }
        }
        return null; // No image part in response, but the call succeeded.

    } catch (error) {
        console.error(`Error in removeWatermarkFromFrame:`, error);
        if (error instanceof Error) throw error;
        throw new Error(`AI watermark removal failed: ${String(error)}`);
    }
};


export const analyzeAudioForWatermarks = async (videoFile: File | null): Promise<boolean> => {
    // This is a simulation. In a real app, this would involve complex audio processing.
    // We'll simulate a network delay and a simple deterministic outcome.
    await new Promise(resolve => setTimeout(resolve, 1800));

    if (!videoFile) {
        // If it's a URL, let's just default to false for the simulation
        return false;
    }

    // Simple deterministic logic for simulation: detected if file size is odd.
    return videoFile.size % 2 !== 0;
};