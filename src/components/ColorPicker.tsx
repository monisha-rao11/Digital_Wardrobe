import React from 'react';
import { motion } from 'framer-motion';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-4">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 cursor-pointer rounded-lg"
      />
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 rounded-lg shadow-md"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            const newValue = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(newValue)) {
              onChange(newValue);
            }
          }}
          className="ml-4 px-3 py-2 border rounded-md w-32 font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}