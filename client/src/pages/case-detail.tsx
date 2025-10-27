import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Upload,
  Plus,
  Briefcase,
} from "lucide-react";
import type { Case, Document, Deadline } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";

export default function CaseDetail() {
  const { id } = useParams();
  
  const { data: caseItem, isLoading: caseLoading } = useQuery<Case>({
    queryKey: ["/api/cases", id],
  });

  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/cases", id, "documents"],
  });

  const { data: deadlines, isLoading: deadlinesLoading } = useQuery<Deadline[]>({
    queryKey: ["/api/cases", id, "deadlines"],
  });

  if (caseLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="h-10 bg-muted animate-pulse rounded w-1/3" />
        <div className="h-40 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="text-center py-12">
        <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Case not found</h3>
        <Link href="/cases">
          <Button variant="outline">Back to Cases</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Link href="/cases">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-foreground">{caseItem.title}</h1>
            <Badge variant={caseItem.status === "active" ? "default" : "secondary"}>
              {caseItem.status}
            </Badge>
          </div>
          {caseItem.caseNumber && (
            <p className="text-sm font-mono text-muted-foreground">
              {caseItem.caseNumber}
            </p>
          )}
        </div>
      </div>

      {/* Case Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Case Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Parties</h4>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Plaintiff:</span> {caseItem.plaintiff}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Defendant:</span> {caseItem.defendant}
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Jurisdiction</h4>
              <p className="text-sm font-mono">{caseItem.jurisdiction}</p>
            </div>
            {caseItem.description && (
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                <p className="text-sm">{caseItem.description}</p>
              </div>
            )}
            <div className="md:col-span-2">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Timeline</h4>
              <p className="text-sm">
                Created {formatDistanceToNow(new Date(caseItem.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Documents and Deadlines */}
      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents" data-testid="tab-documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents ({documents?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="deadlines" data-testid="tab-deadlines">
            <Calendar className="h-4 w-4 mr-2" />
            Deadlines ({deadlines?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle>Documents</CardTitle>
              <Link href={`/cases/${id}/upload`}>
                <Button size="sm" data-testid="button-upload-document">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : !documents || documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No documents yet</p>
                  <Link href={`/cases/${id}/upload`}>
                    <Button variant="outline" data-testid="button-upload-first-document">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload First Document
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <Link key={doc.id} href={`/documents/${doc.id}`}>
                      <div
                        className="p-4 border rounded-md hover-elevate active-elevate-2 cursor-pointer"
                        data-testid={`card-document-${doc.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-1">{doc.title}</h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary">{doc.documentType}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(doc.createdAt), "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deadlines" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle>Deadlines</CardTitle>
              <Link href={`/cases/${id}/deadline/new`}>
                <Button size="sm" data-testid="button-add-deadline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Deadline
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {deadlinesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : !deadlines || deadlines.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No deadlines yet</p>
                  <Link href={`/cases/${id}/deadline/new`}>
                    <Button variant="outline" data-testid="button-add-first-deadline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Deadline
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {deadlines.map((deadline) => {
                    const isPast = new Date(deadline.dueDate) < new Date();
                    return (
                      <div
                        key={deadline.id}
                        className="p-4 border rounded-md"
                        data-testid={`card-deadline-${deadline.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-1">{deadline.title}</h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary">{deadline.deadlineType}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(deadline.dueDate), "MMM d, yyyy 'at' h:mm a")}
                              </span>
                              {isPast && !deadline.isCompleted && (
                                <Badge variant="destructive">Overdue</Badge>
                              )}
                              {deadline.isCompleted && (
                                <Badge variant="default">Completed</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
