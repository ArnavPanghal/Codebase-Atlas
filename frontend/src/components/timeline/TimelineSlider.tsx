import React from 'react';

export const TimelineSlider: React.FC = () => {
    // TODO: Add standard slider connecting to commit history state
    return (
        <div className="flex flex-col items-center w-full">
            <label className="text-sm font-semibold mb-2">Git Time Machine</label>
            <input type="range" className="w-full cursor-pointer" min="0" max="100" />
            <div className="flex justify-between w-full text-xs text-gray-400 mt-1">
                <span>Initial Commit</span>
                <span>Current (HEAD)</span>
            </div>
        </div>
    );
};
