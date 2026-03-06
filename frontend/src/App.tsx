import React from 'react';
import { GraphViewer } from './components/graph/GraphViewer';
import { AgentChat } from './components/chat/AgentChat';
import { TimelineSlider } from './components/timeline/TimelineSlider';

function App() {
    return (
        <div className="flex h-screen bg-gray-900 text-white">
            <div className="flex-1 flex flex-col relative">
                <GraphViewer />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-2/3 bg-gray-800 p-4 rounded-xl shadow-lg">
                    <TimelineSlider />
                </div>
            </div>
            <div className="w-96 border-l border-gray-700 bg-gray-800 flex flex-col">
                <AgentChat />
            </div>
        </div>
    );
}

export default App;
