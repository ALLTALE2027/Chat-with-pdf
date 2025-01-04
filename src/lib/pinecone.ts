import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';
import { downloadFileFromGCP } from './googleStorage';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document, RecursiveCharacterTextSplitter } from '@pinecone-database/doc-splitter'
import md5 from 'md5'
import { getEmbeddings } from './embeddings';
import { convertToAscii } from './utils';


const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

//this info about tyoe we got from looking at the pages console
type PDFPage = {
    pageContent: string,
    metadata: {
        loc: { pageNumber: number }
    }
}

export async function loadGcpIntoPinecone(fileKey: string) {

    try {

        //1. Obtain the pdf - download and read from pdf
        const file_name = await downloadFileFromGCP(fileKey);

        if (!file_name) {
            throw new Error("could not download from GCP");
        }
        const loader = new PDFLoader(file_name);
        const pages = (await loader.load()) as PDFPage[];

        //2. split and segment the pdf into smaller documents
        const documents = await Promise.all(pages.map(page => prepareDocument(page)));

        //3. Vectorise and embedd into individual documents
        const vectors = await Promise.all(documents.flat().map(embedDocument))

        //4. upload to pinecone DB
        const pineconeIndex = pinecone.index('chat-with-pdf');
        const namespace = pineconeIndex.namespace(convertToAscii(fileKey));

        await namespace.upsert(vectors)

        return documents[0];

    } catch (error) {
        console.log("Error in loadGcpIntoPinecone", error);
    }

}

//embedded documents using openAi and crete object for saving in pinecode Db as Vector
async function embedDocument(doc: Document) {
    try {

        const embeddings = await getEmbeddings(doc.pageContent);
        const hash = md5(doc.pageContent);

        return {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber
            }
        } as PineconeRecord

    } catch (error) {
        console.log("Error in embedDocument", error);
        throw new Error("Error in embedDocument");
    }
}
//this is for encodig string tilll accepted byte size for pinecode
export const truncateStringByBytes = (str: string, bytes: number) => {
    const enc = new TextEncoder();
    return new TextDecoder('utf8').decode(enc.encode(str).slice(0, bytes));
}


// this is to split single page data into multiple paragraphs/segments
async function prepareDocument(page: PDFPage) {
    try {
        let { pageContent, metadata } = page;
        pageContent = pageContent.replace(/\n/g, "");  //replace newline with empty string

        //split docs
        const splitter = new RecursiveCharacterTextSplitter()
        const docs = await splitter.splitDocuments([
            new Document({
                pageContent,
                metadata: {
                    pageNumber: metadata.loc.pageNumber,
                    text: truncateStringByBytes(pageContent, 36000)

                }
            })
        ]);

        return docs;
    } catch (error) {

    }
}

