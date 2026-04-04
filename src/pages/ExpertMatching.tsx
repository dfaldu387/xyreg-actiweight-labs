
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

export default function ExpertMatching() {
  return (
    <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 lg:py-4 space-y-2 sm:space-y-3 lg:space-y-4">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Communication</h1>
        <p className="text-muted-foreground">Connect and communicate with team members, stakeholders, and regulatory experts.</p>
      </header>

      <div className="grid gap-2 sm:gap-3 lg:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Team Communication</CardTitle>
            <CardDescription>
              Collaborate and communicate effectively with your team and external partners.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">This feature is coming soon. You will be able to:</p>
            <ul className="list-disc pl-5 space-y-1 mb-6">
              <li>Send messages to team members and stakeholders</li>
              <li>Create communication channels for different projects</li>
              <li>Share documents and updates in real-time</li>
              <li>Schedule meetings and coordinate with regulatory experts</li>
            </ul>
            
            <div className="flex justify-center">
              <Button disabled className="gap-2">
                <Users className="h-4 w-4" />
                Communication Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
