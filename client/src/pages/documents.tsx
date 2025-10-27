import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search, Upload } from "lucide-react";
import { Link } from "wouter";
import type { Document } from "@shared/schema";
import { useState } from "react";
import { format } from "date-fns";

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const filteredDocuments = documents?.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.documentType.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">
            View and analyze all your legal documents
          </p>
        </div>
        <Link href="/documents/upload">
          <Button data-testid="button-upload-document">
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-documents"
        />
      </div>

      {/* Documents List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? "No documents found" : "No documents yet"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? "Try adjusting your search criteria"
              : "Upload your first document to get started"}
          </p>
          {!searchQuery && (
            <Link href="/documents/upload">
              <Button data-testid="button-upload-first-document">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((doc) => (
            <Link key={doc.id} href={`/documents/${doc.id}`}>
              <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid={`card-document-${doc.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{doc.title}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">{doc.documentType}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(doc.createdAt), "MMM d, yyyy")}
                        </span>
                        {doc.fileName && (
                          <span className="text-sm font-mono text-muted-foreground">
                            {doc.fileName}
                          </span>
                        )}
                      </div>
                    </div>
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardHeader>
                {doc.aiAnalysis && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      AI Analysis available
                    </p>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
