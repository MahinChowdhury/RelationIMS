const CustomerInsights = () => {
  return (
    <div className="col-span-12 lg:col-span-6 bg-primary text-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl shadow-primary/20 flex flex-col justify-between">
      <div>
        <h4 className="text-lg font-extrabold tracking-tight mb-5 sm:mb-6">Customer Insights</h4>
        <div className="space-y-6 sm:space-y-8">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold opacity-80 uppercase tracking-widest">Returning</span>
              <span className="text-sm font-extrabold">64%</span>
            </div>
            <div className="w-full h-1.5 bg-white/20 rounded-full">
              <div className="h-full bg-white w-[64%] rounded-full"></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold opacity-80 uppercase tracking-widest">New</span>
              <span className="text-sm font-extrabold">36%</span>
            </div>
            <div className="w-full h-1.5 bg-white/20 rounded-full">
              <div className="h-full bg-white/50 w-[36%] rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 sm:mt-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
        <p className="text-xs font-medium leading-relaxed italic">
          &ldquo;Returning customers spend <span className="font-extrabold">2.4x more</span> on average than first-time buyers.&rdquo;
        </p>
      </div>
    </div>
  );
};

export default CustomerInsights;
