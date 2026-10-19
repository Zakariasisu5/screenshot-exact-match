import {createFileRoute} from '@tanstack/react-router'
import {ShipmentList} from '@/components/remitship/shipment-list'
import {pageHead} from '@/lib/remitship'
export const Route=createFileRoute('/_authenticated/admin/shipments')({head:()=>pageHead('Manage Shipments','Search, filter, and manage authorized RemitShip shipments.'),component:ShipmentList})
