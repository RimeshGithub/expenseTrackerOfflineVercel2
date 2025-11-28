"use client"

import { useEffect, useState } from "react"
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { Capacitor } from "@capacitor/core"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, FileText, FolderOpen, RefreshCcw, Share2, FolderOpenIcon } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { FileOpener } from "@capawesome-team/capacitor-file-opener"
import { Share } from "@capacitor/share"

type FileType = {
  name: string
  uri?: string
}

export default function DownloadsPage() {
  const [mounted, setMounted] = useState(false)
  const [files, setFiles] = useState<FileType[]>([])
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const EXPORT_FOLDER = "NepaliWallet"

  // Ensure folder exists
  const ensureFolderExists = async () => {
    try {
      await Filesystem.mkdir({
        path: EXPORT_FOLDER,
        directory: Directory.Documents,
        recursive: true,
      })
    } catch (e: any) {
      if (!String(e).includes("already exists")) {
        console.warn("Folder creation failed:", e)
      }
    }
  }

  useEffect(() => {
    setMounted(true)
    const mobile = Capacitor.getPlatform() !== "web"
    setIsMobile(mobile)

    const load = async () => {
      if (mobile) {
        await ensureFolderExists()
        await loadFiles()
      }
    }

    load()
  }, [isMobile])

  // Load files (Android only)
  const loadFiles = async () => {
    if (!isMobile) return
    setLoading(true)

    try {
      const result = await Filesystem.readdir({
        path: EXPORT_FOLDER,
        directory: Directory.Documents,
      })

      const entries = result.files || []

      const fileObjects: FileType[] = await Promise.all(
        entries.map(async (f) => {
          const name = typeof f === "string" ? f : f.name

          // Get file metadata
          const stat = await Filesystem.stat({
            path: `${EXPORT_FOLDER}/${name}`,
            directory: Directory.Documents,
          })

          return {
            name,
            ctime: stat.ctime ?? 0,  // creation time
            mtime: stat.mtime ?? 0,  // modification time
          }
        })
      )

      // 🔥 Sort newest first using ctime
      fileObjects.sort((a, b) => (b.ctime || 0) - (a.ctime || 0))

      setFiles(fileObjects)
    } catch (err) {
      console.error("Error listing files", err)
      setFiles([])
    }

    setLoading(false)
  }

  // Open file (Android only)
  const openFile = async (file: FileType) => {
    if (!isMobile) return

    try {
      // 1. Read original file (from Documents/NepaliWallet)
      const readResult = await Filesystem.readFile({
        path: `${EXPORT_FOLDER}/${file.name}`,
        directory: Directory.Documents,
      })

      // 2. Save into CACHE directory so Android can open it
      await Filesystem.writeFile({
        path: file.name,
        directory: Directory.Cache,
        data: readResult.data, // base64
      })

      // 3. Get REAL NATIVE FILE PATH for Android FileProvider
      const fileUri = await Filesystem.getUri({
        path: file.name,
        directory: Directory.Cache,
      })

      const realPath = fileUri.uri     // ← This is the REAL filesystem path
      console.log("Real Android path:", realPath)

      // 4. Open using system chooser
      await FileOpener.openFile({
        path: realPath,
        mimeType: file.name.endsWith(".pdf") ? "application/pdf" : file.name.endsWith(".csv") ? "text/csv" : "text/plain",
      })

    } catch (err) {
      console.error("Error opening file", err)
      alert("Failed to open file: " + (err as any).message)
    }
  }

  // Delete file (Android only)
  const deleteFile = async (file: FileType) => {
    if (!isMobile) return
    try {
      await Filesystem.deleteFile({
        path: `${EXPORT_FOLDER}/${file.name}`,
        directory: Directory.Documents,
      })
      setFiles((prev) => prev.filter((f) => f.name !== file.name))
    } catch (err) {
      console.error("Error deleting file", err)
    }
  }

  const shareFile = async (file: FileType) => {
    if (!isMobile) return

    try {
      // STEP 1: Read original file from Documents/NepaliWallet
      const readResult = await Filesystem.readFile({
        path: `${EXPORT_FOLDER}/${file.name}`,
        directory: Directory.Documents,
      })

      // STEP 2: Write it into CACHE because Android's share intent requires file provider paths
      await Filesystem.writeFile({
        path: file.name,
        directory: Directory.Cache,
        data: readResult.data, // base64 file content
      })

      // STEP 3: Get the REAL native path
      const uriResult = await Filesystem.getUri({
        path: file.name,
        directory: Directory.Cache,
      })

      const realPath = uriResult.uri
      console.log("Sharing file from path:", realPath)

      // STEP 4: Use Capacitor Share API
      await Share.share({
        title: "Share File",
        text: "Here is your exported file.",
        url: realPath, // VERY IMPORTANT
        dialogTitle: "Share your file",
      })

    } catch (err) {
      console.error("Share failed", err)
    }
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Downloads</h1>
          <p className="text-muted-foreground">
            {isMobile
              ? "View and manage your exported files."
              : "Please open your browser downloads to view and manage your exported files."}
          </p>
        </div>
        
        {isMobile && (
          <Card className="max-w-3xl">
            <CardHeader className="flex justify-between items-center">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Exported Files
                </CardTitle>
                <CardDescription>
                  All your exported files are listed here
                </CardDescription>
              </div>
              <Button
                onClick={loadFiles}
                variant="outline"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {
                loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : files.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No exported files found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.name}
                        className="flex flex-col items-center border rounded p-2 gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-6 w-6" />
                          <span className="text-sm">{file.name}</span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openFile(file)}
                          >
                            <FolderOpenIcon className="h-4 w-4 mr-1" />
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteFile(file)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => shareFile(file)}
                          >
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
