import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Database, TerminalSquare, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DynamicChart } from './DynamicChart';
import type { DashboardQueryResponse } from '@workspace/api-client-react';

interface ResultsViewProps {
  response: DashboardQueryResponse;
}

export function ResultsView({ response }: ResultsViewProps) {
  if (response.cannotAnswer) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-destructive/10 border border-destructive/20"
      >
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-xl font-display font-semibold text-white mb-2">Data Not Available</h3>
        <p className="text-muted-foreground max-w-md">
          I cannot answer this question based on the currently available dataset. Try asking about different metrics or uploading a new CSV.
        </p>
      </motion.div>
    );
  }

  const chartConfigs = response.chartConfigs.filter(c => c.type !== 'table');
  const tableConfig = response.chartConfigs.find(c => c.type === 'table');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-20"
    >
      {/* AI Insights */}
      {response.insights && response.insights.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-primary/20 bg-primary/5 shadow-primary/5">
            <CardHeader className="pb-3 flex flex-row items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <CardTitle>AI Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {response.insights.map((insight, idx) => (
                  <motion.li 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (idx * 0.1) }}
                    className="flex items-start text-foreground/90 leading-relaxed"
                  >
                    <span className="mr-3 text-primary mt-1.5 text-[10px]">●</span>
                    <span dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong className="text-white font-semibold">$1</strong>') }} />
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts Grid */}
      {chartConfigs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartConfigs.map((chart, idx) => (
            <motion.div 
              variants={itemVariants} 
              key={idx} 
              className={chartConfigs.length === 1 || idx === 2 ? "lg:col-span-2" : ""}
            >
              <Card className="h-full">
                <CardContent className="pt-6 h-full min-h-[400px]">
                  <DynamicChart config={chart} />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Data Table */}
      {tableConfig && tableConfig.data && tableConfig.data.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">Raw Data Results</CardTitle>
              </div>
              <div className="text-sm text-muted-foreground font-mono bg-black/30 px-3 py-1 rounded-md border border-white/5 flex items-center">
                <TerminalSquare className="w-4 h-4 mr-2 opacity-50" />
                {response.rowCount} rows returned
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/20">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-white/5">
                    <tr>
                      {(tableConfig.columns || Object.keys(tableConfig.data[0])).map((col) => (
                        <th key={col} className="px-6 py-4 font-medium tracking-wider">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tableConfig.data.slice(0, 100).map((row: any, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        {(tableConfig.columns || Object.keys(tableConfig.data[0])).map((col) => (
                          <td key={col} className="px-6 py-3 text-white/80 whitespace-nowrap">
                            {typeof row[col] === 'number' ? row[col].toLocaleString() : String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {tableConfig.data.length > 100 && (
                  <div className="p-4 text-center text-xs text-muted-foreground bg-black/40">
                    Showing first 100 rows.
                  </div>
                )}
              </div>
              
              <div className="mt-6 p-4 rounded-xl bg-black/40 border border-white/5 overflow-x-auto">
                <p className="text-xs text-muted-foreground font-mono mb-2 uppercase tracking-wider">Generated SQL</p>
                <code className="text-sm text-primary/80 whitespace-pre-wrap">{response.sql}</code>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
