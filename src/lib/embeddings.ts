import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
export async function getEmbeddings(text: string) {
    try {
        const result = await model.embedContent(text.replace(/\n/g, ' '));
        // this will give us vector which is a numbers array
        console.log(result.embedding.values);
        return result.embedding.values as number[];
    } catch (error) {
        console.log("Error in getEmbeddings", error);
        throw error;
    }
}

