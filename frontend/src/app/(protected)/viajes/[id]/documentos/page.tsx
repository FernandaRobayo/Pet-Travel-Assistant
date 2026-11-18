import ViajeDocumentosScreen from '@/components/documentos/viaje-documentos-screen';
export default async function ViajeDocumentosPage({params}: {params:Promise<{id:string}>}){const {id}=await params;return <ViajeDocumentosScreen id={id}/>;}
