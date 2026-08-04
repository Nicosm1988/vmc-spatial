import type { VmcDocument, Zone } from '../types'
import { lensPlate } from '../lib/plate'
const ANCHO=62000, ALTO=40000
const PLATE=lensPlate({cx:31000,cy:20000,halfL:29500,halfW:16000,pointiness:0.38,steps:72})
const CORE=[{x:24500,y:20000},{x:30500,y:14300},{x:42500,y:17931},{x:42500,y:22069},{x:30500,y:25700}]
const bench=(id,nombre,cx,cy,rot,pairs,color,ocu,dat,nota)=>({id,nombre,kind:'bench',cx,cy,rot,pairs,color,puestos:pairs*2,ocupacion:ocu,datalizacion:dat,nota})
export const VMC_PISO_16: VmcDocument = {
 schema:'vmc-spatial/5', nombre:'VMC · Piso 16', piso:'Torre YPF · Puerto Madero · Piso 16',
 ancho:ANCHO, alto:ALTO, alturaLibre:2900, plate:PLATE, core:CORE, actualizado:new Date().toISOString(),
 zonas:[
  {id:'core',nombre:'Núcleo · Diamante',kind:'nucleo',cx:33000,cy:20000,color:'#0a1636',puestos:0,ocupacion:100,datalizacion:95,nota:'Núcleo con pantallas en las 4 caras.'},
  bench('cl1','Isla 1',52920,9477,2.2777,6,'#5b6cf0',75,65,'Cluster de escritorios (calcado del plano).'),
  bench('cl2','Isla 2',14243,10648,2.4068,6,'#1f8fff',75,65,'Cluster de escritorios (calcado del plano).'),
  bench('cl3','Isla 3',56322,10868,2.2515,6,'#5b6cf0',75,65,'Cluster de escritorios (calcado del plano).'),
  bench('cl4','Isla 4',41938,11563,0.7261,6,'#1657ce',75,65,'Cluster de escritorios (calcado del plano).'),
  bench('cl5','Isla 5',18421,13650,2.4033,6,'#1f8fff',75,65,'Cluster de escritorios (calcado del plano).'),
  bench('cl6','Isla 6',15139,25801,0.7295,4,'#17a9a0',75,65,'Cluster de escritorios (calcado del plano).'),
  bench('cl7','Isla 7',44445,27888,2.6267,6,'#03c1bd',75,65,'Cluster de escritorios (calcado del plano).'),
  bench('cl8','Isla 8',7021,29022,2.3108,5,'#17a9a0',75,65,'Cluster de escritorios (calcado del plano).'),
  bench('cl9','Isla 9',22301,29352,0.6807,4,'#17a9a0',75,65,'Cluster de escritorios (calcado del plano).'),
  bench('cl10','Isla 10',47011,30669,2.6215,6,'#03c1bd',75,65,'Cluster de escritorios (calcado del plano).'),
  bench('cl11','Isla 11',9528,30962,2.3091,6,'#17a9a0',75,65,'Cluster de escritorios (calcado del plano).'),
  bench('cl12','Isla 12',19018,31475,0.6597,4,'#17a9a0',75,65,'Cluster de escritorios (calcado del plano).'),
  {id:'pod1',nombre:'Mesa redonda 1',kind:'circular',cx:26718,cy:8013,r:1650,color:'#2f6f7a',puestos:0,ocupacion:40,datalizacion:15,nota:'Mesa redonda (reunión).'},
  {id:'pod2',nombre:'Mesa redonda 2',kind:'circular',cx:52980,cy:8892,r:1650,color:'#2f6f7a',puestos:0,ocupacion:40,datalizacion:15,nota:'Mesa redonda (reunión).'},
  {id:'pod3',nombre:'Mesa redonda 3',kind:'circular',cx:6663,cy:20970,r:1650,color:'#2f6f7a',puestos:0,ocupacion:40,datalizacion:15,nota:'Mesa redonda (reunión).'},
  {id:'pod4',nombre:'Mesa redonda 4',kind:'circular',cx:61932,cy:20311,r:1650,color:'#2f6f7a',puestos:0,ocupacion:40,datalizacion:15,nota:'Mesa redonda (reunión).'},
  {id:'pod5',nombre:'Mesa redonda 5',kind:'circular',cx:6783,cy:32316,r:1650,color:'#2f6f7a',puestos:0,ocupacion:40,datalizacion:15,nota:'Mesa redonda (reunión).'},
  {id:'pod6',nombre:'Mesa redonda 6',kind:'circular',cx:26718,cy:33195,r:1650,color:'#2f6f7a',puestos:0,ocupacion:40,datalizacion:15,nota:'Mesa redonda (reunión).'},
  {id:'com-e1',nombre:'Sala/Comedor e1',kind:'comedor',cx:57038,cy:17969,w:3600,h:1600,rot:0.3491,color:'#8a5a2b',puestos:0,ocupacion:45,datalizacion:20,nota:'Mesa larga con sillas.'},
  {id:'com-e2',nombre:'Sala/Comedor e2',kind:'comedor',cx:58113,cy:22837,w:3600,h:1600,rot:-0.3491,color:'#8a5a2b',puestos:0,ocupacion:45,datalizacion:20,nota:'Mesa larga con sillas.'},
  {id:'com-w1',nombre:'Sala/Comedor w1',kind:'comedor',cx:6783,cy:18993,w:3600,h:1600,rot:0.0,color:'#8a5a2b',puestos:0,ocupacion:45,datalizacion:20,nota:'Mesa larga con sillas.'},
 ],
 videoWalls:[
  {id:'vw-ne',nombre:'Pared Frente-Norte',x1:30860,y1:14409,x2:42140,y2:17822,pantallas:20,filas:2},
  {id:'vw-se',nombre:'Pared Frente-Sur',x1:42140,y1:22178,x2:30860,y2:25591,pantallas:30,filas:3},
  {id:'vw-no',nombre:'Pared Atrás-Norte',x1:24680,y1:19829,x2:30320,y2:14471,pantallas:24,filas:2},
  {id:'vw-so',nombre:'Pared Atrás-Sur',x1:30320,y1:25529,x2:24680,y2:20171,pantallas:24,filas:2},
 ],
 orientacion:[{texto:'N · Macacha Güemes',x:31000,y:4600},{texto:'S · Manuela Sáenz',x:31000,y:35800},{texto:'FONDO · Oeste',x:4200,y:20000,rot:-90},{texto:'FRENTE · Este',x:59200,y:20000,rot:90}],
}