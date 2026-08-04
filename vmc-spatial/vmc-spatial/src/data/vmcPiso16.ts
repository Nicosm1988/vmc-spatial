import type { VmcDocument } from '../types'
import { lensPlate } from '../lib/plate'
const ANCHO=62000, ALTO=40000
const PLATE=lensPlate({cx:31000,cy:20000,halfL:29500,halfW:16000,pointiness:0.38,steps:72})
const CORE=[{x:24500,y:20000},{x:30500,y:14300},{x:42500,y:17931},{x:42500,y:22069},{x:30500,y:25700}]
export const VMC_PISO_16: VmcDocument = {
 schema:'vmc-spatial/6', nombre:'VMC · Piso 16', piso:'Torre YPF · Puerto Madero · Piso 16',
 ancho:ANCHO, alto:ALTO, alturaLibre:2900, plate:PLATE, core:CORE, actualizado:new Date().toISOString(),
 zonas:[
  {id:'core',nombre:'Núcleo',kind:'nucleo',cx:33000,cy:20000,color:'#0a1636',puestos:0,ocupacion:100,datalizacion:95,nota:'Núcleo.'},
  {id:'cl1',nombre:'Isla 1',kind:'bench',cx:52920,cy:9477,rot:2.2777,pairs:6,color:'#5b6cf0',puestos:12,ocupacion:75,datalizacion:65,nota:'Isla.'},
  {id:'cl2',nombre:'Isla 2',kind:'bench',cx:14243,cy:10648,rot:2.4068,pairs:6,color:'#1f8fff',puestos:12,ocupacion:75,datalizacion:65,nota:'Isla.'},
  {id:'cl3',nombre:'Isla 3',kind:'bench',cx:56322,cy:10868,rot:2.2515,pairs:6,color:'#5b6cf0',puestos:12,ocupacion:75,datalizacion:65,nota:'Isla.'},
  {id:'cl4',nombre:'Isla 4',kind:'bench',cx:41938,cy:11563,rot:0.7261,pairs:6,color:'#1657ce',puestos:12,ocupacion:75,datalizacion:65,nota:'Isla.'},
  {id:'cl5',nombre:'Isla 5',kind:'bench',cx:18421,cy:13650,rot:2.4033,pairs:6,color:'#1f8fff',puestos:12,ocupacion:75,datalizacion:65,nota:'Isla.'},
  {id:'cl6',nombre:'Isla 6',kind:'bench',cx:15139,cy:25801,rot:0.7295,pairs:4,color:'#17a9a0',puestos:8,ocupacion:75,datalizacion:65,nota:'Isla.'},
  {id:'cl7',nombre:'Isla 7',kind:'bench',cx:44445,cy:27888,rot:2.6267,pairs:6,color:'#03c1bd',puestos:12,ocupacion:75,datalizacion:65,nota:'Isla.'},
  {id:'cl8',nombre:'Isla 8',kind:'bench',cx:7021,cy:29022,rot:2.3108,pairs:5,color:'#17a9a0',puestos:10,ocupacion:75,datalizacion:65,nota:'Isla.'},
  {id:'cl9',nombre:'Isla 9',kind:'bench',cx:22301,cy:29352,rot:0.6807,pairs:4,color:'#17a9a0',puestos:8,ocupacion:75,datalizacion:65,nota:'Isla.'},
  {id:'cl10',nombre:'Isla 10',kind:'bench',cx:47011,cy:30669,rot:2.6215,pairs:6,color:'#03c1bd',puestos:12,ocupacion:75,datalizacion:65,nota:'Isla.'},
  {id:'cl11',nombre:'Isla 11',kind:'bench',cx:9528,cy:30962,rot:2.3091,pairs:6,color:'#17a9a0',puestos:12,ocupacion:75,datalizacion:65,nota:'Isla.'},
  {id:'cl12',nombre:'Isla 12',kind:'bench',cx:19018,cy:31475,rot:0.6597,pairs:4,color:'#17a9a0',puestos:8,ocupacion:75,datalizacion:65,nota:'Isla.'},
  {id:'pod1',nombre:'Mesa redonda 1',kind:'circular',cx:26718,cy:8013,r:1650,color:'#2f6f7a',puestos:0,ocupacion:40,datalizacion:15,nota:'Mesa.'},
  {id:'pod2',nombre:'Mesa redonda 2',kind:'circular',cx:52980,cy:8892,r:1650,color:'#2f6f7a',puestos:0,ocupacion:40,datalizacion:15,nota:'Mesa.'},
  {id:'pod3',nombre:'Mesa redonda 3',kind:'circular',cx:6663,cy:20970,r:1650,color:'#2f6f7a',puestos:0,ocupacion:40,datalizacion:15,nota:'Mesa.'},
  {id:'pod4',nombre:'Mesa redonda 4',kind:'circular',cx:61932,cy:20311,r:1650,color:'#2f6f7a',puestos:0,ocupacion:40,datalizacion:15,nota:'Mesa.'},
  {id:'pod5',nombre:'Mesa redonda 5',kind:'circular',cx:6783,cy:32316,r:1650,color:'#2f6f7a',puestos:0,ocupacion:40,datalizacion:15,nota:'Mesa.'},
  {id:'pod6',nombre:'Mesa redonda 6',kind:'circular',cx:26718,cy:33195,r:1650,color:'#2f6f7a',puestos:0,ocupacion:40,datalizacion:15,nota:'Mesa.'},
  {id:'com-e1',nombre:'Comedor e1',kind:'comedor',cx:57038,cy:17969,w:3600,h:1600,rot:0.3491,color:'#8a5a2b',puestos:0,ocupacion:45,datalizacion:20,nota:'Comedor.'},
  {id:'com-e2',nombre:'Comedor e2',kind:'comedor',cx:58113,cy:22837,w:3600,h:1600,rot:-0.3491,color:'#8a5a2b',puestos:0,ocupacion:45,datalizacion:20,nota:'Comedor.'},
  {id:'com-w1',nombre:'Comedor w1',kind:'comedor',cx:6783,cy:18993,w:3600,h:1600,rot:0.0,color:'#8a5a2b',puestos:0,ocupacion:45,datalizacion:20,nota:'Comedor.'},
 ],
 videoWalls:[
  {id:'vw-ne',nombre:'Pared Frente-Norte',x1:30860,y1:14409,x2:42140,y2:17822,pantallas:20,filas:2},
  {id:'vw-se',nombre:'Pared Frente-Sur',x1:42140,y1:22178,x2:30860,y2:25591,pantallas:30,filas:3},
  {id:'vw-no',nombre:'Pared Atrás-Norte',x1:24680,y1:19829,x2:30320,y2:14471,pantallas:24,filas:2},
  {id:'vw-so',nombre:'Pared Atrás-Sur',x1:30320,y1:25529,x2:24680,y2:20171,pantallas:24,filas:2},
 ],
 orientacion:[],
}