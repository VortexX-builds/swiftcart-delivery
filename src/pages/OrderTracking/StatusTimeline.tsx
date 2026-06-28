import { CheckCircle2, ChefHat, Bike, PartyPopper } from 'lucide-react';

export type OrderStatus = 0 | 1 | 2 | 3;
// 0 = Order Placed, 1 = Preparing, 2 = On the Way, 3 = Delivered

interface Step {
  icon: React.ReactNode;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: <CheckCircle2 className="w-4 h-4" />,
    label: 'Order Placed',
    description: 'We have received your order',
  },
  {
    icon: <ChefHat className="w-4 h-4" />,
    label: 'Preparing',
    description: 'The store is packing your items',
  },
  {
    icon: <Bike className="w-4 h-4" />,
    label: 'On the Way',
    description: 'Your rider is heading to you',
  },
  {
    icon: <PartyPopper className="w-4 h-4" />,
    label: 'Delivered',
    description: 'Enjoy your order!',
  },
];

interface StatusTimelineProps {
  currentStatus: OrderStatus;
}

export default function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="text-sm font-bold text-gray-900 mb-5">Order Status</h2>
      <div className="space-y-0">
        {STEPS.map((step, index) => {
          const isDone = index < currentStatus;
          const isActive = index === currentStatus;
          const isPending = index > currentStatus;

          return (
            <div key={index} className="flex gap-3.5">
              {/* Icon column */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500
                    ${isDone ? 'bg-black text-white shadow-md shadow-black/25' : ''}
                    ${isActive ? 'bg-black text-white shadow-lg shadow-black/40 ring-4 ring-black/10' : ''}
                    ${isPending ? 'bg-gray-100 text-gray-300' : ''}
                  `}
                >
                  {isActive && !isDone ? (
                    // Pulse animation on active icon
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
                      <span className="relative">{step.icon}</span>
                    </div>
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 min-h-[28px] my-1 rounded-full transition-colors duration-700
                      ${index < currentStatus ? 'bg-black' : 'bg-gray-100'}
                    `}
                  />
                )}
              </div>

              {/* Text column */}
              <div className="pb-5 pt-1 flex-1 min-w-0">
                <p
                  className={`text-sm font-black transition-colors duration-300
                    ${isActive ? 'text-black' : isDone ? 'text-gray-900' : 'text-gray-300'}
                  `}
                >
                  {step.label}
                </p>
                <p
                  className={`text-xs mt-0.5 font-bold transition-colors duration-300
                    ${isActive ? 'text-black/60' : isDone ? 'text-gray-400' : 'text-gray-200'}
                  `}
                >
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
