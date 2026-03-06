import React from 'react';

export const AgentChat: React.FC = () => {
    // TODO: Add chat history, input field, and API connection
    return (
        <div className="flex-1 p-4 flex flex-col">
            <h2 className="text-xl font-bold mb-4">Codebase Agent</h2>
            <div className="flex-1 overflow-y-auto border border-gray-700 rounded p-2 text-sm text-gray-300">
                <p>Agent: How can I help you explore this repo?</p>
            </div>
            <div className="mt-4 flex">
                <input type="text" placeholder="Ask a question..." className="flex-1 bg-gray-700 rounded-l p-2 outline-none" />
                <button className="bg-blue-600 px-4 rounded-r font-semibold">Send</button>
            </div>
        </div>
    );
};
