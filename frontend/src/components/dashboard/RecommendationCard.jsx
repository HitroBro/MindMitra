import { Link } from 'react-router-dom';
import { AlertTriangle, Heart, Wind, BookOpen, Smile, CalendarHeart, ArrowRight } from 'lucide-react';

const ICON_BY_TYPE = {
  professional_help: CalendarHeart,
  emergency_support: AlertTriangle,
  breathing_exercise: Wind,
  meditation: Heart,
  mood_support: Smile,
  journal_prompt: BookOpen,
  self_care: Heart,
};

const STYLE_BY_PRIORITY = {
  urgent: 'border-clay-500/40 bg-clay-500/5',
  high: 'border-amber-500/40 bg-amber-500/5',
  medium: 'border-teal-600/20 bg-sand-50',
  low: 'border-teal-600/10 bg-sand-50',
};

const RecommendationCard = ({ recommendation }) => {
  const Icon = ICON_BY_TYPE[recommendation.type] || Heart;

  return (
    <div className={`rounded-2xl border p-4 flex gap-3 ${STYLE_BY_PRIORITY[recommendation.priority]}`}>
      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 text-teal-600">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-teal-900">{recommendation.title}</p>
        <p className="text-xs text-teal-700/70 mt-1 leading-relaxed">{recommendation.description}</p>
        {recommendation.action && (
          <Link to={recommendation.action.link} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:underline mt-2">
            {recommendation.action.label} <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default RecommendationCard;