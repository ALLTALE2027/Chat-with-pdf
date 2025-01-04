import { uploadFile } from "@/lib/googleStorage";


export async function POST(req: Request) {

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
        }

        const result = await uploadFile(file)
        return new Response(JSON.stringify(result), { status: 200 });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "File upload failed" }), { status: 500 });
    }

}