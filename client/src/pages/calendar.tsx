import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, AlertCircle, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import type { Deadline } from "@shared/schema";
import { format, isToday, isTomorrow, isPast, startOfDay } from "date-fns";

export default function Calendar() {
  const { data: deadlines, isLoading } = useQuery<Deadline[]>({
    queryKey: ["/api/deadlines"],
  });

  const sortedDeadlines = [...(deadlines || [])].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const upcomingDeadlines = sortedDeadlines.filter(
    (d) => !d.isCompleted && !isPast(new Date(d.dueDate))
  );
  const overdueDeadlines = sortedDeadlines.filter(
    (d) => !d.isCompleted && isPast(new Date(d.dueDate))
  );
  const completedDeadlines = sortedDeadlines.filter((d) => d.isCompleted);

  const getDeadlineStatus = (deadline: Deadline) => {
    if (deadline.isCompleted) return "completed";
    if (isPast(new Date(deadline.dueDate))) return "overdue";
    if (isToday(new Date(deadline.dueDate))) return "today";
    if (isTomorrow(new Date(deadline.dueDate))) return "tomorrow";
    return "upcoming";
  };

  const DeadlineCard = ({ deadline }: { deadline: Deadline }) => {
    const status = getDeadlineStatus(deadline);
    const dueDate = new Date(deadline.dueDate);

    return (
      <div
        className="p-4 border rounded-md"
        data-testid={`card-deadline-${deadline.id}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {status === "completed" ? (
                <CheckCircle className="h-4 w-4 text-chart-4 flex-shrink-0" />
              ) : status === "overdue" ? (
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              ) : (
                <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <h3 className="font-semibold text-foreground">{deadline.title}</h3>
            </div>
            {deadline.description && (
              <p className="text-sm text-muted-foreground mb-3">{deadline.description}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {deadline.deadlineType}
              </Badge>
              <span className="text-sm font-mono text-muted-foreground">
                {format(dueDate, "MMM d, yyyy 'at' h:mm a")}
              </span>
              {status === "today" && (
                <Badge variant="destructive">Today</Badge>
              )}
              {status === "tomorrow" && (
                <Badge variant="default">Tomorrow</Badge>
              )}
              {status === "overdue" && (
                <Badge variant="destructive">Overdue</Badge>
              )}
              {status === "completed" && (
                <Badge variant="default" className="bg-chart-4">Completed</Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar & Deadlines</h1>
          <p className="text-muted-foreground mt-1">
            Track important dates and filing deadlines
          </p>
        </div>
        <Link href="/deadlines/new">
          <Button data-testid="button-new-deadline">
            <Plus className="h-4 w-4 mr-2" />
            Add Deadline
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-upcoming">
              {upcomingDeadlines.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-overdue">
              {overdueDeadlines.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completed">
              {completedDeadlines.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : !deadlines || deadlines.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No deadlines yet</h3>
          <p className="text-muted-foreground mb-6">
            Add your first deadline to stay organized
          </p>
          <Link href="/deadlines/new">
            <Button data-testid="button-add-first-deadline">
              <Plus className="h-4 w-4 mr-2" />
              Add Deadline
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Overdue */}
          {overdueDeadlines.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-destructive mb-4">
                Overdue ({overdueDeadlines.length})
              </h2>
              <div className="space-y-3">
                {overdueDeadlines.map((deadline) => (
                  <DeadlineCard key={deadline.id} deadline={deadline} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingDeadlines.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">
                Upcoming ({upcomingDeadlines.length})
              </h2>
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline) => (
                  <DeadlineCard key={deadline.id} deadline={deadline} />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completedDeadlines.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-muted-foreground mb-4">
                Completed ({completedDeadlines.length})
              </h2>
              <div className="space-y-3">
                {completedDeadlines.map((deadline) => (
                  <DeadlineCard key={deadline.id} deadline={deadline} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
