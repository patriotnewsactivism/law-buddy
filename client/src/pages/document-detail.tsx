import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { Document } from "@shared/schema";
import { format } from "date-fns";

export default function DocumentDetail() {
  const { id } = useParams();

  const { data: document, isLoading } = useQuery<Document>({
    queryKey: ["/api/documents", id],
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="h-10 bg-muted animate-pulse rounded w-1/3" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Document not found</h3>
        <Link href="/documents">
          <Button variant="outline">Back to Documents</Button>
        </Link>
      </div>
    );
  }

  const aiAnalysis = document.aiAnalysis as any;
  const complianceCheck = document.complianceCheck as any;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Link href="/documents">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground mb-1">{document.title}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{document.documentType}</Badge>
            <span className="text-sm text-muted-foreground">
              {format(new Date(document.createdAt), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content" data-testid="tab-content">
            Content
          </TabsTrigger>
          {aiAnalysis && (
            <TabsTrigger value="analysis" data-testid="tab-analysis">
              AI Analysis
            </TabsTrigger>
          )}
          {complianceCheck && (
            <TabsTrigger value="compliance" data-testid="tab-compliance">
              Compliance Check
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="content" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-md">
                  {document.content}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {aiAnalysis && (
          <TabsContent value="analysis" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{aiAnalysis.summary}</p>
                </CardContent>
              </Card>

              {aiAnalysis.keyIssues && aiAnalysis.keyIssues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiAnalysis.keyIssues.map((issue: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {aiAnalysis.legalClaims && aiAnalysis.legalClaims.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Legal Claims</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiAnalysis.legalClaims.map((claim: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{claim}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {aiAnalysis.strengths && aiAnalysis.strengths.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-chart-4" />
                        Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {aiAnalysis.strengths.map((strength: string, idx: number) => (
                          <li key={idx} className="text-sm">{strength}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {aiAnalysis.weaknesses && aiAnalysis.weaknesses.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Weaknesses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {aiAnalysis.weaknesses.map((weakness: string, idx: number) => (
                          <li key={idx} className="text-sm">{weakness}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiAnalysis.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}

        {complianceCheck && (
          <TabsContent value="compliance" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rule 12(b)(6) Compliance Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      {complianceCheck.overallAssessment === "pass" ? (
                        <CheckCircle className="h-6 w-6 text-chart-4" />
                      ) : complianceCheck.overallAssessment === "fail" ? (
                        <XCircle className="h-6 w-6 text-destructive" />
                      ) : (
                        <AlertTriangle className="h-6 w-6 text-yellow-500" />
                      )}
                      <span className="font-semibold text-lg capitalize">
                        {complianceCheck.overallAssessment?.replace("_", " ")}
                      </span>
                    </div>
                    {complianceCheck.score !== undefined && (
                      <Badge variant="secondary" className="text-base">
                        Score: {complianceCheck.score}/100
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {complianceCheck.findings && complianceCheck.findings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Findings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {complianceCheck.findings.map((finding: any, idx: number) => (
                        <div key={idx} className="p-4 border rounded-md">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-semibold">{finding.claim}</h4>
                            <Badge
                              variant={
                                finding.assessment === "pass"
                                  ? "default"
                                  : finding.assessment === "fail"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {finding.assessment}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {finding.reasoning}
                          </p>
                          {finding.suggestions && finding.suggestions.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium mb-1">Suggestions:</p>
                              <ul className="space-y-1">
                                {finding.suggestions.map((suggestion: string, sidx: number) => (
                                  <li key={sidx} className="text-sm text-muted-foreground">
                                    • {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {complianceCheck.recommendations && complianceCheck.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {complianceCheck.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
