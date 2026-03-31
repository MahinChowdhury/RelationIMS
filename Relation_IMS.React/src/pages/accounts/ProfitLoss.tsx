import ProfitLossHeader from '../../components/accounts/ProfitLossHeader';
import ProfitLossPerformanceCards from '../../components/accounts/ProfitLossPerformanceCards';
import ProfitLossTable from '../../components/accounts/ProfitLossTable';
import ProfitLossCalculations from '../../components/accounts/ProfitLossCalculations';
import {
    profitLossMetrics,
    profitLossStatement,
    profitLossFinalCalc,
} from './mockData';

const ProfitLoss = () => {
    return (
        <div className="p-4 sm:p-6 lg:p-10 pb-8 sm:pb-10 lg:pb-12 min-h-screen">
            <div className="max-w-[1400px] mx-auto">
                <ProfitLossHeader />
                <ProfitLossPerformanceCards metrics={profitLossMetrics} />
                <ProfitLossTable rows={profitLossStatement} />
                <ProfitLossCalculations data={profitLossFinalCalc} />
            </div>
        </div>
    );
};

export default ProfitLoss;
