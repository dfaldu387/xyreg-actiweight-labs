
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ErrorReport {
  timestamp: string;
  level: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
}

export function ErrorAudit() {
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [consoleErrors, setConsoleErrors] = useState<string[]>([]);

  useEffect(() => {
    loadStoredErrors();
    captureConsoleErrors();
  }, []);

  const loadStoredErrors = () => {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      setErrors(storedErrors);
    } catch (e) {
      console.warn('Failed to load stored errors:', e);
    }
  };

  const captureConsoleErrors = () => {
    const originalError = console.error;
    const originalWarn = console.warn;
    const capturedErrors: string[] = [];

    console.error = (...args) => {
      capturedErrors.push(`ERROR: ${args.join(' ')}`);
      setConsoleErrors([...capturedErrors]);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      capturedErrors.push(`WARN: ${args.join(' ')}`);
      setConsoleErrors([...capturedErrors]);
      originalWarn.apply(console, args);
    };

    // Restore original console methods on cleanup
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  };

  const clearErrors = () => {
    localStorage.removeItem('app_errors');
    setErrors([]);
    setConsoleErrors([]);
  };

  const exportErrors = () => {
    const allErrors = {
      boundaryErrors: errors,
      consoleErrors: consoleErrors,
      exportTime: new Date().toISOString(),
      url: window.location.href
    };

    const blob = new Blob([JSON.stringify(allErrors, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'page': return 'default';
      case 'component': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Error Audit Dashboard
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadStoredErrors}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportErrors}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="destructive" size="sm" onClick={clearErrors}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{errors.length}</div>
              <div className="text-sm text-red-600">Boundary Errors</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">{consoleErrors.length}</div>
              <div className="text-sm text-yellow-600">Console Errors</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {errors.length + consoleErrors.length}
              </div>
              <div className="text-sm text-blue-600">Total Issues</div>
            </div>
          </div>

          {/* Boundary Errors */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Error Boundary Reports</h3>
            <ScrollArea className="h-64 border rounded-lg p-4">
              {errors.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No error boundary reports</p>
              ) : (
                <div className="space-y-3">
                  {errors.map((error, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={getLevelColor(error.level)}>
                          {error.level}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(error.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-red-700 mb-1">
                        {error.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {error.url}
                      </p>
                      {error.stack && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-blue-600">
                            Stack Trace
                          </summary>
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                            {error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Console Errors */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Console Output</h3>
            <ScrollArea className="h-64 border rounded-lg p-4">
              {consoleErrors.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No console errors captured</p>
              ) : (
                <div className="space-y-1">
                  {consoleErrors.map((error, index) => (
                    <div key={index} className="text-xs font-mono p-2 bg-gray-50 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
