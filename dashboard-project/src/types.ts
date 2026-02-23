export interface ChartConfig {
    type: 'line' | 'bar' | 'pie' | 'scatter';
    title: string;
    xLabel?: string;
    yLabel?: string;
}

export enum DashboardTheme {
    LIGHT = 'light',
    DARK = 'dark'
}

export interface ChartDataPoint {
    x: string | number;
    y: number;
    label?: string;
}
