import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info
};

const colors = {
  success: 'bg-green-500/10 border-green-500/20 text-green-500',
  error: 'bg-red-500/10 border-red-500/20 text-red-500',
  warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-500'
};

export default function CustomToast({ type = 'info', message, title }) {
  const Icon = icons[type];
  const colorClasses = colors[type];

  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border ${colorClasses} text-sm`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        {title && (
          <p className="font-medium text-sm">
            {title}
          </p>
        )}
        <p className="text-xs opacity-90">
          {message}
        </p>
      </div>
    </div>
  );
}
