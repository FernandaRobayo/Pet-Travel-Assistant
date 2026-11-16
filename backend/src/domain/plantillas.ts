// Supuesto (DP-18 abierto en el SRS): tres plantillas base con tareas genéricas.
// No contienen reglas de ningún país ni empresa (SWR-CON-003); el usuario puede modificarlas libremente (SWR-CHK-007).
export interface Plantilla {id: string; nombre: string; tareas: readonly string[]}

export const PLANTILLAS: readonly Plantilla[] = [
  {id: 'avion', nombre: 'Viaje en avión con mascota', tareas: [
    'Confirmar con la aerolínea las condiciones para viajar con mascota',
    'Reservar el cupo de la mascota en el vuelo',
    'Verificar medidas y condiciones de la transportadora',
    'Reunir el carné de vacunación',
    'Reunir el certificado veterinario',
    'Agendar la revisión veterinaria previa al viaje'
  ]},
  {id: 'carro', nombre: 'Viaje por carretera con mascota', tareas: [
    'Preparar transportadora o arnés de seguridad',
    'Planificar paradas de descanso para la mascota',
    'Llevar agua, alimento y recipientes',
    'Reunir el carné de vacunación',
    'Confirmar alojamiento que acepte mascotas'
  ]},
  {id: 'bus', nombre: 'Viaje en bus con mascota', tareas: [
    'Confirmar con la empresa de transporte si admite mascotas',
    'Verificar medidas y condiciones de la transportadora',
    'Reunir el carné de vacunación',
    'Llevar agua, alimento y elementos de aseo',
    'Confirmar alojamiento que acepte mascotas'
  ]}
];

export function buscarPlantilla(id: string): Plantilla | undefined {
  return PLANTILLAS.find((plantilla) => plantilla.id === id);
}
