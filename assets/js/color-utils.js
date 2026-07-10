const LIGHT_TEXT = "#ffffff";
const DARK_TEXT = "#111827";

export function getContrastTextColor(backgroundColor) {
    const backgroundLuminance = getRelativeLuminance(backgroundColor);

    if (backgroundLuminance === null) return LIGHT_TEXT;

    const lightContrast = getContrastRatio(backgroundLuminance, getRelativeLuminance(LIGHT_TEXT));
    const darkContrast = getContrastRatio(backgroundLuminance, getRelativeLuminance(DARK_TEXT));

    return darkContrast > lightContrast ? DARK_TEXT : LIGHT_TEXT;
}

function getRelativeLuminance(color) {
    const match = String(color || "").trim().match(/^#([0-9a-f]{6})$/i);

    if (!match) return null;

    const channels = match[1].match(/.{2}/g).map(channel => {
        const value = Number.parseInt(channel, 16) / 255;

        return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
    });

    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function getContrastRatio(first, second) {
    const lighter = Math.max(first, second);
    const darker = Math.min(first, second);

    return (lighter + 0.05) / (darker + 0.05);
}
