import { MessageSquareText } from 'lucide-react';

export default function BoasVindasPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mensagem de Boas Vindas</h1>
      </div>
      <div className="card p-8 text-center border-dashed">
        <MessageSquareText size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-gray-500 text-sm font-medium">Em construção</p>
      </div>
    </div>
  );
}
