'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Route53Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="aws-breadcrumb mb-4">
        Route 53 &rsaquo; Dashboard
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-normal" style={{ color: '#16191f' }}>Route 53 dashboard</h1>
      </div>

      {/* Service overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <DashCard
          title="Hosted zones"
          description="Manage your DNS records"
          href="/route53/hosted-zones"
          icon="🌐"
        />
        <DashCard
          title="Health checks"
          description="Monitor endpoint health"
          href="/route53/health-checks"
          icon="❤️"
          comingSoon
        />
        <DashCard
          title="Traffic policies"
          description="Create routing policies"
          href="/route53/traffic-policies"
          icon="⇄"
          comingSoon
        />
        <DashCard
          title="Resolver"
          description="Resolve DNS queries"
          href="/route53/resolver"
          icon="↔️"
          comingSoon
        />
        <DashCard
          title="Profiles"
          description="Manage profile associations"
          href="/route53/profiles"
          icon="👤"
          comingSoon
        />
        <DashCard
          title="IP-based routing"
          description="Route traffic by client IP"
          href="/route53/ip-routing"
          icon="📡"
          comingSoon
        />
      </div>

      {/* Info panel */}
      <div className="aws-panel p-6 mb-4">
        <h2 className="text-lg font-medium mb-3" style={{ color: '#16191f' }}>Getting started</h2>
        <div className="text-sm" style={{ color: '#545b64' }}>
          <p className="mb-2">Amazon Route 53 is a scalable and highly available Domain Name System (DNS) web service.</p>
          <p>To get started, <a href="/route53/hosted-zones" className="aws-link">create a hosted zone</a> for your domain name.</p>
        </div>
      </div>

      {/* Account info */}
      <div className="aws-panel p-4">
        <div className="text-sm text-gray-500">
          Signed in as <strong>{user?.username}</strong> · Account ID: <strong>{user?.account_id}</strong>
        </div>
      </div>
    </div>
  );
}

function DashCard({ title, description, href, icon, comingSoon }: {
  title: string; description: string; href: string; icon: string; comingSoon?: boolean;
}) {
  return (
    <a href={href} className={`aws-panel p-5 block transition-shadow hover:shadow-md ${comingSoon ? 'opacity-75' : ''}`} style={{ textDecoration: 'none' }}>
      <div className="flex items-start">
        <div className="text-2xl mr-3">{icon}</div>
        <div>
          <div className="font-medium text-sm mb-1" style={{ color: '#0073bb' }}>{title}</div>
          <div className="text-xs" style={{ color: '#545b64' }}>{description}</div>
          {comingSoon && (
            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#f2f3f3', color: '#545b64' }}>
              Coming soon
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
