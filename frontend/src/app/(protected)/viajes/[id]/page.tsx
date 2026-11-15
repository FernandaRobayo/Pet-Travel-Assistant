import ViajeScreen from '@/components/viajes/viaje-screen';
export default async function ViajePage({params}: {params:Promise<{id:string}>}){const {id}=await params;return <ViajeScreen id={id}/>;}
