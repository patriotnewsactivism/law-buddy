import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Briefcase } from "lucide-react";
import { Link } from "wouter";
import type { Case } from "@shared/schema";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export default function Cases() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: cases, isLoading } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
  });

  const filteredCases = cases?.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.plaintiff.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.defendant.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cases</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your legal cases in one place
          </p>
        </div>
        <Link href="/cases/new">
          <Button data-testid="button-new-case">
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search cases by title, parties, or jurisdiction..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-cases"
        />
      </div>

      {/* Cases Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? "No cases found" : "No cases yet"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? "Try adjusting your search criteria"
              : "Create your first case to get started"}
          </p>
          {!searchQuery && (
            <Link href="/cases/new">
              <Button data-testid="button-create-first-case">
                <Plus className="h-4 w-4 mr-2" />
                Create Case
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((caseItem) => (
            <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
              <Card className="hover-elevate active-elevate-2 cursor-pointer h-full" data-testid={`card-case-${caseItem.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-lg">{caseItem.title}</CardTitle>
                    <Badge variant={caseItem.status === "active" ? "default" : "secondary"}>
                      {caseItem.status}
                    </Badge>
                  </div>
                  {caseItem.caseNumber && (
                    <p className="text-xs font-mono text-muted-foreground">
                      {caseItem.caseNumber}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <p className="font-medium text-foreground">{caseItem.plaintiff}</p>
                      <p className="text-muted-foreground text-xs">v.</p>
                      <p className="font-medium text-foreground">{caseItem.defendant}</p>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="font-mono text-xs">{caseItem.jurisdiction}</p>
                      <p className="text-xs">
                        Created {formatDistanceToNow(new Date(caseItem.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
