// Reusable Coming Soon page component
export default function ComingSoonPage({ title, description }: { title: string; description?: string }) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
        <div className="text-center">
          <div className="text-6xl mb-6">🚧</div>
          <h1 className="text-2xl font-normal mb-3" style={{ color: '#16191f' }}>{title}</h1>
          <p className="text-sm mb-6" style={{ color: '#545b64', maxWidth: 400 }}>
            {description || 'This feature is coming soon. The core functionality of Route 53 is available in Hosted Zones and DNS Records.'}
          </p>
          <div className="inline-flex items-center px-4 py-2 rounded text-sm"
            style={{ backgroundColor: '#f2f3f3', color: '#545b64', border: '1px solid #d5d9d9' }}>
            🔔 Feature under development
          </div>
        </div>
      </div>
    </div>
  );
}
