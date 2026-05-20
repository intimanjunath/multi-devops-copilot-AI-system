"use client"

import { useState, useEffect } from "react"
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
import { ShieldCheck, User, Bot, ServerCrash, RotateCcw, AlertTriangle } from "lucide-react"

function formatDistanceToNow(date: Date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    if (minutes > 0) return `${minutes} mins ago`;
    return `${seconds} secs ago`;
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

export default function AuditLogPage() {
    const params = useParams()
    const clusterId = params.id as string
    const [events, setEvents] = useState<AuditEvent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Poll for audit logs
        const fetchLogs = async () => {
            try {
                const res = await fetch(`/api/v1/clusters/${clusterId}/audit`)
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Audit Trail</h2>
                    <p className="text-muted-foreground">
                        Immutable record of all remediation actions and system changes.
                    </p>
                </div>
                <Badge variant="outline" className="h-8 gap-1">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    SOC2 Compliant
                </Badge>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        Showing actions taken by SRE Agent and authorized users.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Actor</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Target</TableHead>
                                <TableHead>Outcome</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        Loading audit trail...
                                    </TableCell>
                                </TableRow>
                            ) : events.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        No audit events found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                events.map((event) => (
                                    <TableRow key={event.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {formatDistanceToNow(new Date(event.timestamp))}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {event.actor_type === "AGENT" ? (
                                                    <Bot className="h-4 w-4 text-primary" />
                                                ) : (
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span className="font-medium">{event.actor_id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {event.action_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {event.resource_target}
                                        </TableCell>
                                        <TableCell>
                                            {event.outcome === "SUCCESS" ? (
                                                <Badge className="bg-green-500 hover:bg-green-600">Success</Badge>
                                            ) : (
                                                <Badge variant="destructive">Failed</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-[300px] truncate text-muted-foreground">
                                            {event.details}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
