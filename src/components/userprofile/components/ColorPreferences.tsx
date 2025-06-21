import React from "react";
import { Label } from "./ui/label.tsx";
import { Palette } from "lucide-react";

interface FormData {
  favoriteColors: string[];
}

interface ColorPreferencesProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

const ColorPreferences: React.FC<ColorPreferencesProps> = ({ formData, setFormData }) => {
  // Convert HSL to hex
  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // Generate a 10x10 color palette grid
  const generateColorPalette = (): string[][] => {
    const rows = 10;
    const columns = 10;
    const hues = [0, 30, 60, 90, 120, 180, 210, 240, 270, 300];
    const lightness = [90, 80, 70, 60, 50, 45, 40, 35, 30, 20];

    const palette: string[][] = [];

    for (let row = 0; row < rows; row++) {
      const rowColors: string[] = [];
      for (let col = 0; col < columns; col++) {
        const h = hues[col];
        const l = lightness[row];
        let s = 100 - row * 5;

        if (row >= 7) {
          s = Math.max(s, 40);
        }

        rowColors.push(hslToHex(h, s, l));
      }
      palette.push(rowColors);
    }

    return palette;
  };

  const colorGrid = generateColorPalette();

  const handleColorSelection = (color: string) => {
    let updatedColors = [...(formData.favoriteColors || [])];

    if (updatedColors.includes(color)) {
      updatedColors = updatedColors.filter((c) => c !== color);
    } else {
      updatedColors.push(color);
    }

    setFormData((prev) => ({
      ...prev,
      favoriteColors: updatedColors
    }));
  };

  const getTextColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128 ? "text-white" : "text-black";
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-1">
        <div className="inline-block mb-4">
          <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
            Style Preferences
          </span>
        </div>
        <h3 className="text-2xl font-display font-medium tracking-tight flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Color Preferences
        </h3>
        <p className="text-muted-foreground text-sm">
          Select colors that you like to wear or prefer in your clothing
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Color Palette</h4>
            <p className="text-xs text-muted-foreground">
              Selected: {(formData.favoriteColors || []).length}
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="grid grid-cols-10 gap-1 bg-gray-50 rounded-md p-2">
              {colorGrid.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  {row.map((color, colIndex) => {
                    const textColorClass = getTextColor(color);
                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        type="button"
                        className={`aspect-square relative transition-all hover:z-10 hover:scale-110 hover:shadow-lg ${
                          (formData.favoriteColors || []).includes(color)
                            ? "ring-2 ring-offset-1 z-10 shadow-md"
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorSelection(color)}
                      >
                        {(formData.favoriteColors || []).includes(color) && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-[8px] ${textColorClass}`}>✓</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {(formData.favoriteColors || []).length > 0 && (
        <div className="pt-2">
          <h4 className="font-medium text-sm mb-2">Selected Colors</h4>
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md border">
            {(formData.favoriteColors || []).map((color, index) => (
              <div
                key={index}
                className="w-6 h-6 rounded-full shadow-sm cursor-pointer transition-transform hover:scale-110 border border-white/50"
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelection(color)}
                title="Click to remove"
              ></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPreferences;
