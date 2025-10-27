import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, BookOpen, Scale } from "lucide-react";

export default function Research() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Legal Research</h1>
        <p className="text-muted-foreground mt-1">
          AI-powered legal research with verified sources
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate cursor-pointer">
          <CardHeader>
            <Search className="h-8 w-8 text-primary mb-3" />
            <CardTitle>Case Law Search</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Search relevant case precedents with AI-powered analysis
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer">
          <CardHeader>
            <Scale className="h-8 w-8 text-primary mb-3" />
            <CardTitle>Statute Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Analyze applicable statutes and regulations for your jurisdiction
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer">
          <CardHeader>
            <BookOpen className="h-8 w-8 text-primary mb-3" />
            <CardTitle>Legal Guides</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access comprehensive guides for pro se representation
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Advanced legal research features will be available in the next update.
            Use the AI Assistant to ask legal questions and get cited sources.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
