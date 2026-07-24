import BmTokensSection from '@/components/settings/BmTokensSection';

export default function TokensPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tokens Meta</h1>
      </div>
      <BmTokensSection />
    </div>
  );
}
