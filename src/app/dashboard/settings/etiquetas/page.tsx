import EtiquetasSection from '@/components/settings/EtiquetasSection';

export default function EtiquetasPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Etiquetas</h1>
      </div>
      <EtiquetasSection />
    </div>
  );
}
