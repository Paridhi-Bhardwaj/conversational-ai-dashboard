import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Database, Menu, X, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useQueryDashboard, useGetQueryHistory, DashboardQueryResponse } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResultsView } from '@/components/Dashboard/ResultsView';
import { UploadModal } from '@/components/UploadModal';

const SUGGESTIONS = [
  "Show me monthly revenue for 2023",
  "Compare top 5 products by sales volume",
  "What is the average order value by region?",
  "Show daily active users over the last 30 days"
];

export function DashboardPage() {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [currentResponse, setCurrentResponse] = useState<DashboardQueryResponse | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isUploadOpen, setUploadOpen] = useState(false);
  
  const dashboardMutation = useQueryDashboard();
  const { data: history, refetch: refetchHistory } = useGetQueryHistory();

  const handleQuerySubmit = (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setActiveQuery(q);
    dashboardMutation.mutate(
      { data: { query: q } },
      {
        onSuccess: (data) => {
          setCurrentResponse(data);
          refetchHistory();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    );
  };

  const handleHistoryClick = (historicQuery: string) => {
    setSidebarOpen(false);
    handleQuerySubmit(historicQuery);
  };

  const hasResult = !!currentResponse;

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div 
        className={`fixed inset-y-0 left-0 z-50 w-72 glass-panel border-r border-white/10 transform lg:translate-x-0 lg:static lg:block transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Lumina AI
              </span>
            </div>
            <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <Button 
            variant="outline" 
            className="w-full justify-start text-left mb-8 border-white/10 hover:border-primary/50"
            onClick={() => {
              setCurrentResponse(null);
              setQuery('');
              setActiveQuery('');
              setSidebarOpen(false);
            }}
          >
            <MessageSquare className="w-4 h-4 mr-3" />
            New Analysis
          </Button>

          <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Data Sources</h3>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground hover:text-white"
                onClick={() => { setUploadOpen(true); setSidebarOpen(false); }}
              >
                <Database className="w-4 h-4 mr-3" />
                Upload CSV
              </Button>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Recent Queries</h3>
              <div className="space-y-1">
                {history?.slice(0, 10).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleHistoryClick(item.query)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-white/5 hover:text-white transition-colors truncate"
                  >
                    {item.query}
                  </button>
                ))}
                {(!history || history.length === 0) && (
                  <p className="text-sm text-muted-foreground/50 px-3 italic">No history yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden">
        {/* Top bar (mobile) */}
        <div className="lg:hidden flex items-center p-4 border-b border-white/5 glass-panel z-30 relative">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-white">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-display font-semibold ml-2">Lumina AI</span>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto relative scroll-smooth p-4 md:p-8 lg:p-12">
          <div className="max-w-5xl mx-auto w-full h-full flex flex-col">
            
            {/* Hero State (No Result) */}
            {!hasResult && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex-1 flex flex-col items-center justify-center text-center mt-[-10vh]"
              >
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                  <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-4 tracking-tight">
                  Chat with your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Data</span>.
                </h1>
                <p className="text-lg text-muted-foreground mb-12 max-w-2xl">
                  Connect your database or upload a CSV, and just ask questions. Lumina instantly writes SQL, analyzes results, and generates interactive dashboards.
                </p>

                <div className="w-full max-w-3xl relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
                  <div className="relative flex items-center bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 pl-6">
                    <Sparkles className="w-6 h-6 text-primary/70 mr-3" />
                    <input 
                      type="text"
                      className="flex-1 bg-transparent border-none text-lg text-white placeholder:text-muted-foreground focus:outline-none py-4"
                      placeholder="e.g. Show me revenue by region for last quarter..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuerySubmit(query)}
                    />
                    <Button 
                      size="lg" 
                      variant="glow" 
                      className="rounded-xl ml-2 px-6"
                      onClick={() => handleQuerySubmit(query)}
                      disabled={dashboardMutation.isPending || !query.trim()}
                    >
                      {dashboardMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>

                <div className="mt-12 flex flex-wrap justify-center gap-3 max-w-3xl">
                  {SUGGESTIONS.map((sug, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + (i * 0.1) }}
                      onClick={() => handleQuerySubmit(sug)}
                      className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-muted-foreground hover:text-white hover:bg-white/10 hover:border-primary/30 transition-all"
                    >
                      {sug}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Results State */}
            {hasResult && (
              <div className="flex-1 flex flex-col">
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <h2 className="text-2xl font-display font-semibold text-white">
                    "{activeQuery}"
                  </h2>
                </motion.div>

                {dashboardMutation.isPending ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                    <p className="text-lg text-muted-foreground animate-pulse">Analyzing data and generating insights...</p>
                  </div>
                ) : (
                  <ResultsView response={currentResponse!} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Follow-up Bar (only visible when there are results) */}
        <AnimatePresence>
          {hasResult && !dashboardMutation.isPending && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-20"
            >
              <div className="max-w-4xl mx-auto">
                <div className="relative flex items-center bg-card/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 pl-5">
                  <MessageSquare className="w-5 h-5 text-muted-foreground mr-3" />
                  <input 
                    type="text"
                    className="flex-1 bg-transparent border-none text-base text-white placeholder:text-muted-foreground focus:outline-none py-3"
                    placeholder="Ask a follow-up question..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuerySubmit(query)}
                  />
                  <Button 
                    variant="glow" 
                    className="rounded-xl ml-2"
                    onClick={() => handleQuerySubmit(query)}
                    disabled={dashboardMutation.isPending || !query.trim()}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setUploadOpen(false)} 
        onSuccess={() => refetchHistory()} 
      />
    </div>
  );
}
