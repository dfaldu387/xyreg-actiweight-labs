
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Book, Play, FileText, Users, Settings, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from '@/hooks/useTranslation';

interface HelpTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  userRoles: string[];
  tags: string[];
  videoUrl?: string;
}

const helpTopics: HelpTopic[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with XYREG',
    description: 'Complete guide to getting started with the platform',
    category: 'Getting Started',
    content: `
# Getting Started with XYREG

Welcome to the XYREG Medical Device Regulatory Management Platform! This guide will help you get started quickly.

## First Steps
1. **Complete your profile** - Add your company information and role
2. **Set up your first company** - Configure phases, documents, and templates
3. **Create your first product** - Start managing your device lifecycle
4. **Upload documents** - Begin building your regulatory documentation

## Key Features
- **Company Dashboard**: Overview of all your products and compliance status
- **Product Management**: Track devices through regulatory phases
- **Document Control**: Manage regulatory documentation and templates
- **Gap Analysis**: Assess compliance with regulatory frameworks
    `,
    userRoles: ['admin', 'company_admin', 'consultant', 'editor', 'viewer'],
    tags: ['basics', 'setup', 'introduction']
  },
  {
    id: 'company-management',
    title: 'Company Management',
    description: 'How to set up and manage company settings',
    category: 'Company Management',
    content: `
# Company Management

Learn how to effectively manage your company settings and configuration.

## Company Dashboard
- View product portfolio and status
- Monitor compliance across all products
- Track recent activities and updates

## Company Settings
- Configure lifecycle phases
- Set up document templates
- Manage user permissions
- Configure audit frameworks
    `,
    userRoles: ['admin', 'company_admin', 'consultant'],
    tags: ['company', 'settings', 'configuration']
  },
  {
    id: 'product-lifecycle',
    title: 'Product Lifecycle Management',
    description: 'Managing products through regulatory phases',
    category: 'Product Management',
    content: `
# Product Lifecycle Management

Track your medical devices through all regulatory phases from concept to post-market surveillance.

## Lifecycle Phases
- **Concept**: Initial product planning
- **Design & Development**: Product development and testing
- **Design Transfer**: Manufacturing preparation
- **Post-Market Surveillance**: Market monitoring

## Phase Management
- Move products between phases
- Track phase-specific requirements
- Monitor milestone completion
    `,
    userRoles: ['admin', 'company_admin', 'consultant', 'editor'],
    tags: ['product', 'lifecycle', 'phases']
  },
  {
    id: 'document-control',
    title: 'Document Control System',
    description: 'Managing regulatory documents and templates',
    category: 'Document Management',
    content: `
# Document Control System

Manage your regulatory documentation efficiently with our document control system.

## Document Types
- **Company Templates**: Reusable document templates
- **Product Documents**: Product-specific documentation
- **Phase Documents**: Phase-assigned requirements

## Document Workflow
1. **Draft**: Initial document creation
2. **Under Review**: Document review process
3. **Reviewed**: Review completed
4. **Approved**: Final approval
    `,
    userRoles: ['admin', 'company_admin', 'consultant', 'editor'],
    tags: ['documents', 'templates', 'workflow']
  }
];

interface HelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpSystem({ isOpen, onClose }: HelpSystemProps) {
  const { lang } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { userRole } = useAuth();

  const categories = ['all', ...Array.from(new Set(helpTopics.map(topic => topic.category)))];

  const filteredTopics = helpTopics.filter(topic => {
    // Filter by user role
    if (!topic.userRoles.includes(userRole || 'viewer')) return false;
    
    // Filter by category
    if (selectedCategory !== 'all' && topic.category !== selectedCategory) return false;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        topic.title.toLowerCase().includes(query) ||
        topic.description.toLowerCase().includes(query) ||
        topic.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Getting Started': return <Play className="h-4 w-4" />;
      case 'Company Management': return <Settings className="h-4 w-4" />;
      case 'Product Management': return <Activity className="h-4 w-4" />;
      case 'Document Management': return <FileText className="h-4 w-4" />;
      case 'User Management': return <Users className="h-4 w-4" />;
      default: return <Book className="h-4 w-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-border p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{lang('helpSystem.title')}</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
            </div>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={lang('helpSystem.searchPlaceholder')}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="text-xs"
                  >
                    {category === 'all' ? lang('helpSystem.all') : category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Topics List */}
            <div className="space-y-2">
              {filteredTopics.map((topic) => (
                <Card
                  key={topic.id}
                  className={`cursor-pointer transition-colors ${
                    selectedTopic?.id === topic.id ? 'bg-accent' : 'hover:bg-accent/50'
                  }`}
                  onClick={() => setSelectedTopic(topic)}
                >
                  <CardHeader className="p-3">
                    <div className="flex items-start gap-2">
                      {getCategoryIcon(topic.category)}
                      <div className="flex-1">
                        <CardTitle className="text-sm">{topic.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {topic.description}
                        </CardDescription>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {topic.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedTopic ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  {getCategoryIcon(selectedTopic.category)}
                  <div>
                    <h1 className="text-2xl font-bold">{selectedTopic.title}</h1>
                    <p className="text-muted-foreground">{selectedTopic.description}</p>
                  </div>
                </div>

                {selectedTopic.videoUrl && (
                  <div className="mb-6">
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Play className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{lang('helpSystem.videoAvailable')}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ 
                    __html: selectedTopic.content.replace(/\n/g, '<br>').replace(/#{1,6}\s(.+)/g, '<h3>$1</h3>') 
                  }} />
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {selectedTopic.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Book className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">{lang('helpSystem.welcome')}</h3>
                <p className="text-muted-foreground">
                  {lang('helpSystem.selectTopic')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
