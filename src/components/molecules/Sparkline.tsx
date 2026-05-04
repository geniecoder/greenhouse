import React, { useState } from "react";
import { View } from "react-native";
import Svg, {
    Line,
    Path,
    Polyline,
    Text as SvgText,
} from "react-native-svg";

type Props = {
    data: number[];
    height?: number;
    unit?: string;
    smooth?: boolean;
};

export default function Sparkline({
    data,
    height = 120,
    unit = "",
    smooth = true,
}: Props) {
    const [width, setWidth] = useState(0);

    if (!data || data.length === 0) return null;

    const paddingLeft = 44;
    const paddingRight = 8;
    const fontSize = 10;

    const paddingTop = fontSize + 6;
    const paddingBottom = fontSize + 6;

    const chartWidth = Math.max(width - paddingLeft - paddingRight, 0);
    const chartHeight = Math.max(height - paddingTop - paddingBottom, 0);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // NORMAL (sharp)
    const points =
        width > 0
            ? data
                .map((value, index) => {
                    const x =
                        paddingLeft +
                        (data.length === 1
                            ? chartWidth / 2
                            : (index / (data.length - 1)) * chartWidth);

                    const y =
                        paddingTop +
                        (chartHeight - ((value - min) / range) * chartHeight);

                    return `${x},${y}`;
                })
                .join(" ")
            : "";

    // SMOOTH path
    const createSmoothPath = () => {
        if (data.length < 2 || width === 0) return "";

        const path: string[] = [];
        const tension = .25;

        for (let i = 0; i < data.length; i++) {
            const x =
                paddingLeft +
                (data.length === 1
                    ? chartWidth / 2
                    : (i / (data.length - 1)) * chartWidth);

            const y =
                paddingTop +
                (chartHeight - ((data[i] - min) / range) * chartHeight);

            if (i === 0) {
                path.push(`M ${x} ${y}`);
            } else {
                const prevX =
                    paddingLeft +
                    ((i - 1) / (data.length - 1)) * chartWidth;

                const prevY =
                    paddingTop +
                    (chartHeight -
                        ((data[i - 1] - min) / range) * chartHeight);

                const cx1 = prevX + (x - prevX) * tension;
                const cy1 = prevY;

                const cx2 = x - (x - prevX) * tension;
                const cy2 = y;

                path.push(`C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x} ${y}`);
            }
        }

        return path.join(" ");
    };

    const smoothPath = createSmoothPath();

    const gridLines = 5;

    const grid = Array.from({ length: gridLines + 1 }).map((_, i) => {
        const y = paddingTop + (chartHeight / gridLines) * i;
        const value = max - (i / gridLines) * range;

        return {
            y,
            value: Math.round(value),
        };
    });

    return (
        <View
            style={{ width: "100%" }}
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        >
            {width > 0 && (
                <Svg width={width} height={height}>
                    {/* Grid */}
                    {grid.map((g, i) => (
                        <Line
                            key={`line-${i}`}
                            x1={paddingLeft}
                            y1={g.y}
                            x2={width - paddingRight}
                            y2={g.y}
                            stroke="#ddd"
                            strokeWidth="1"
                        />
                    ))}

                    {/* Labels */}
                    {grid.map((g, i) => (
                        <SvgText
                            key={`label-${i}`}
                            x={4}
                            y={g.y + fontSize / 2 - 2}
                            fontSize={fontSize}
                            fill="#666"
                        >
                            {g.value}
                            {unit}
                        </SvgText>
                    ))}

                    {/* 👇 Conditional render */}
                    {smooth ? (
                        <Path
                            d={smoothPath}
                            fill="none"
                            stroke="purple"
                            strokeWidth="2"
                        />
                    ) : (
                        <Polyline
                            points={points}
                            fill="none"
                            stroke="purple"
                            strokeWidth="2"
                        />
                    )}
                </Svg>
            )}
        </View>
    );
}