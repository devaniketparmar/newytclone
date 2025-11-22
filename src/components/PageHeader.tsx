import React from 'react';
import { useRouter } from 'next/router';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  actions?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'minimal';
  sticky?: boolean;
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  icon,
  iconColor = 'bg-indigo-600',
  actions,
  className = '',
  variant = 'default',
  sticky = true,
  children
}: PageHeaderProps) {
  const router = useRouter();

  const getVariantClasses = () => {
    switch (variant) {
      case 'glass':
        return 'bg-white/80 backdrop-blur-sm border-neutral-200';
      case 'minimal':
        return 'bg-transparent border-transparent';
      default:
        return 'bg-white border-neutral-200';
    }
  };

  const getStickyClasses = () => {
    return sticky ? 'sticky top-0 z-40' : '';
  };

  return (
    <div className={`${getVariantClasses()} border-b ${getStickyClasses()} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {icon && (
                <div className={`w-8 h-8 ${iconColor} rounded-lg flex items-center justify-center`}>
                  {icon}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-neutral-600 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            
            {actions && (
              <div className="flex items-center space-x-4">
                {actions}
              </div>
            )}
          </div>
          
          {children && (
            <div className="mt-6">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Specialized header components for common patterns
export function SearchPageHeader({
  title,
  subtitle,
  searchComponent,
  actions,
  className = '',
  sticky = true
}: {
  title: string;
  subtitle?: string;
  searchComponent: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      actions={actions}
      className={className}
      sticky={sticky}
    >
      {searchComponent}
    </PageHeader>
  );
}

export function CategoryPageHeader({
  title,
  subtitle,
  categoryBar,
  actions,
  className = '',
  sticky = true
}: {
  title: string;
  subtitle?: string;
  categoryBar: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      actions={actions}
      className={className}
      sticky={sticky}
    >
      {categoryBar}
    </PageHeader>
  );
}

export function StatsPageHeader({
  title,
  subtitle,
  stats,
  actions,
  className = '',
  sticky = true
}: {
  title: string;
  subtitle?: string;
  stats: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      actions={actions}
      className={className}
      sticky={sticky}
    >
      {stats}
    </PageHeader>
  );
}
