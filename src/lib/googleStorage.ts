import { Storage, GetSignedUrlConfig } from "@google-cloud/storage";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";

const storage = new Storage({
    projectId: "chat-with-pdf-446220",
    credentials: {
        client_email: process.env.GCS_CLIENT_EMAIL,
        private_key: process.env.GCS_PRIVATE_KEY?.split(String.raw`\n`).join("\n"),
    },
});
const bucketName = "chat_with_pdf";

export async function uploadFile(file: File) {
    try {
        const fileKey = 'uploads/' + Date.now().toString() + file.name.replace(" ", "-");
        const buffer = await file.arrayBuffer();
        await storage.bucket(bucketName).file(fileKey).save(Buffer.from(buffer));
        return {
            file_key: fileKey,
            file_name: file.name
        }

    } catch (error) {
        console.log("Error in Upload", error);
    }
}

export async function GetGcpUrl(file_key: string) {
    try {
        const options: GetSignedUrlConfig = {
            version: 'v4',
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 15 minutes
        };

        // Get a v4 signed URL for reading the file
        const [url] = await storage.bucket(bucketName).file(file_key).getSignedUrl(options);

        if (!url) {
            throw new Error('Failed to generate signed URL');
        }
        return url;

    } catch (error) {
        console.log("Error in GetGcpUrl", error);
    }
}

export async function downloadFileFromGCP(file_key: string) {
    try {

        const [contents] = await storage.bucket(bucketName).file(file_key).download();
        const tmpDir = './tmp';
        const file_name = `${tmpDir}/pdf-${Date.now()}.pdf`;

        if (!existsSync(tmpDir)) {
            mkdirSync(tmpDir);
        }
        writeFileSync(file_name, contents as Buffer);

        return file_name;
    } catch (error) {
        console.log("Error in downloadFileFromGCP", error);
        return null;
    }
}