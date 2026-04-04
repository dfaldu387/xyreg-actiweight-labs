import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CommunicationHub } from "./CommunicationHub";

interface PendingReview {
  id: string;
  documentName: string;
  productName: string;
  companyName: string;
  type: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'overdue';
  url: string;
}

export function ReviewerDashboard() {
  const navigate = useNavigate();

  // Mock review data - replace with real data
  const pendingReviews: PendingReview[] = [
    {
      id: "1",
      documentName: "Risk Management Plan v2.1",
      productName: "HeartGuard Pro",
      companyName: "CardioTech Solutions",
      type: "Risk Management",
      dueDate: "2024-02-28",
      priority: 'high',
      status: 'overdue',
      url: "/app/document/1"
    },
    {
      id: "2",
      documentName: "Clinical Evaluation Report",
      productName: "FlexiStent",
      companyName: "VascularDevices Inc",
      type: "Clinical",
      dueDate: "2024-03-05",
      priority: 'high',
      status: 'pending',
      url: "/app/document/2"
    },
    {
      id: "3",
      documentName: "Software Documentation v1.3",
      productName: "DigiHeart Monitor",
      companyName: "TechMed Corp",
      type: "Technical",
      dueDate: "2024-03-10",
      priority: 'medium',
      status: 'pending',
      url: "/app/document/3"
    }
  ];

  const overdueDocs = pendingReviews.filter(doc => doc.status === 'overdue').length;
  const totalPending = pendingReviews.length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const handleReviewClick = (review: PendingReview) => {
    navigate(review.url);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reviewer Mission Control</h1>
        <p className="text-muted-foreground">
          Document review dashboard - {totalPending} pending reviews
        </p>
      </div>

      <Tabs defaultValue="reviews" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reviews">Pending Reviews</TabsTrigger>
          <TabsTrigger value="deadlines">Review Deadlines</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-6">
          {/* Review Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{totalPending}</p>
                    <p className="text-sm text-muted-foreground">Pending Reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold text-destructive">{overdueDocs}</p>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Clock className="h-8 w-8 text-warning" />
                  <div>
                    <p className="text-2xl font-bold">{totalPending - overdueDocs}</p>
                    <p className="text-sm text-muted-foreground">Due Soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Reviews List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents Awaiting Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingReviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => handleReviewClick(review)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{review.documentName}</h3>
                        <Badge variant={getPriorityColor(review.priority)}>
                          {review.priority}
                        </Badge>
                        {review.status === 'overdue' && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {review.productName} • {review.companyName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Due: {review.dueDate} • {review.type}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Review
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deadlines" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingReviews
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .map((review) => (
                    <div key={review.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{review.documentName}</p>
                        <p className="text-sm text-muted-foreground">{review.productName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{review.dueDate}</p>
                        <Badge variant={review.status === 'overdue' ? 'destructive' : 'default'}>
                          {review.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          <CommunicationHub scope="reviewer" />
        </TabsContent>
      </Tabs>
    </div>
  );
}