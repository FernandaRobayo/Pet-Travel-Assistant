import {Button} from '@/components/ui/button';

export default function ResourceState({loading,error,retry}: {loading: boolean; error: string; retry: ()=>void}) {
  if (loading) return <p role="status" className="py-6 text-sm text-gray-600">Cargando…</p>;
  if (error) return <div className="space-y-3"><p role="alert" className="text-sm text-red-700">{error}</p><Button variant="outline" onClick={retry}>Reintentar</Button></div>;
  return null;
}
