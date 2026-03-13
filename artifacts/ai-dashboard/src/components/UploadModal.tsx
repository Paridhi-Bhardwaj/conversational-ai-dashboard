import React, { useState } from 'react';
import { UploadCloud, X, Loader2, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useUploadCsv } from '@workspace/api-client-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [tableName, setTableName] = useState('');
  const [error, setError] = useState('');
  
  const uploadMutation = useUploadCsv();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      const f = e.dataTransfer.files[0];
      if (f.name.endsWith('.csv')) {
        setFile(f);
        setTableName(f.name.replace('.csv', '').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase());
        setError('');
      } else {
        setError('Please upload a valid CSV file.');
      }
    }
  };

  const handleUpload = () => {
    if (!file || !tableName) {
      setError('File and table name are required.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      uploadMutation.mutate(
        { data: { tableName, csvContent: content } },
        {
          onSuccess: () => {
            setTimeout(() => {
              onSuccess();
              onClose();
              setFile(null);
              setTableName('');
              uploadMutation.reset();
            }, 1500);
          },
          onError: (err: any) => {
            setError(err?.data?.error || 'Failed to upload CSV');
          }
        }
      );
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-card border border-white/10 shadow-2xl"
        >
          <div className="p-6 pb-0 flex justify-between items-center">
            <h2 className="text-xl font-display font-semibold text-white">Upload Dataset</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {!uploadMutation.isSuccess ? (
              <>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center transition-colors relative overflow-hidden group",
                    file ? "border-primary/50 bg-primary/5" : "border-white/10 bg-black/20 hover:border-primary/30 hover:bg-white/5"
                  )}
                >
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const f = e.target.files[0];
                        setFile(f);
                        setTableName(f.name.replace('.csv', '').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase());
                        setError('');
                      }
                    }}
                  />
                  <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                    {file ? (
                      <FileSpreadsheet className="w-10 h-10 text-primary" />
                    ) : (
                      <UploadCloud className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                    
                    <div className="text-sm">
                      {file ? (
                        <span className="font-medium text-white">{file.name}</span>
                      ) : (
                        <span><span className="text-primary font-semibold">Click to upload</span> or drag and drop</span>
                      )}
                    </div>
                    {!file && <p className="text-xs text-muted-foreground">CSV files only</p>}
                  </div>
                </div>

                {file && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Dataset Name (Table)</label>
                    <Input 
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                      placeholder="e.g. q1_sales_data"
                    />
                  </div>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex justify-end space-x-3 pt-2">
                  <Button variant="ghost" onClick={onClose} disabled={uploadMutation.isPending}>Cancel</Button>
                  <Button 
                    variant="glow" 
                    onClick={handleUpload} 
                    disabled={!file || !tableName || uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                    ) : 'Upload & Analyze'}
                  </Button>
                </div>
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-white">Upload Complete!</h3>
                <p className="text-muted-foreground">
                  Processed {uploadMutation.data?.rowCount} rows into <span className="font-mono text-primary">{uploadMutation.data?.tableName}</span>.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
