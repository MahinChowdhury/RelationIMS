import { useState, useEffect } from 'react';
import api from '../../services/api';

interface CustomerInsightData {
  newCustomerCount: number;
  returningCustomerCount: number;
  totalCustomers: number;
  newCustomerPercentage: number;
  returningCustomerPercentage: number;
}

const CustomerInsights = () => {
  const [data, setData] = useState<CustomerInsightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerInsight();
  }, []);

  const fetchCustomerInsight = async () => {
    try {
      setLoading(true);
      const response = await api.get<CustomerInsightData>('/customerinsight/alltime');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch customer insight:', error);
    } finally {
      setLoading(false);
    }
  };

  const returningPercentage = data?.returningCustomerPercentage ?? 0;
  const newPercentage = data?.newCustomerPercentage ?? 0;

  return (
    <div className="col-span-12 lg:col-span-6 bg-primary text-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl shadow-primary/20 flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-5 sm:mb-6">
          <div>
            <h4 className="text-lg font-extrabold tracking-tight">Customer Insights</h4>
            <p className="text-xs opacity-80 mt-1">All Time</p>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold opacity-80 uppercase tracking-widest">Returning</span>
                <span className="text-sm font-extrabold">{returningPercentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/20 rounded-full">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500" 
                  style={{ width: `${returningPercentage}%` }}
                ></div>
              </div>
              <p className="text-[10px] opacity-60 mt-1">{data?.returningCustomerCount || 0} customers</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold opacity-80 uppercase tracking-widest">New</span>
                <span className="text-sm font-extrabold">{newPercentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/20 rounded-full">
                <div 
                  className="h-full bg-white/50 rounded-full transition-all duration-500" 
                  style={{ width: `${newPercentage}%` }}
                ></div>
              </div>
              <p className="text-[10px] opacity-60 mt-1">{data?.newCustomerCount || 0} customers</p>
            </div>
          </div>
        )}
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
