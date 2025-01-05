import { Pinecone } from '@pinecone-database/pinecone';
import { convertToAscii } from './utils';
import { getEmbeddings } from './embeddings';



export async function getMatchesFromEmbeddings(embeddings: number[], fileKey: string) {

    try {
        const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

        const pineconeIndex = pinecone.index('chat-with-pdf');
        const namespace = pineconeIndex.namespace(convertToAscii(fileKey));

        const queryResult = await namespace.query({
            topK: 5,
            vector: embeddings,
            includeMetadata: true,
        })

        return queryResult.matches || [];

    } catch (error) {
        console.log("Error query embedding", error);
        throw error;
    }

}


export async function getContext(query: string, fileKey: string) {
    try {
        const embeddings = await getEmbeddings(query);
        const matches = await getMatchesFromEmbeddings(embeddings, fileKey);

        // const qualifyingDocs = matches.filter(match => match.score && match.score > 0.7);
        const qualifyingDocs = matches;

        type Metadata = {
            text: string,
            pageNumber: number,
        }

        const docs = qualifyingDocs.map(match => (match.metadata as Metadata).text);
        return docs.join('\n').substring(0, 3000);   // 3000 is added to limit the number of characters we feed to ai , 
        // so that our token limit doesn't expire quickly
    } catch (error) {
        console.log("Error in getContext", error);
    }

}