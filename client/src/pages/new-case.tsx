import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
import { insertCaseSchema, type InsertCase } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NewCase() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<InsertCase>({
    resolver: zodResolver(insertCaseSchema),
    defaultValues: {
      title: "",
      caseNumber: "",
      plaintiff: "",
      defendant: "",
      jurisdiction: "",
      status: "active",
      description: "",
    },
  });

  const createCase = useMutation({
    mutationFn: async (data: InsertCase) => {
      return await apiRequest("POST", "/api/cases", data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      toast({
        title: "Case created successfully",
        description: "Your case has been created and is ready for documents.",
      });
      setLocation(`/cases/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create case",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCase) => {
    createCase.mutate(data);
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/cases">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">New Case</h1>
          <p className="text-muted-foreground mt-1">
            Create a new legal case to organize documents and deadlines
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Case Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Case Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Contract Dispute - Smith v. Johnson"
                        {...field}
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormDescription>
                      A descriptive title for your case
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="caseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Case Number (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., CV-2024-12345"
                        {...field}
                        data-testid="input-case-number"
                      />
                    </FormControl>
                    <FormDescription>
                      The court-assigned case number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="plaintiff"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plaintiff</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Plaintiff name"
                          {...field}
                          data-testid="input-plaintiff"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defendant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Defendant</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Defendant name"
                          {...field}
                          data-testid="input-defendant"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="jurisdiction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jurisdiction</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Superior Court of California, County of Los Angeles"
                        {...field}
                        data-testid="input-jurisdiction"
                      />
                    </FormControl>
                    <FormDescription>
                      The court and jurisdiction for this case
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Select case status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the case..."
                        className="min-h-[100px]"
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createCase.isPending}
                  data-testid="button-submit"
                >
                  {createCase.isPending ? "Creating..." : "Create Case"}
                </Button>
                <Link href="/cases">
                  <Button variant="outline" type="button" data-testid="button-cancel">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
