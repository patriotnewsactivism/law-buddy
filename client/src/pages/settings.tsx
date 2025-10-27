import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your preferences and account settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium mb-1">Theme</h4>
              <p className="text-sm text-muted-foreground">
                Choose your preferred color scheme
              </p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <SettingsIcon className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Legal AI Assistant</h4>
              <p className="text-sm text-muted-foreground">
                Your AI-powered legal companion for pro se representation. This
                application combines attorney and paralegal expertise with
                continuous learning to help you manage cases, generate documents,
                and ensure compliance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
