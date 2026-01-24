import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { formatCurrency } from "@/lib/data-service";

interface LeaderboardData {
    label: string;
    revenue: number;
    orders: number;
}

interface LeaderboardCardProps {
    data: LeaderboardData[];
    isLoading: boolean;
}

export default function LeaderboardCard({ data, isLoading }: LeaderboardCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Performing Franchises</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2 py-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-10 w-full animate-pulse bg-muted rounded" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4 pt-2">
                        {data.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className={`
                    flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                    ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            index === 1 ? 'bg-gray-100 text-gray-700' :
                                                index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground'}
                  `}>
                                        {index + 1}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{item.label}</span>
                                        <span className="text-xs text-muted-foreground">{item.orders} orders</span>
                                    </div>
                                </div>
                                <span className="text-sm font-bold">{formatCurrency(item.revenue)}</span>
                            </div>
                        ))}
                        {data.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
