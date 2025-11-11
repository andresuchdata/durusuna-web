"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadProgress, useUploadProgress } from "@/components/ui/upload-progress";

export function UploadProgressDemo() {
  const {
    files,
    addFiles,
    updateFileProgress,
    updateFileStatus,
    clearFiles,
  } = useUploadProgress();

  const [isSimulating, setIsSimulating] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
  };

  const simulateUpload = async () => {
    if (files.length === 0) return;
    
    setIsSimulating(true);
    
    // Simulate upload progress for each file
    const uploadPromises = files.map(async (file) => {
      updateFileStatus(file.id, 'uploading');
      
      // Simulate progress updates
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
        updateFileProgress(file.id, progress);
      }
      
      // Randomly simulate success or error
      const success = Math.random() > 0.3; // 70% success rate
      if (success) {
        updateFileStatus(file.id, 'completed');
      } else {
        updateFileStatus(file.id, 'error', 'Simulated upload error');
      }
    });
    
    await Promise.all(uploadPromises);
    setIsSimulating(false);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Upload Progress Demo</CardTitle>
        <CardDescription>
          Test the new progress bar component with file uploads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Input */}
        <div>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Progress Display */}
        <UploadProgress
          files={files}
          onFilesChange={() => {}} // Handled by useUploadProgress
          showPreviews={true}
          compact={false}
        />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={simulateUpload}
            disabled={files.length === 0 || isSimulating}
          >
            {isSimulating ? 'Uploading...' : 'Simulate Upload'}
          </Button>
          <Button
            variant="outline"
            onClick={clearFiles}
            disabled={files.length === 0 || isSimulating}
          >
            Clear All
          </Button>
        </div>

        {/* Stats */}
        {files.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Total files: {files.length} | 
            Pending: {files.filter(f => f.status === 'pending').length} | 
            Uploading: {files.filter(f => f.status === 'uploading').length} | 
            Completed: {files.filter(f => f.status === 'completed').length} | 
            Errors: {files.filter(f => f.status === 'error').length}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
