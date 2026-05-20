"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Bot, User, ShieldCheck } from "lucide-react"
import Cookies from "js-cookie"

function formatDistanceToNow(date: Date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
}

interface AuditEvent {
    id: string
    timestamp: string
    actor_type: "AGENT" | "USER"
    actor_id: string
    action_type: string
    resource_target: string
    outcome: "SUCCESS" | "FAILED"
    details: string
}

export function AuditLogTable() {
    const params = useParams()
    const clusterId = params.id as string
    const [events, setEvents] = useState<AuditEvent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = Cookies.get("token")
                const res = await fetch(`/api/v1/clusters/${clusterId}/audit`, {
                    headers: { "Authorization": `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setEvents(data)
                }
            } catch (error) {
                console.error("Failed to fetch audit logs", error)
            } finally {
                setLoading(false)
            }
        }

        fetchLogs()
        const interval = setInterval(fetchLogs, 5000)
        return () => clearInterval(interval)
    }, [clusterId])

    return (
        <Card className="border-t-4 border-t-blue-500">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-bold">Audit Trail</CardTitle>
                        <CardDescription className="text-xs">Immutable record of system actions</CardDescription>
                    </div>
                    <Badge variant="outline" className="gap-1 text-xs">
                        <ShieldCheck className="h-3 w-3 text-green-500" />
                        SOC2
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-[300px] overflow-y-auto">
                    <Table>
                        <TableHeader className="bg-muted/50 sticky top-0">
                            <TableRow>
                                <TableHead className="py-2 h-8 text-xs w-[100px]">Time</TableHead>
                                <TableHead className="py-2 h-8 text-xs w-[120px]">Actor</TableHead>
                                <TableHead className="py-2 h-8 text-xs w-[100px]">Action</TableHead>
                                <TableHead className="py-2 h-8 text-xs w-[150px]">Target</TableHead>
                                <TableHead className="py-2 h-8 text-xs w-[80px]">Outcome</TableHead>
                                <TableHead className="py-2 h-8 text-xs">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-xs text-muted-foreground">
                                        Loading audit logs...
                                    </TableCell>
                                </TableRow>
                            ) : events.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-xs text-muted-foreground">
                                        No recent actions recorded.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                events.map((event) => (
                                    <TableRow key={event.id} className="hover:bg-muted/50 border-b border-muted/50">
                                        <TableCell className="py-2 text-xs font-mono text-muted-foreground">
                                            {formatDistanceToNow(new Date(event.timestamp))}
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <div className="flex items-center gap-1.5">
                                                {event.actor_type === "AGENT" ? (
                                                    <Bot className="h-3 w-3 text-blue-400" />
                                                ) : (
                                                    <User className="h-3 w-3 text-slate-400" />
                                                )}
                                                <span className="text-xs font-medium text-foreground">{event.actor_id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <Badge variant="secondary" className="text-[10px] h-5 font-mono">
                                                {event.action_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-2 text-xs font-mono text-muted-foreground truncate max-w-[150px]" title={event.resource_target}>
                                            {event.resource_target}
                                        </TableCell>
                                        <TableCell className="py-2">
                                            {event.outcome === "SUCCESS" ? (
                                                <span className="text-[10px] font-bold text-green-500">SUCCESS</span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-red-500">FAILED</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-2 text-xs text-muted-foreground truncate max-w-[300px]" title={event.details}>
                                            {event.details}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
