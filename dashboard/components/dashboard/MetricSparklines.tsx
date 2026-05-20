"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Cpu, HardDrive, Network } from "lucide-react"
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts"

interface MetricSparklinesProps {
    data: any[]
}

export function MetricSparklines({ data }: MetricSparklinesProps) {
    // Helper to render a single sparkline card
    const SparklineCard = ({ title, icon: Icon, dataKey, color, value, subtext }: any) => (
        <Card className="bg-card/50 backdrop-blur-sm border-muted">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mb-4">{subtext}</p>
                <div className="h-[40px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <Line
                                type="monotone"
                                dataKey={dataKey}
                                stroke={color === "text-green-500" ? "#22c55e" :
                                    color === "text-blue-500" ? "#3b82f6" :
                                        color === "text-purple-500" ? "#a855f7" : "#eab308"}
                                strokeWidth={2}
                                dot={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', fontSize: '12px' }}
                                itemStyle={{ color: '#fff' }}
                                labelStyle={{ display: 'none' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )

    const latest = data[data.length - 1] || {}
    const oldest = data[0] || {}

    // Compute actual trend text from sliding window data
    function trendText(key: string, unit: string): string {
        if (data.length < 2) return "Collecting data..."
        const oldVal = oldest[key] ?? 0
        const newVal = latest[key] ?? 0
        if (oldVal === 0) return "No baseline"
        const diff = newVal - oldVal
        const sign = diff >= 0 ? "+" : ""
        return `${sign}${diff.toFixed(1)}${unit} over window`
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SparklineCard
                title="Latency (P95)"
                icon={Activity}
                dataKey="latency"
                color="text-yellow-500"
                value={`${(latest.latency ?? 0).toFixed(1)} ms`}
                subtext={trendText("latency", "ms")}
            />
            <SparklineCard
                title="Error Rate"
                icon={Network}
                dataKey="errors"
                color="text-red-500"
                value={`${(latest.errors ?? 0).toFixed(2)}%`}
                subtext={trendText("errors", "%")}
            />
            <SparklineCard
                title="CPU Saturation"
                icon={Cpu}
                dataKey="cpu"
                color="text-blue-500"
                value={`${(latest.cpu ?? 0).toFixed(1)}%`}
                subtext={trendText("cpu", "%")}
            />
            <SparklineCard
                title="Memory Usage"
                icon={HardDrive}
                dataKey="mem"
                color="text-purple-500"
                value={`${(latest.mem ?? 0).toFixed(2)} GB`}
                subtext={trendText("mem", "GB")}
            />
        </div>
    )
}
