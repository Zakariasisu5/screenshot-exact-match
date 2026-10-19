import {createFileRoute} from '@tanstack/react-router'
import {ShipmentList} from '@/components/remitship/shipment-list'
import {pageHead} from '@/lib/remitship'
export const Route=createFileRoute('/_authenticated/admin/')({head:()=>pageHead('Operations Overview','RemitShip staff shipment statistics and operations workspace.'),component:()=> <ShipmentList overview/>})
