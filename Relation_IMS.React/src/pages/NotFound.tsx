import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-black text-primary/20">404</h1>
        <h2 className="text-2xl font-bold text-text-main dark:text-white mt-4">
          {t('pageNotFound.title', 'Page Not Found')}
        </h2>
        <p className="text-text-secondary mt-2 mb-8">
          {t('pageNotFound.description', "The page you're looking for doesn't exist or has been moved.")}
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined">home</span>
          {t('pageNotFound.goHome', 'Go to Dashboard')}
        </Link>
      </div>
    </div>
  );
}