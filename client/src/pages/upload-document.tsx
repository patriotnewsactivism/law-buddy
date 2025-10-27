import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { insertDocumentSchema, type InsertDocument, type Case } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, FileText, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { z } from "zod";

const uploadSchema = insertDocumentSchema.extend({
  file: z.any().optional(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

export default function UploadDocument() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");

  const { data: cases } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
  });

  const activeCases = cases?.filter((c) => c.status === "active") || [];

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      caseId: "",
      title: "",
      documentType: "complaint",
      content: "",
      fileName: "",
      fileSize: 0,
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    form.setValue("fileName", file.name);
    form.setValue("fileSize", file.size);

    // Read text content from file
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setExtractedText(text);
      form.setValue("content", text);
    };
    reader.readAsText(file);

    // Auto-fill title from filename
    if (!form.getValues("title")) {
      const titleFromFile = file.name.replace(/\.[^/.]+$/, "");
      form.setValue("title", titleFromFile);
    }
  };

  const uploadDocument = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload document");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", data.caseId, "documents"] });
      toast({
        title: "Document uploaded successfully",
        description: "AI analysis has been completed on your document.",
      });
      setLocation(`/documents/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to upload document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UploadFormData) => {
    // Check if we have either a file or manual content
    if (!uploadedFile && !data.content.trim()) {
      toast({
        title: "No content provided",
        description: "Please upload a file or enter document content",
        variant: "destructive",
      });
      return;
    }

    // If file is uploaded, use multipart upload
    if (uploadedFile) {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("caseId", data.caseId);
      formData.append("title", data.title);
      formData.append("documentType", data.documentType);
      
      uploadDocument.mutate(formData);
    } else {
      // Manual text input - use JSON endpoint
      const textData = new FormData();
      textData.append("caseId", data.caseId);
      textData.append("title", data.title);
      textData.append("documentType", data.documentType);
      textData.append("content", data.content);
      textData.append("fileName", "");
      textData.append("fileSize", "0");
      
      uploadDocument.mutate(textData);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/documents">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Upload Document</h1>
          <p className="text-muted-foreground mt-1">
            Upload and analyze legal documents with AI assistance
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload File (Optional)</label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".txt,.docx,.pdf"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                    data-testid="input-file"
                  />
                  {uploadedFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{uploadedFile.name}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported formats: TXT, DOCX, PDF. Or paste/type content below.
                </p>
              </div>

              <FormField
                control={form.control}
                name="caseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Associated Case</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-case">
                          <SelectValue placeholder="Select a case" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeCases.map((caseItem) => (
                          <SelectItem key={caseItem.id} value={caseItem.id}>
                            {caseItem.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose which case this document belongs to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Complaint for Breach of Contract"
                        {...field}
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-document-type">
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="complaint">Complaint</SelectItem>
                        <SelectItem value="motion">Motion</SelectItem>
                        <SelectItem value="response">Response</SelectItem>
                        <SelectItem value="discovery">Discovery</SelectItem>
                        <SelectItem value="brief">Brief</SelectItem>
                        <SelectItem value="order">Order</SelectItem>
                        <SelectItem value="correspondence">Correspondence</SelectItem>
                        <SelectItem value="evidence">Evidence</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of legal document
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste or type document content here..."
                        className="min-h-[200px] font-mono text-sm"
                        {...field}
                        data-testid="input-content"
                      />
                    </FormControl>
                    <FormDescription>
                      Text content will be auto-filled from uploaded file or you can paste it manually
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={uploadDocument.isPending}
                  data-testid="button-submit"
                >
                  {uploadDocument.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload & Analyze
                    </>
                  )}
                </Button>
                <Link href="/documents">
                  <Button variant="outline" type="button" data-testid="button-cancel">
                    Cancel
                  </Button>
                </Link>
              </div>

              {uploadDocument.isPending && (
                <div className="p-4 border rounded-md bg-muted">
                  <p className="text-sm text-muted-foreground">
                    AI is analyzing your document for legal issues, compliance, and recommendations. This may take a moment...
                  </p>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
