// Background colors for different table and facility types
export const getBackgroundColorForItemType = (item: string) => {
    const colorMap: { [key: string]: string } = {
        // Table types
        'table-2': '#FFE08A', // Warm yellow - 2 seater
        'table-4': '#7FD3E0', // Teal blue - 4 seater
        'table-6': '#8FD694', // Fresh green - 6 seater
        'table-8': '#E07C84', // Soft red - 8 seater
        'table-12': '#B0B3B8', // Medium gray - 12 seater

        // Facility types
        'washroom': '#CBA6F7', // Purple - washroom
        'counter': '#FFB580',  // Orange - counter
        'entry-gate': '#9EDC9E', // Mint green - entry gate
        'exit-gate': '#F5A9C0', // Rose pink - exit gate

        // Default fallback
        'default': '#E1E4E8' // Neutral gray
    };

    return colorMap[item] || colorMap['default'];
};
