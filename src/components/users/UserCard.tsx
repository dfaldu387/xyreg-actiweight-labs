import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, User, Mail, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserCardProps {
  user: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    avatar_url?: string | null;
    functional_area?: string;
    access_level?: string;
  };
  canEdit?: boolean;
  onAvatarUpdate?: (avatarUrl: string) => void;
}

const getFunctionalAreaDisplay = (functionalArea?: string) => {
  switch (functionalArea) {
    case "design_development":
      return "Design & Development";
    case "sales_marketing":
      return "Sales & Marketing";
    case "regulatory_affairs":
      return "Regulatory Affairs";
    case "quality_assurance":
      return "Quality Assurance";
    case "research_development":
      return "Research & Development";
    case "manufacturing":
      return "Manufacturing";
    case "clinical_affairs":
      return "Clinical Affairs";
    default:
      return functionalArea ? functionalArea.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "Unassigned";
  }
};

const getAccessLevelColor = (accessLevel?: string) => {
  switch (accessLevel) {
    case "admin":
      return "bg-red-100 text-red-800 border-red-200";
    case "editor":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "viewer":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export function UserCard({ user, canEdit = false, onAvatarUpdate }: UserCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const displayName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : user.email;

  const initials = user.first_name && user.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`
    : user.email[0].toUpperCase();

  const handleAvatarUpload = async (file: File) => {
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Call callback to update UI
      onAvatarUpdate?.(publicUrl);
      setShowUploadDialog(false);

      toast({
        title: "Avatar updated",
        description: "Your profile photo has been updated successfully"
      });

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to update avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
  };

  return (
    <Card className="w-full max-w-sm bg-white border border-border hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            {canEdit && (
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full p-0"
                  >
                    <Camera className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Update Profile Photo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={user.avatar_url || undefined} alt={displayName} />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose Photo
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center">
                      Recommended: Square image, max 5MB
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-3 w-3 text-muted-foreground" />
              <h3 className="font-medium text-sm truncate">{displayName}</h3>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            
            <div className="space-y-1">
              {user.access_level && (
                <Badge variant="outline" className={`text-xs ${getAccessLevelColor(user.access_level)}`}>
                  {user.access_level}
                </Badge>
              )}
              
              {user.functional_area && (
                <Badge variant="secondary" className="text-xs">
                  {getFunctionalAreaDisplay(user.functional_area)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}