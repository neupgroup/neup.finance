import { FinancialStory } from './financial-story';
import { FinancialUniverse } from './financial-universe';
import { Integrations } from './integrations';
import { SmartProjections } from './smart-projections';
import { ExpenseAutopilot } from './expense-autopilot';

export function Dashboard() {
  return (
    <div className="grid gap-6 md:gap-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2">
            <FinancialUniverse />
        </div>
        <div className="space-y-6 md:space-y-8">
            <FinancialStory />
            <SmartProjections />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <ExpenseAutopilot />
        <Integrations />
      </div>
    </div>
  );
}
