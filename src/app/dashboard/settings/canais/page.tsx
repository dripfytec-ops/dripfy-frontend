import CanaisSection from '@/components/settings/CanaisSection';

export default function CanaisPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Canais</h1>
      </div>
      <CanaisSection />
    </div>
  );
}
