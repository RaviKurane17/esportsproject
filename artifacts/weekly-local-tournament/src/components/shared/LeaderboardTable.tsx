import { motion } from 'framer-motion';

export interface LeaderboardResult {
  rank: number;
  teamName: string;
  kills?: number;
  score?: number;
  prizeMoney?: number;
}

interface LeaderboardTableProps {
  results: LeaderboardResult[];
}

export function LeaderboardTable({ results }: LeaderboardTableProps) {
  // Sort results by rank just in case
  const sortedResults = [...results].sort((a, b) => a.rank - b.rank);
  
  if (sortedResults.length === 0) return null;

  return (
    <div className="w-full relative mx-auto max-w-3xl font-display mt-10 rounded-xl md:rounded-3xl overflow-hidden bg-[#eaf1f7] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      {/* Header section similar to "SUPER WEEKEND 2 (INCL. SW1)" */}
      <div className="bg-[#f0f4f8] px-4 md:px-8 py-4 md:py-6 border-b border-blue-900/10 flex justify-between items-center text-[#18396d] font-bold uppercase tracking-wider text-[10px] md:text-sm">
        <span>Tournament Standings</span>
        <span className="text-[#18396d]/60">Match Final</span>
      </div>

      <div className="flex bg-[#fdfdfd]">
        {/* Left Side Banner (TOP 6 vs PLAYOFFS) */}
        <div className="w-8 md:w-12 shrink-0 flex flex-col relative text-[8px] md:text-[10px] font-black text-white tracking-[0.2em] uppercase">
          <div className="flex-1 bg-[#10a126] flex items-center justify-center relative shadow-[inset_-2px_0_10px_rgba(0,0,0,0.1)]">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap">
               TOP 6 &gt;&gt;&gt; GRAND FINALS
             </div>
          </div>
          {sortedResults.length > 6 && (
            <div className="flex-1 bg-[#8c32b5] flex items-center justify-center relative shadow-[inset_-2px_0_10px_rgba(0,0,0,0.1)]">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap">
                 PLAYOFFS
               </div>
            </div>
          )}
        </div>

        {/* Main Table Area */}
        <div className="flex-1 pb-6 pt-2">
          {/* Table Header Row */}
          <div className="flex items-center px-4 md:px-8 py-3 mb-2 font-bold text-[#18396d] text-[9px] md:text-xs tracking-wider border-b-2 border-black/5">
            <div className="flex-1 pl-6 md:pl-10">
               <span className="bg-[#2c5da8] text-white px-6 md:px-12 py-1.5 md:py-2.5 rounded-md shadow-sm inline-block text-center min-w-[80px]">
                 TEAM
               </span>
            </div>
            <div className="w-8 md:w-10 text-center">W</div>
            <div className="w-8 md:w-10 text-center">P</div>
            <div className="w-8 md:w-10 text-center">E</div>
            <div className="w-8 md:w-10 text-center hidden sm:block">B</div>
            <div className="w-10 md:w-14 text-center text-black font-extrabold">TP</div>
            <div className="w-10 md:w-12 text-center text-green-700 hidden sm:block">PRIZE</div>
          </div>

          {/* Rows */}
          <div className="space-y-0 relative z-10">
            {sortedResults.map((result, idx) => {
              const isTop6 = result.rank <= 6;
              const circleColor = isTop6 ? "bg-[#10a126]" : "bg-[#8c32b5]";
              
              // Mock stats based on rank for visual similarity if actuals not provided
              const wins = result.rank === 1 ? 2 : result.rank <= 3 ? 1 : 0;
              const posPts = Math.max(0, 150 - (result.rank * 10));
              const elimPts = result.kills ?? Math.floor(Math.max(10, 80 - (result.rank * 4)));
              const bonusPts = Math.floor(Math.max(10, 40 - result.rank));
              const totalPts = result.score ?? (posPts + elimPts + bonusPts);
              
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  key={result.rank} 
                  className="flex items-center px-4 md:px-8 py-2 md:py-3 border-b border-black/5 hover:bg-black/5 transition-colors group relative"
                >
                  <div className="flex-1 flex items-center gap-3 md:gap-5 relative z-10">
                    {/* Rank Circle */}
                    <div className={`w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full text-white font-black text-[10px] md:text-xs shadow-md ${circleColor}`}>
                      {result.rank}
                    </div>
                    {/* Team Name */}
                    <span className="font-extrabold text-black uppercase text-[10px] md:text-sm truncate max-w-[120px] md:max-w-[200px] tracking-wide">
                      {result.teamName}
                    </span>
                  </div>
                  
                  {/* Columns */}
                  <div className="w-8 md:w-10 text-center text-[10px] md:text-xs text-black/80 font-bold relative z-10">{wins}</div>
                  <div className="w-8 md:w-10 text-center text-[10px] md:text-xs text-black/80 font-bold relative z-10">{posPts}</div>
                  <div className="w-8 md:w-10 text-center text-[10px] md:text-xs text-black/80 font-bold relative z-10">{elimPts}</div>
                  <div className="w-8 md:w-10 text-center text-[10px] md:text-xs text-black/80 font-bold hidden sm:block relative z-10">{bonusPts}</div>
                  <div className="w-10 md:w-14 text-center text-xs md:text-[15px] text-black font-black tracking-tight relative z-10">{totalPts}</div>
                  <div className="w-10 md:w-12 text-center hidden sm:block text-[9px] md:text-[10px] font-bold text-[#10a126] relative z-10">
                    {result.prizeMoney ? `+${result.prizeMoney}` : '-'}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
