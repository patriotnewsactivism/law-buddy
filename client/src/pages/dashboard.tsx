import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, Calendar, Plus, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import type { Case, Deadline } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: cases, isLoading: casesLoading } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
  });

  const { data: upcomingDeadlines, isLoading: deadlinesLoading } = useQuery<Deadline[]>({
    queryKey: ["/api/deadlines/upcoming"],
  });

  const activeCases = cases?.filter((c) => c.status === "active") || [];
  const totalDocuments = 0; // Will be populated from backend

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your cases and stay on top of deadlines
          </p>
        </div>
        <Link href="/cases/new">
          <Button data-testid="button-new-case">
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Cases
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-cases">
              {casesLoading ? "..." : activeCases.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-documents">
              {totalDocuments}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Deadlines
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-upcoming-deadlines">
              {deadlinesLoading ? "..." : upcomingDeadlines?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Cases */}
        <Card>
          <CardHeader>
            <CardTitle>Active Cases</CardTitle>
          </CardHeader>
          <CardContent>
            {casesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />
                ))}
              </div>
            ) : activeCases.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No active cases yet</p>
                <Link href="/cases/new">
                  <Button variant="outline" data-testid="button-create-first-case">
                    Create your first case
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeCases.slice(0, 5).map((caseItem) => (
                  <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
                    <div
                      className="p-4 border rounded-md hover-elevate active-elevate-2 cursor-pointer"
                      data-testid={`card-case-${caseItem.id}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{caseItem.title}</h3>
                        <Badge variant="secondary">{caseItem.status}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{caseItem.plaintiff} v. {caseItem.defendant}</p>
                        <p className="font-mono text-xs">{caseItem.jurisdiction}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            {deadlinesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />
                ))}
              </div>
            ) : !upcomingDeadlines || upcomingDeadlines.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No upcoming deadlines</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingDeadlines.slice(0, 5).map((deadline) => {
                  const daysUntil = Math.ceil(
                    (new Date(deadline.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  const isUrgent = daysUntil <= 7;

                  return (
                    <div
                      key={deadline.id}
                      className="p-4 border rounded-md"
                      data-testid={`card-deadline-${deadline.id}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{deadline.title}</h3>
                        {isUrgent && (
                          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          Due {formatDistanceToNow(new Date(deadline.dueDate), { addSuffix: true })}
                        </p>
                        <Badge variant={isUrgent ? "destructive" : "secondary"} className="text-xs">
                          {deadline.deadlineType}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
