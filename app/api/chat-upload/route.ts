import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { mkdir, writeFile } from "fs/promises"
import { join } from "path"

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"]
const FILE_EXTS = [".pdf", ".doc", ".docx", ".txt", ".zip", ".xlsx", ".pptx", ".csv"]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file || file.size === 0) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 })
    }

    const isImage = IMAGE_TYPES.includes(file.type)
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "bin")

    if (!isImage && !FILE_EXTS.includes(ext)) {
        return NextResponse.json(
            { error: "Unsupported file type. Allowed: images, pdf, doc, docx, txt, zip, xlsx, pptx, csv" },
            { status: 400 }
        )
    }

    try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const uploadDir = join(process.cwd(), "public", "uploads", "chat")
        await mkdir(uploadDir, { recursive: true })

        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
        const fileName = `${Date.now()}-${safeName}`
        const filePath = join(uploadDir, fileName)
        await writeFile(filePath, buffer)

        const url = `/uploads/chat/${fileName}`
        const type = isImage ? "image" : "file"

        return NextResponse.json({ url, type, name: file.name })
    } catch (error) {
        console.error("[chat-upload] Error:", error)
        return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }
}
