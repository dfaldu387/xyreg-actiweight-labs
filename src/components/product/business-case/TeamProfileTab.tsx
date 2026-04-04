import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Users, Linkedin, ArrowRight, Upload, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { resizeImageToSquare } from '@/utils/imageProcessingUtils';
import { TeamGapsForm } from './TeamGapsForm';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
interface TeamMember {
  id: string;
  name: string;
  role?: string;
  bio?: string;
  linkedin_url?: string;
  avatar_url?: string;
}

interface TeamProfileTabProps {
  disabled?: boolean;
}

export function TeamProfileTab({ disabled = false }: TeamProfileTabProps) {
  const { productId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({ name: '', role: '', bio: '', linkedin_url: '', avatar_url: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'profiles' | 'gap-analysis'>('profiles');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { lang } = useTranslation();

  // Fetch product to get company_id for TeamGapsForm
  const { data: product } = useProductDetails(productId);

  // Check if in Genesis flow
  const isInGenesisFlow = searchParams.get('returnTo') === 'genesis';

  // Fetch team members for this product
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['team-members', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('product_id', productId)
        .order('inserted_at', { ascending: true });

      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!productId,
  });

  // Genesis flow completion check - requires at least 1 team member
  const hasTeamMembers = (teamMembers?.length ?? 0) > 0;

  // Get Genesis flow border class for team profiles section
  const getGenesisBorderClass = () => {
    if (!isInGenesisFlow) return '';
    if (hasTeamMembers) return 'border-2 border-emerald-500 bg-emerald-50/30';
    return 'border-2 border-amber-400 bg-amber-50/30';
  };

  // Add team member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (member: Omit<TeamMember, 'id'>) => {
      const { data, error } = await supabase
        .from('team_members')
        .insert({ 
          product_id: productId, 
          name: member.name,
          role: member.role || null,
          bio: member.bio || null,
          linkedin_url: member.linkedin_url || null,
          avatar_url: member.avatar_url || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', productId] });
      queryClient.invalidateQueries({ queryKey: ['funnel-team', productId] });
      queryClient.invalidateQueries({ queryKey: ['calculated-viability-score', productId] });
      toast.success(lang('teamProfile.toast.memberAdded'));
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(lang('teamProfile.toast.addFailed'));
      console.error(error);
    },
  });

  // Update team member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async (member: TeamMember) => {
      const { data, error } = await supabase
        .from('team_members')
        .update({ 
          name: member.name,
          role: member.role || null,
          bio: member.bio || null,
          linkedin_url: member.linkedin_url || null,
          avatar_url: member.avatar_url || null,
        })
        .eq('id', member.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', productId] });
      queryClient.invalidateQueries({ queryKey: ['funnel-team', productId] });
      queryClient.invalidateQueries({ queryKey: ['calculated-viability-score', productId] });
      toast.success(lang('teamProfile.toast.memberUpdated'));
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(lang('teamProfile.toast.updateFailed'));
      console.error(error);
    },
  });

  // Delete team member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', productId] });
      queryClient.invalidateQueries({ queryKey: ['funnel-team', productId] });
      queryClient.invalidateQueries({ queryKey: ['calculated-viability-score', productId] });
      toast.success(lang('teamProfile.toast.memberRemoved'));
    },
    onError: (error) => {
      toast.error(lang('teamProfile.toast.removeFailed'));
      console.error(error);
    },
  });

  const resetForm = () => {
    setFormData({ name: '', role: '', bio: '', linkedin_url: '', avatar_url: '' });
    setPreviewUrl(null);
    setEditingMember(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(lang('teamProfile.toast.selectImageFile'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(lang('teamProfile.toast.imageTooLarge'));
      return;
    }

    setUploadingImage(true);
    
    try {
      // Process image to square format (400x400) before upload
      const processedBlob = await resizeImageToSquare(file, 400);
      
      // Create preview from processed blob
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(processedBlob);

      // Upload processed blob to Supabase Storage
      const fileName = `${crypto.randomUUID()}.png`;
      const filePath = `team-avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, processedBlob, {
          contentType: 'image/png',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success(lang('teamProfile.toast.imageUploaded'));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(lang('teamProfile.toast.uploadFailed'));
      setPreviewUrl(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setFormData(prev => ({ ...prev, avatar_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(lang('teamProfile.toast.nameRequired'));
      return;
    }
    if (editingMember) {
      updateMemberMutation.mutate({ ...formData, id: editingMember.id });
    } else {
      addMemberMutation.mutate(formData);
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role || '',
      bio: member.bio || '',
      linkedin_url: member.linkedin_url || '',
      avatar_url: member.avatar_url || '',
    });
    setPreviewUrl(member.avatar_url || null);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleNextStep = () => {
    navigate(`/app/product/${productId}/business-case?tab=venture-blueprint`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs for Team */}
      <Tabs value={subTab} onValueChange={(v) => setSubTab(v as 'profiles' | 'gap-analysis')}>
        <TabsList className="mb-4">
          <TabsTrigger value="profiles">{lang('teamProfile.subTabs.profiles')}</TabsTrigger>
          <TabsTrigger value="gap-analysis">{lang('teamProfile.subTabs.gapAnalysis')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="mt-0 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{lang('teamProfile.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {lang('teamProfile.subtitle')}
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button disabled={disabled}>
                  <Plus className="h-4 w-4 mr-2" />
                  {lang('teamProfile.addTeamMember')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingMember ? lang('teamProfile.editTeamMember') : lang('teamProfile.addTeamMember')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Profile Picture Upload */}
                  <div className="space-y-2">
                    <Label>{lang('teamProfile.form.profilePicture')}</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-20 w-20">
                          {previewUrl || formData.avatar_url ? (
                            <AvatarImage src={previewUrl || formData.avatar_url} alt="Preview" className="object-cover" />
                          ) : (
                            <AvatarFallback className="text-lg bg-primary/10 text-primary">
                              {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {(previewUrl || formData.avatar_url) && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={handleRemoveImage}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="avatar-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingImage ? lang('teamProfile.form.uploading') : lang('teamProfile.form.uploadPhoto')}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          {lang('teamProfile.form.imageHint')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">{lang('teamProfile.form.nameRequired')}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={lang('teamProfile.form.namePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">{lang('teamProfile.form.role')}</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder={lang('teamProfile.form.rolePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">{lang('teamProfile.form.bio')}</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder={lang('teamProfile.form.bioPlaceholder')}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">{lang('teamProfile.form.linkedinUrl')}</Label>
                    <Input
                      id="linkedin"
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                      placeholder={lang('teamProfile.form.linkedinPlaceholder')}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)}>
                      {lang('teamProfile.form.cancel')}
                    </Button>
                    <Button type="submit" disabled={addMemberMutation.isPending || updateMemberMutation.isPending}>
                      {editingMember
                        ? (updateMemberMutation.isPending ? lang('teamProfile.form.saving') : lang('teamProfile.form.saveChanges'))
                        : (addMemberMutation.isPending ? lang('teamProfile.form.adding') : lang('teamProfile.form.addMember'))
                      }
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Team Members Grid */}
          <div className={cn("rounded-lg p-4", getGenesisBorderClass())}>
            {teamMembers && teamMembers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teamMembers.map((member) => (
                  <Card key={member.id} className="relative group">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          {member.avatar_url ? (
                            <AvatarImage src={member.avatar_url} alt={member.name} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{member.name}</h3>
                          {member.role && (
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                          )}
                          {member.bio && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{member.bio}</p>
                          )}
                          {member.linkedin_url && (
                            <a
                              href={member.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                            >
                              <Linkedin className="h-3 w-3" />
                              LinkedIn
                            </a>
                          )}
                        </div>
                      </div>
                      {!disabled && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditMember(member)}
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => deleteMemberMutation.mutate(member.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-0 shadow-none">
                <CardContent className="py-12">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">{lang('teamProfile.emptyState.title')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {lang('teamProfile.emptyState.description')}
                    </p>
                    <Button onClick={() => setIsDialogOpen(true)} disabled={disabled}>
                      <Plus className="h-4 w-4 mr-2" />
                      {lang('teamProfile.emptyState.addFirst')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

        </TabsContent>
        
        <TabsContent value="gap-analysis" className="mt-0">
          {productId && product?.company_id && (
            <TeamGapsForm productId={productId} companyId={product.company_id} disabled={disabled} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
